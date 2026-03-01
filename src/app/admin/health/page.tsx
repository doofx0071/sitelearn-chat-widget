"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  Activity,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminContentLayout } from "@/components/admin-panel/admin-content-layout";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrawlJobStatus = Doc<"crawlJobs">["status"];
type CrawlDepth = NonNullable<Doc<"crawlJobs">["depth"]>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-2.5 w-36 rounded bg-muted/60" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-2 w-full rounded-full bg-muted" />
      <div className="flex items-center gap-4">
        <div className="h-2.5 w-20 rounded bg-muted/60" />
        <div className="h-2.5 w-20 rounded bg-muted/60" />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted/60" />
          </div>
          <div className="h-3 w-16 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CrawlJobStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    animate?: boolean;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  running: {
    label: "Running",
    icon: Loader2,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    animate: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    className:
      "border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
  },
};

function StatusBadge({ status }: { status: CrawlJobStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      <Icon className={cn("h-3 w-3", config.animate && "animate-spin")} />
      {config.label}
    </Badge>
  );
}

// ─── Depth badge ──────────────────────────────────────────────────────────────

const DEPTH_CONFIG: Record<CrawlDepth, { label: string; className: string }> =
  {
    single: {
      label: "Single",
      className:
        "border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
    },
    nested: {
      label: "Nested",
      className:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    full: {
      label: "Full",
      className:
        "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  };

function DepthBadge({ depth }: { depth: CrawlDepth | undefined }) {
  if (!depth) return <span className="text-xs text-muted-foreground/50 italic">—</span>;
  const config = DEPTH_CONFIG[depth] ?? DEPTH_CONFIG.single;
  return (
    <Badge
      variant="outline"
      className={cn("px-2 py-0.5 text-[11px] font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  processed,
  total,
  failed,
}: {
  processed: number;
  total: number;
  failed: number;
}) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  const failedPct = total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {/* Processed (success) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.max(0, pct - failedPct)}%` }}
        />
        {/* Failed segment */}
        <div
          className="absolute inset-y-0 rounded-full bg-rose-500 transition-all"
          style={{
            left: `${Math.max(0, pct - failedPct)}%`,
            width: `${failedPct}%`,
          }}
        />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {processed}/{total} pages
        </span>
        {failed > 0 && (
          <span className="text-rose-500">{failed} failed</span>
        )}
        <span className="ml-auto tabular-nums font-medium">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Duration ────────────────────────────────────────────────────────────────

function duration(startedAt: number | undefined): string {
  if (!startedAt) return "—";
  const secs = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Job Card (for running jobs) ─────────────────────────────────────────────

function JobCard({ job }: { job: Doc<"crawlJobs"> }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={job.status} />
              <DepthBadge depth={job.depth} />
            </div>
            <code className="text-xs font-mono text-muted-foreground truncate block max-w-[240px]">
              {job.projectId}
            </code>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs text-muted-foreground">
              {relativeTime(job._creationTime)}
            </div>
            {job.startedAt && (
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {duration(job.startedAt)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ProgressBar
          processed={job.processedUrls}
          total={job.totalUrls}
          failed={job.failedUrls}
        />
        {job.error && (
          <p className="mt-2 text-xs text-rose-500 truncate">
            {job.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHealthPage() {
  const jobs = useQuery(api.admin.listActiveJobs) as
    | Doc<"crawlJobs">[]
    | undefined;
  const isLoading = jobs === undefined;

  const runningJobs = jobs?.filter((j) => j.status === "running") ?? [];
  const pendingJobs = jobs?.filter((j) => j.status === "pending") ?? [];
  const totalUrls = jobs?.reduce((acc, j) => acc + j.totalUrls, 0) ?? 0;
  const processedUrls = jobs?.reduce((acc, j) => acc + j.processedUrls, 0) ?? 0;

  return (
    <AdminContentLayout title="Super Admin · Health">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              System Health
            </h1>
            <p className="text-sm text-muted-foreground">
              Active and pending crawl jobs across all workspaces.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 shrink-0">
            <Activity className="h-3 w-3 text-emerald-500" />
            <span className="text-xs">Live</span>
          </Badge>
        </div>

        {/* Summary cards row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Running Jobs",
              value: isLoading ? "…" : runningJobs.length,
              description: "Currently active crawl workers",
              icon: Loader2,
              valueColor:
                runningJobs.length > 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-foreground",
              iconClass: runningJobs.length > 0 ? "animate-spin text-blue-500" : "text-muted-foreground",
              iconBg: runningJobs.length > 0 ? "bg-blue-500/10" : "bg-muted",
            },
            {
              title: "Pending Jobs",
              value: isLoading ? "…" : pendingJobs.length,
              description: "Jobs queued for execution",
              icon: Clock,
              valueColor:
                pendingJobs.length > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground",
              iconClass:
                pendingJobs.length > 0
                  ? "text-amber-500"
                  : "text-muted-foreground",
              iconBg:
                pendingJobs.length > 0 ? "bg-amber-500/10" : "bg-muted",
            },
            {
              title: "Pages Queued",
              value: isLoading ? "…" : totalUrls.toLocaleString(),
              description: "Total URLs across active jobs",
              icon: Layers,
              valueColor: "text-foreground",
              iconClass: "text-violet-500",
              iconBg: "bg-violet-500/10",
            },
            {
              title: "Pages Processed",
              value: isLoading ? "…" : processedUrls.toLocaleString(),
              description: "Crawled across active jobs",
              icon: CheckCircle2,
              valueColor: "text-foreground",
              iconClass: "text-emerald-500",
              iconBg: "bg-emerald-500/10",
            },
          ].map(
            ({
              title,
              value,
              description,
              icon: Icon,
              valueColor,
              iconClass,
              iconBg,
            }) => (
              <Card key={title} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wider">
                      {title}
                    </CardDescription>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        iconBg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", iconClass)} />
                    </div>
                  </div>
                  <CardTitle
                    className={cn(
                      "text-3xl font-bold tabular-nums",
                      valueColor
                    )}
                  >
                    {value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Running jobs: card grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Active Jobs
            </h2>
            {!isLoading && (
              <span className="text-xs text-muted-foreground">
                {runningJobs.length + pendingJobs.length} job
                {runningJobs.length + pendingJobs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No active jobs
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  All crawl workers are idle. New jobs will appear here
                  automatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job: Doc<"crawlJobs">) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Full detail table */}
        {!isLoading && jobs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Job Details</CardTitle>
              <CardDescription>
                Granular breakdown of all active crawl operations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Project
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Depth
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Processed
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Failed
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Running For
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: Doc<"crawlJobs">) => (
                    <TableRow key={job._id}>
                      <TableCell className="pl-4">
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono text-muted-foreground truncate max-w-[160px] block">
                          {job.projectId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <DepthBadge depth={job.depth} />
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {job.processedUrls}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {job.totalUrls}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {job.failedUrls > 0 ? (
                          <span className="text-rose-500">{job.failedUrls}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {duration(job.startedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {relativeTime(job._creationTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Full detail skeleton */}
        {isLoading && (
          <Card>
            <CardHeader className="pb-3">
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="p-0">
              <TableSkeleton rows={4} />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminContentLayout>
  );
}
