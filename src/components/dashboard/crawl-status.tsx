"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  RotateCcw,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CrawlStatus = "pending" | "running" | "completed" | "failed";

export interface CrawlJob {
  id: string;
  projectName: string;
  domain: string;
  status: CrawlStatus;
  pagesDiscovered: number;
  pagesProcessed: number;
  pagesFailed: number;
  totalEstimated?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

interface CrawlStatusProps {
  job: CrawlJob;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  compact?: boolean;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800",
    description: "Waiting to start...",
  },
  running: {
    label: "Running",
    icon: Loader2,
    badgeClass: "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    description: "Crawling in progress",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
    description: "Crawl finished successfully",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    badgeClass: "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800",
    description: "Crawl encountered errors",
  },
};

function formatDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins === 0) return `${diffSecs}s`;
  if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}

export function CrawlStatusCard({
  job,
  onCancel,
  onRetry,
  compact = false,
}: CrawlStatusProps) {
  const [elapsed, setElapsed] = useState<string>("");
  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  const progress =
    job.totalEstimated && job.totalEstimated > 0
      ? Math.min(Math.round((job.pagesProcessed / job.totalEstimated) * 100), 100)
      : job.status === "completed"
      ? 100
      : job.pagesDiscovered > 0
      ? Math.min(Math.round((job.pagesProcessed / job.pagesDiscovered) * 100), 99)
      : 0;

  // Update elapsed time for running jobs
  useEffect(() => {
    if (job.status !== "running" || !job.startedAt) return;
    const update = () => setElapsed(formatDuration(job.startedAt!));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [job.status, job.startedAt]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <StatusIcon
          className={cn(
            "h-4 w-4 shrink-0",
            job.status === "running" && "animate-spin text-blue-500",
            job.status === "completed" && "text-emerald-500",
            job.status === "failed" && "text-red-500",
            job.status === "pending" && "text-amber-500"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium">{job.domain}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {job.pagesProcessed.toLocaleString()} pages
            </span>
          </div>
          {job.status === "running" && (
            <Progress value={progress} className="mt-1.5 h-1" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Status bar accent */}
      <div
        className={cn(
          "h-1",
          job.status === "running" && "bg-blue-500",
          job.status === "completed" && "bg-emerald-500",
          job.status === "failed" && "bg-red-500",
          job.status === "pending" && "bg-amber-500"
        )}
      >
        {job.status === "running" && (
          <div className="h-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 bg-[length:200%_100%]" />
        )}
      </div>

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {job.projectName}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 px-1.5 text-[10px] font-medium",
                  config.badgeClass
                )}
              >
                <StatusIcon
                  className={cn(
                    "mr-1 h-2.5 w-2.5",
                    job.status === "running" && "animate-spin"
                  )}
                />
                {config.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{job.domain}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {job.status === "running" && onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onCancel(job.id)}
                aria-label="Cancel crawl"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {job.status === "failed" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => onRetry(job.id)}
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {job.status === "completed"
                ? "Completed"
                : job.status === "pending"
                ? "Queued"
                : `${progress}% processed`}
            </span>
            {job.status === "running" && elapsed && (
              <span className="text-muted-foreground">{elapsed} elapsed</span>
            )}
            {job.status === "completed" && job.startedAt && job.completedAt && (
              <span className="text-muted-foreground">
                {formatDuration(job.startedAt, job.completedAt)}
              </span>
            )}
          </div>
          <Progress
            value={progress}
            className={cn(
              "h-2",
              job.status === "failed" && "[&>div]:bg-red-500",
              job.status === "completed" && "[&>div]:bg-emerald-500",
              job.status === "running" && "[&>div]:bg-blue-500"
            )}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCell
            icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Discovered"
            value={job.pagesDiscovered.toLocaleString()}
            className="text-foreground"
          />
          <StatCell
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            label="Processed"
            value={job.pagesProcessed.toLocaleString()}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <StatCell
            icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
            label="Failed"
            value={job.pagesFailed.toLocaleString()}
            className={job.pagesFailed > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}
          />
        </div>

        {/* Error message */}
        {job.status === "failed" && job.errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 dark:border-red-900 dark:bg-red-950/30">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <p className="text-xs text-red-700 dark:text-red-400">{job.errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCell({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md bg-muted/40 p-2.5 text-center">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-base font-semibold tabular-nums leading-none", className)}>
        {value}
      </span>
    </div>
  );
}
