"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  Building2,
  Zap,
  Globe,
  Crown,
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

type WorkspacePlan = Doc<"workspaces">["plan"];

// listWorkspaces returns workspace doc + projectCount
interface WorkspaceWithStats extends Doc<"workspaces"> {
  projectCount: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-36 rounded bg-muted" />
            <div className="h-2.5 w-24 rounded bg-muted/60" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-8 rounded bg-muted/60" />
          <div className="h-3 w-28 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<
  WorkspacePlan,
  { label: string; icon: React.ElementType; className: string }
> = {
  free: {
    label: "Free",
    icon: Layers,
    className:
      "border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    className:
      "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

function PlanBadge({ plan }: { plan: WorkspacePlan }) {
  const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

// ─── Summary Pill ─────────────────────────────────────────────────────────────

interface SummaryPillProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading: boolean;
}

function SummaryPill({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading,
}: SummaryPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          iconBg
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground leading-none">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {isLoading ? "…" : value}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWorkspacesPage() {
  const workspaces = useQuery(api.admin.listWorkspaces) as
    | WorkspaceWithStats[]
    | undefined;
  const isLoading = workspaces === undefined;

  const freePlanCount =
    workspaces?.filter((w) => w.plan === "free").length ?? 0;
  const proPlanCount = workspaces?.filter((w) => w.plan === "pro").length ?? 0;
  const entPlanCount =
    workspaces?.filter((w) => w.plan === "enterprise").length ?? 0;
  const totalProjects =
    workspaces?.reduce((acc, w) => acc + w.projectCount, 0) ?? 0;

  return (
    <AdminContentLayout title="Super Admin · Workspaces">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Workspaces
          </h1>
          <p className="text-sm text-muted-foreground">
            All tenant workspaces with plan tier and project counts.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <SummaryPill
            label="Total Workspaces"
            value={workspaces?.length ?? 0}
            icon={Building2}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Free Plan"
            value={freePlanCount}
            icon={Layers}
            iconColor="text-zinc-500"
            iconBg="bg-zinc-400/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Pro Plan"
            value={proPlanCount}
            icon={Zap}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Enterprise"
            value={entPlanCount}
            icon={Crown}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Total Projects"
            value={totalProjects}
            icon={Globe}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            isLoading={isLoading}
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Workspace List
            </CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading workspaces…"
                : `${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""} total`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={8} />
            ) : workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No workspaces yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Workspaces will appear here once users sign up.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Workspace
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Plan
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Projects
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Max Projects
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Billing Email
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((workspace: WorkspaceWithStats) => {
                    const utilizationPct = Math.round(
                      (workspace.projectCount / workspace.maxProjects) * 100
                    );
                    return (
                      <TableRow key={workspace._id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground select-none uppercase">
                              {workspace.name.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {workspace.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                /{workspace.slug}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PlanBadge plan={workspace.plan} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums">
                              {workspace.projectCount}
                            </span>
                            {/* Mini utilization bar */}
                            <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full transition-all",
                                  utilizationPct >= 90
                                    ? "bg-rose-500"
                                    : utilizationPct >= 60
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {workspace.maxProjects}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {workspace.billingEmail ?? (
                            <span className="italic opacity-50">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(workspace.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
