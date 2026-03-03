"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  RefreshCw,
  Settings,
  Code2,
  MessageSquare,
  FileText,
  LayoutDashboard,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Check,
  Bot,
  AlignLeft,
  Bug,
  Eye,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { CrawlStatusCard, type CrawlJob } from "@/components/dashboard/crawl-status";
import { ChatPlayground } from "@/components/dashboard/chat-playground";
import { EmbedCode } from "@/components/dashboard/embed-code";
import { ConversationsTab } from "@/components/dashboard/conversations-tab";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type TabValue = "overview" | "content" | "conversations" | "playground" | "settings" | "embed";
type LearningDepth = "single" | "nested" | "full";
type LearningSchedule = "daily" | "weekly" | "monthly" | "manual";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabValue>("overview");
  const [isRecrawling, setIsRecrawling] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);
  const previousProjectStatusRef = useRef<string | null>(null);
  const startCrawl = useMutation(api.crawl.start.startCrawl);
  const updateProjectSettings = useMutation(api.projects.updateSettings);
  
  const project = useQuery(api.projects.get, { projectId: id as Id<"projects"> });
  const detailStats = useQuery(api.projects.getDetailStats, {
    projectId: id as Id<"projects">,
  });
  const crawlDebug = useQuery(api.projects.getCrawlDebug, {
    projectId: id as Id<"projects">,
  });
  const pageContent = useQuery(
    api.projects.getPageContent,
    expandedPageUrl
      ? { projectId: id as Id<"projects">, url: expandedPageUrl }
      : "skip"
  );

  const indexedPages = detailStats?.recentPages ?? [];

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const [learningDepth, setLearningDepth] = useState<LearningDepth>("full");
  const [learningSchedule, setLearningSchedule] = useState<LearningSchedule>("weekly");
  const [excludedPathsInput, setExcludedPathsInput] = useState("");

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (
      requestedTab === "overview" ||
      requestedTab === "content" ||
      requestedTab === "conversations" ||
      requestedTab === "playground" ||
      requestedTab === "settings" ||
      requestedTab === "embed"
    ) {
      setTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!project) return;

    const learningConfig = project.learningConfig;
    setLearningDepth(learningConfig?.depth ?? "full");
    setLearningSchedule(learningConfig?.schedule ?? "weekly");
    setExcludedPathsInput((learningConfig?.excludedPaths ?? []).join("\n"));
  }, [project]);

  useEffect(() => {
    if (!project) return;

    const previous = previousProjectStatusRef.current;
    const current = project.crawlStatus ?? "idle";

    if (previous === "crawling" && current === "completed") {
      toast.success(`Learning finished for ${project.domain}`);
    }
    if (previous === "crawling" && current === "failed") {
      toast.error(`Learning failed for ${project.domain}`);
    }

    previousProjectStatusRef.current = current;
  }, [project]);

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleRecrawl = async () => {
    setIsRecrawling(true);
    try {
        await startCrawl({
          projectId: project._id,
          url: `https://${project.domain}`,
          depth: learningDepth,
        });
      toast.success("Re-learning started for " + project.domain);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start re-learning"
      );
    } finally {
      setIsRecrawling(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!project) return;

    setIsSavingConfig(true);
    try {
      const excludedPaths = excludedPathsInput
        .split("\n")
        .map((path) => path.trim())
        .filter(Boolean);

      await updateProjectSettings({
        projectId: project._id,
        botConfig: project.botConfig,
        learningConfig: {
          depth: learningDepth,
          schedule: learningSchedule,
          excludedPaths,
        },
      });

      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const crawlJob: CrawlJob = {
    id: project._id,
    projectName: project.name,
    domain: project.domain,
    status:
      project.crawlStatus === "crawling"
        ? "running"
        : project.crawlStatus === "completed"
          ? "completed"
          : project.crawlStatus === "failed"
            ? "failed"
            : "pending",
    pagesDiscovered: project.pageCount ?? 0,
    pagesProcessed: project.pageCount ?? 0,
    pagesFailed: 0,
    totalEstimated: project.pageCount ?? 0,
    startedAt: project.lastCrawledAt
      ? new Date(project.lastCrawledAt).toISOString()
      : undefined,
    completedAt: project.lastCrawledAt
      ? new Date(project.lastCrawledAt).toISOString()
      : undefined,
  };

  const statusBadge =
    project.crawlStatus === "crawling"
      ? {
          label: "Learning",
          className:
            "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
          dot: "bg-blue-500",
        }
      : project.crawlStatus === "failed"
        ? {
            label: "Failed",
            className:
              "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800",
            dot: "bg-amber-500",
          }
        : {
            label: "Active",
            className:
              "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
            dot: "bg-emerald-500",
          };

  return (
    <ContentLayout title={project.name}>
      <div className="mx-auto max-w-6xl">
          {/* Project header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {project.name}
                </h1>
                <a
                  href={`https://${project.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {project.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={statusBadge.className}
              >
                <span className={`mr-1 h-1.5 w-1.5 rounded-full inline-block ${statusBadge.dot}`} />
                {statusBadge.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRecrawl}
                disabled={isRecrawling}
              >
                {isRecrawling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Re-learn
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Pages indexed",
                value: (detailStats?.pagesIndexed ?? 0).toLocaleString(),
                icon: FileText,
                color: "text-blue-500",
              },
              {
                label: "Failed pages",
                value: (detailStats?.failedPages ?? 0).toLocaleString(),
                icon: AlertTriangle,
                color: "text-amber-500",
              },
              {
                label: "Last learned",
                value: formatRelativeTime(detailStats?.lastCrawledAt),
                icon: RefreshCw,
                color: "text-muted-foreground",
              },
              {
                label: "Conversations",
                value: (detailStats?.conversations ?? 0).toLocaleString(),
                icon: MessageSquare,
                color: "text-violet-500",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabValue)}
            className="mt-8"
          >
            <TabsList className="h-9 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
              {[
                { value: "overview", label: "Overview", icon: LayoutDashboard },
                { value: "content", label: "Content", icon: FileText },
                { value: "conversations", label: "Conversations", icon: MessageSquare },
                { value: "playground", label: "Playground", icon: Bot },
                { value: "settings", label: "Settings", icon: Settings },
                { value: "embed", label: "Embed", icon: Code2 },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <CrawlStatusCard
                job={crawlJob}
                onRetry={() => toast.success("Retry started")}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => setTab("playground")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Test chat in playground
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => setTab("embed")}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Get embed code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => setTab("settings")}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Configure bot
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {indexedPages.slice(0, 4).map((page, index) => (
                        <li
                          key={`${page.url}-${index}`}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                            <span className="truncate text-xs text-foreground">
                              {page.title}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {page.words.toLocaleString()} words
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Learning debug</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Latest learning run diagnostics and failed URLs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!crawlDebug?.latestJob ? (
                      <p className="text-xs text-muted-foreground">No learning job yet.</p>
                    ) : (
                      <>
                        <div className="grid gap-2 sm:grid-cols-4">
                          <div className="rounded-md border border-border px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground">Status</p>
                            <p className="text-xs font-medium capitalize">{crawlDebug.latestJob.status}</p>
                          </div>
                          <div className="rounded-md border border-border px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground">Depth</p>
                            <p className="text-xs font-medium uppercase">{crawlDebug.latestJob.depth}</p>
                          </div>
                          <div className="rounded-md border border-border px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground">Discovered</p>
                            <p className="text-xs font-medium">{crawlDebug.latestJob.totalUrls}</p>
                          </div>
                          <div className="rounded-md border border-border px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground">Processed / Failed</p>
                            <p className="text-xs font-medium">
                              {crawlDebug.latestJob.processedUrls} / {crawlDebug.latestJob.failedUrls}
                            </p>
                          </div>
                        </div>

                        {crawlDebug.latestJob.error ? (
                          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            {crawlDebug.latestJob.error}
                          </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-medium text-foreground">Recent discovered URLs</p>
                            <ul className="space-y-1">
                              {crawlDebug.recentDiscovered.slice(0, 8).map((row) => (
                                <li key={row.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1">
                                  <span className="truncate text-[11px] text-muted-foreground">{row.url}</span>
                                  <Badge variant="outline" className="h-4 px-1 text-[9px] capitalize">{row.status}</Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-medium text-foreground">Failed URLs</p>
                            <ul className="space-y-1">
                              {crawlDebug.failures.length === 0 ? (
                                <li className="text-[11px] text-muted-foreground">No failures in latest run.</li>
                              ) : (
                                crawlDebug.failures.slice(0, 8).map((row) => (
                                  <li key={row.id} className="rounded-md border border-border px-2 py-1">
                                    <p className="truncate text-[11px] text-muted-foreground">{row.url}</p>
                                    <p className="mt-0.5 text-[10px] text-destructive">{row.error}</p>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content */}
            <TabsContent value="content" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Indexed pages</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {indexedPages.length} pages learned from {project.domain}. Click the eye icon to preview page content.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleRecrawl}
                      disabled={isRecrawling}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isRecrawling ? "Re-learning..." : "Re-learn"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                            Page
                          </th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                            URL
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                            Words
                          </th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="px-3 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {indexedPages.map((page, index) => (
                          <PageRow
                            key={`${page.url}-${index}`}
                            page={page}
                            isExpanded={expandedPageUrl === page.url}
                            onToggle={() =>
                              setExpandedPageUrl(expandedPageUrl === page.url ? null : page.url)
                            }
                            pageContent={expandedPageUrl === page.url ? pageContent : null}
                            isLoading={expandedPageUrl === page.url && pageContent === undefined}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Playground */}
            <TabsContent value="playground" className="mt-6">
              <ChatPlayground
                projectId={id}
                projectName={project.name}
                projectDomain={project.domain}
              />
            </TabsContent>

            {/* Conversations */}
            <TabsContent value="conversations" className="mt-6">
              <ConversationsTab projectId={id} />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Learning settings</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Control how SiteLearn discovers and indexes your content. Private paths like /admin, /login, /checkout, /api, and /_next are always excluded automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Learning depth</Label>
                        <Select
                          value={learningDepth}
                          onValueChange={(value) => setLearningDepth(value as LearningDepth)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single" className="text-xs">Homepage only</SelectItem>
                            <SelectItem value="nested" className="text-xs">Homepage + one link level</SelectItem>
                            <SelectItem value="full" className="text-xs">Full site crawl</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          Use full site crawl for best coverage. Lower depth is useful for quick tests.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Re-learning schedule</Label>
                        <Select
                          value={learningSchedule}
                          onValueChange={(value) => setLearningSchedule(value as LearningSchedule)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                            <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                            <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                            <SelectItem value="manual" className="text-xs">Manual only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          Automatically refresh content to keep answers current.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Excluded paths{" "}
                        <span className="font-normal text-muted-foreground">(one per line)</span>
                      </Label>
                      <Textarea
                        value={excludedPathsInput}
                        onChange={(event) => setExcludedPathsInput(event.target.value)}
                        className="min-h-0 resize-none font-mono text-xs"
                        rows={3}
                        placeholder={"/private\n/members\n/internal-docs"}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Add extra paths to skip. One per line. Defaults for admin/auth/checkout/system paths are applied automatically.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handleSaveConfig} disabled={isSavingConfig}>
                  {isSavingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {isSavingConfig ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </TabsContent>

            {/* Embed */}
            <TabsContent value="embed" className="mt-6">
              <EmbedCode
                projectId={id}
                config={{
                  botName: project.botConfig.name,
                  welcomeMessage: project.botConfig.welcomeMessage,
                  primaryColor: project.botConfig.primaryColor,
                  position: project.botConfig.position,
                  headerFont: project.botConfig.headerFont ?? "modern",
                  avatarStyle: project.botConfig.avatarStyle ?? "bot",
                }}
                learningConfig={
                  project.learningConfig ?? {
                    depth: "full",
                    schedule: "weekly",
                    excludedPaths: [],
                  }
                }
              />
            </TabsContent>
          </Tabs>
      </div>
    </ContentLayout>
  );
}

// Page row component with expandable preview
interface PageRowProps {
  page: { url: string; title: string; words: number };
  isExpanded: boolean;
  onToggle: () => void;
  pageContent: { url: string; title: string; content: string; wordCount: number } | null | undefined;
  isLoading: boolean;
}

function PageRow({ page, isExpanded, onToggle, pageContent, isLoading }: PageRowProps) {
  return (
    <>
      <tr className={cn(
        "hover:bg-muted/30 transition-colors",
        isExpanded && "bg-muted/30"
      )}>
        <td className="px-3 py-2.5 font-medium text-foreground">
          {page.title}
        </td>
        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <span className="truncate max-w-[180px]">{page.url}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          </a>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
          {page.words.toLocaleString()}
        </td>
        <td className="px-3 py-2.5 text-center">
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
          >
            Learned
          </Badge>
        </td>
        <td className="px-3 py-2.5">
          <button
            onClick={onToggle}
            className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={isExpanded ? "Hide preview" : "Preview content"}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/20">
          <td colSpan={5} className="p-0">
            <div className="border-t border-border">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : pageContent?.content ? (
                <ContentPreview content={pageContent.content} />
              ) : (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No content available
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Content preview with secure Markdown rendering
function ContentPreview({ content }: { content: string }) {
  return (
    <div className="max-h-80 overflow-y-auto px-4 py-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        components={{
          h1: ({ children }) => (
            <h3 className="mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="mt-2 text-xs font-semibold text-foreground first:mt-0">{children}</h5>
          ),
          p: ({ children }) => <p className="leading-relaxed text-muted-foreground">{children}</p>,
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-3 text-[11px] text-foreground">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
