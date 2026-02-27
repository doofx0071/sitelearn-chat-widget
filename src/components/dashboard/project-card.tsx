"use client";

import { useState } from "react";
import {
  Globe,
  Clock,
  FileText,
  Settings,
  Code2,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ProjectStatus = "active" | "crawling" | "pending" | "failed" | "paused";

export interface Project {
  id: string;
  name: string;
  domain: string;
  status: ProjectStatus;
  pageCount: number;
  lastCrawled: string | null;
  favicon?: string;
}

interface ProjectCardProps {
  project: Project;
  onSettings?: (id: string) => void;
  onEmbedCode?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRecrawl?: (id: string) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  active: {
    label: "Active",
    variant: "default",
    className: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  },
  crawling: {
    label: "Crawling",
    variant: "secondary",
    className: "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  pending: {
    label: "Pending",
    variant: "outline",
    className: "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    className: "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800",
  },
  paused: {
    label: "Paused",
    variant: "secondary",
    className: "bg-slate-500/15 text-slate-700 border-slate-200 dark:text-slate-400 dark:border-slate-700",
  },
};

function formatLastCrawled(dateStr: string | null): string {
  if (!dateStr) return "Never crawled";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProjectCard({
  project,
  onSettings,
  onEmbedCode,
  onDelete,
  onRecrawl,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = statusConfig[project.status];

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group relative flex flex-col overflow-hidden transition-shadow duration-200",
          "hover:shadow-md",
          isHovered && "ring-1 ring-border"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Crawling pulse indicator */}
        {project.status === "crawling" && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>
        )}

        <CardContent className="flex-1 p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Favicon / Globe icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                {project.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.favicon}
                    alt=""
                    className="h-4 w-4 rounded-sm"
                  />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground leading-tight">
                  {project.name}
                </h3>
                <a
                  href={`https://${project.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">{project.domain}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              </div>
            </div>

            {/* Status badge + menu */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("h-5 px-1.5 text-[10px] font-medium", status.className)}
              >
                {status.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Project actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="gap-2 text-xs"
                    onClick={() => onSettings?.(project.id)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-xs"
                    onClick={() => onEmbedCode?.(project.id)}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Embed code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-xs"
                    onClick={() => onRecrawl?.(project.id)}
                    disabled={project.status === "crawling"}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-crawl
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-xs text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(project.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">
                      {project.pageCount.toLocaleString()}
                    </span>{" "}
                    pages
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Total indexed pages</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatLastCrawled(project.lastCrawled)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Last crawled</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="flex gap-2 border-t border-border bg-muted/30 px-4 py-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1.5 text-xs"
            onClick={() => onSettings?.(project.id)}
          >
            <Settings className="h-3 w-3" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1.5 text-xs"
            onClick={() => onEmbedCode?.(project.id)}
          >
            <Code2 className="h-3 w-3" />
            Embed
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
