"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import {
  Users,
  Building2,
  Globe,
  MessageSquare,
  TrendingUp,
  Activity,
  Database,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AdminContentLayout } from "@/components/admin-panel/admin-content-layout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  accent = "text-primary",
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            {title}
          </CardDescription>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-muted",
              accent
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1">
            <TrendingUp
              className={cn(
                "h-3 w-3",
                trendUp ? "text-emerald-500" : "text-rose-500 rotate-180"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                trendUp ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentActivityItem {
  label: string;
  time: string;
  type: "user" | "workspace" | "project" | "message";
}

const ACTIVITY_COLORS: Record<RecentActivityItem["type"], string> = {
  user: "bg-blue-500",
  workspace: "bg-violet-500",
  project: "bg-emerald-500",
  message: "bg-amber-500",
};

const ACTIVITY_BADGES: Record<RecentActivityItem["type"], string> = {
  user: "User",
  workspace: "Workspace",
  project: "Project",
  message: "Message",
};

export default function AdminOverviewPage() {
  const stats = useQuery(api.admin.getGlobalStats);
  const activeJobs = useQuery(api.admin.listActiveJobs);

  const totalUsers = stats?.totalUsers ?? 0;
  const totalWorkspaces = stats?.totalWorkspaces ?? 0;
  const totalProjects = stats?.totalProjects ?? 0;
  const totalMessages = stats?.totalMessages ?? 0;
  const totalChunks = stats?.totalChunks ?? 0;
  const totalCrawledPages = stats?.totalCrawledPages ?? 0;
  const totalConversations = stats?.totalConversations ?? 0;

  const freePlans = stats?.planDistribution?.free ?? 0;
  const proPlans = stats?.planDistribution?.pro ?? 0;
  const enterprisePlans = stats?.planDistribution?.enterprise ?? 0;

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const activity: RecentActivityItem[] = (activeJobs ?? []).slice(0, 8).map((job) => ({
    label: `Crawl ${job.status}: ${job.projectId}`,
    time: formatRelativeTime(job._creationTime),
    type: "project",
  }));

  return (
    <AdminContentLayout title="Super Admin · Overview">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Overview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Global stats across all workspaces and users.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Activity className="h-3 w-3 text-emerald-500" />
            <span className="text-xs">Live</span>
          </Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={totalUsers.toLocaleString()}
            description="Registered accounts across all workspaces"
            icon={Users}
            accent="text-blue-500"
          />
          <StatCard
            title="Workspaces"
            value={totalWorkspaces.toLocaleString()}
            description="Active tenant workspaces on the platform"
            icon={Building2}
            accent="text-violet-500"
          />
          <StatCard
            title="Projects"
            value={totalProjects.toLocaleString()}
            description="Chat widget projects created by users"
            icon={Globe}
            accent="text-emerald-500"
          />
          <StatCard
            title="Total Messages"
            value={totalMessages.toLocaleString()}
            description="AI-generated responses served to end users"
            icon={MessageSquare}
            accent="text-amber-500"
          />
        </div>

        {/* Secondary Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Storage</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Vector Chunks", value: totalChunks.toLocaleString() },
                  { label: "Crawled Pages", value: totalCrawledPages.toLocaleString() },
                  { label: "Conversations", value: totalConversations.toLocaleString() },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Plan Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Free", value: freePlans.toLocaleString(), color: "bg-zinc-400" },
                  { label: "Pro", value: proPlans.toLocaleString(), color: "bg-violet-500" },
                  { label: "Enterprise", value: enterprisePlans.toLocaleString(), color: "bg-amber-500" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", row.color)} />
                      <span className="text-muted-foreground">{row.label}</span>
                    </div>
                    <span className="font-medium tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  System Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Convex Backend", status: "Operational" },
                  { label: "Widget API", status: "Operational" },
                  { label: "Crawl Workers", status: "Operational" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activity.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      ACTIVITY_COLORS[item.type]
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                    <span className="truncate text-sm text-foreground">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                    {ACTIVITY_BADGES[item.type]}
                  </Badge>
                </li>
              ))}
              {activity.length === 0 && (
                <li className="text-sm text-muted-foreground">No recent activity.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
