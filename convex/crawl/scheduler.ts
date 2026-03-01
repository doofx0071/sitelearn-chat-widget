import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const DAILY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_MS = 7 * DAILY_MS;
const MONTHLY_MS = 30 * DAILY_MS;
const RETRY_WHEN_BUSY_MS = 15 * 60 * 1000;

function getScheduleDelayMs(schedule: "daily" | "weekly" | "monthly" | "manual"): number {
  if (schedule === "daily") return DAILY_MS;
  if (schedule === "weekly") return WEEKLY_MS;
  if (schedule === "monthly") return MONTHLY_MS;
  return 0;
}

export const getTask = internalQuery({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const setTaskStatus = internalMutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: {
      status: "pending" | "running" | "completed" | "failed";
      error?: string;
      scheduledAt?: number;
      startedAt?: number;
      completedAt?: number;
    } = {
      status: args.status,
    };

    if (args.status === "running") {
      patch.startedAt = Date.now();
    }
    if (args.status === "completed" || args.status === "failed") {
      patch.completedAt = Date.now();
    }
    if (args.error !== undefined) {
      patch.error = args.error;
    }
    if (args.scheduledAt !== undefined) {
      patch.scheduledAt = args.scheduledAt;
    }

    await ctx.db.patch(args.taskId, patch);
  },
});

export const syncScheduledRecrawlTask = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of existing) {
      if (task.type === "recrawl" && task.status === "pending") {
        await ctx.db.patch(task._id, {
          status: "failed",
          error: "Superseded by schedule refresh",
          completedAt: now,
        });
      }
    }

    const schedule = project.learningConfig?.schedule ?? "weekly";
    if (schedule === "manual") {
      return null;
    }

    const nextAt = (project.lastCrawledAt ?? now) + getScheduleDelayMs(schedule);
    const scheduledAt = Math.max(now, nextAt);

    const taskId = await ctx.db.insert("tasks", {
      projectId: project._id,
      workspaceId: project.workspaceId,
      type: "recrawl",
      status: "pending",
      scheduledAt,
    });

    return {
      taskId,
      delayMs: Math.max(0, scheduledAt - now),
    };
  },
});

export const refreshScheduledRecrawl = internalAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ taskId: Id<"tasks">; delayMs: number } | null> => {
    const task: { taskId: Id<"tasks">; delayMs: number } | null = await ctx.runMutation(
      internal.crawl.scheduler.syncScheduledRecrawlTask,
      {
        projectId: args.projectId,
      }
    );

    if (!task) {
      return null;
    }

    await ctx.scheduler.runAfter(task.delayMs, internal.crawl.scheduler.runScheduledRecrawlTask, {
      taskId: task.taskId,
    });

    return task;
  },
});

export const runScheduledRecrawlTask = internalAction({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.crawl.scheduler.getTask, {
      taskId: args.taskId,
    });

    if (!task || task.type !== "recrawl" || task.status !== "pending") {
      return;
    }

    const now = Date.now();
    if (task.scheduledAt > now) {
      await ctx.scheduler.runAfter(task.scheduledAt - now, internal.crawl.scheduler.runScheduledRecrawlTask, {
        taskId: task._id,
      });
      return;
    }

    const project = await ctx.runQuery(internal.crawl.workerMutations.getProject, {
      projectId: task.projectId,
    });
    if (!project) {
      await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
        taskId: task._id,
        status: "failed",
        error: "Project not found",
      });
      return;
    }

    if ((project.learningConfig?.schedule ?? "weekly") === "manual") {
      await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
        taskId: task._id,
        status: "failed",
        error: "Schedule set to manual",
      });
      return;
    }

    if (project.crawlStatus === "crawling") {
      const retryAt = Date.now() + RETRY_WHEN_BUSY_MS;
      await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
        taskId: task._id,
        status: "pending",
        scheduledAt: retryAt,
      });
      await ctx.scheduler.runAfter(RETRY_WHEN_BUSY_MS, internal.crawl.scheduler.runScheduledRecrawlTask, {
        taskId: task._id,
      });
      return;
    }

    await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
      taskId: task._id,
      status: "running",
    });

    try {
      await ctx.runMutation(internal.crawl.start.startCrawlInternal, {
        projectId: project._id,
        url: `https://${project.domain}`,
        depth: project.learningConfig?.depth,
      });

      await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
        taskId: task._id,
        status: "completed",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start scheduled re-learning";
      await ctx.runMutation(internal.crawl.scheduler.setTaskStatus, {
        taskId: task._id,
        status: "failed",
        error: message,
      });

      const rescheduled = await ctx.runMutation(internal.crawl.scheduler.syncScheduledRecrawlTask, {
        projectId: project._id,
      });

      if (rescheduled) {
        await ctx.scheduler.runAfter(
          rescheduled.delayMs,
          internal.crawl.scheduler.runScheduledRecrawlTask,
          { taskId: rescheduled.taskId }
        );
      }
    }
  },
});
