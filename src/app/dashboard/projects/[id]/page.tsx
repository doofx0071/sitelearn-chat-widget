"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Palette,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/dashboard/header";
import { CrawlStatusCard, type CrawlJob } from "@/components/dashboard/crawl-status";
import { ChatPlayground } from "@/components/dashboard/chat-playground";
import { EmbedCode } from "@/components/dashboard/embed-code";
import { toast } from "sonner";

// Mock project data — replace with Convex query
const MOCK_PROJECT = {
  id: "proj_1",
  name: "Acme Docs",
  domain: "docs.acme.com",
  status: "active" as const,
  pageCount: 1243,
  lastCrawled: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  botConfig: {
    name: "Acme Support Bot",
    welcomeMessage: "Hi! I can answer questions about our documentation. How can I help?",
    primaryColor: "#0F172A",
    position: "right" as const,
  },
};

const MOCK_CRAWL_JOB: CrawlJob = {
  id: "job_1",
  projectName: "Acme Docs",
  domain: "docs.acme.com",
  status: "completed",
  pagesDiscovered: 1243,
  pagesProcessed: 1243,
  pagesFailed: 3,
  totalEstimated: 1246,
  startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  completedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
};

const MOCK_PAGES = [
  { url: "docs.acme.com/getting-started", title: "Getting Started", indexed: true, words: 1240 },
  { url: "docs.acme.com/api/reference", title: "API Reference", indexed: true, words: 8910 },
  { url: "docs.acme.com/guides/authentication", title: "Authentication Guide", indexed: true, words: 2100 },
  { url: "docs.acme.com/guides/webhooks", title: "Webhooks", indexed: true, words: 1870 },
  { url: "docs.acme.com/sdks/javascript", title: "JavaScript SDK", indexed: true, words: 4300 },
  { url: "docs.acme.com/sdks/python", title: "Python SDK", indexed: true, words: 3890 },
];

type TabValue = "overview" | "content" | "playground" | "settings" | "embed";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>("overview");
  const [isRecrawling, setIsRecrawling] = useState(false);
  const [botConfig, setBotConfig] = useState<{
    name: string;
    welcomeMessage: string;
    primaryColor: string;
    position: "left" | "right";
  }>(MOCK_PROJECT.botConfig);

  const handleRecrawl = async () => {
    setIsRecrawling(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRecrawling(false);
    toast.success("Re-crawl started for " + MOCK_PROJECT.domain);
  };

  const handleSaveConfig = () => {
    toast.success("Bot configuration saved");
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: MOCK_PROJECT.name },
        ]}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Project header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {MOCK_PROJECT.name}
                </h1>
                <a
                  href={`https://${MOCK_PROJECT.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {MOCK_PROJECT.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
              >
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                Active
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
                Re-crawl
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Pages indexed", value: "1,243", icon: FileText, color: "text-blue-500" },
              { label: "Failed pages", value: "3", icon: AlertTriangle, color: "text-amber-500" },
              { label: "Last crawled", value: "2m ago", icon: RefreshCw, color: "text-muted-foreground" },
              { label: "Conversations", value: "124", icon: MessageSquare, color: "text-violet-500" },
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
                { value: "playground", label: "Playground", icon: MessageSquare },
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
                job={MOCK_CRAWL_JOB}
                onRetry={(id) => toast.success("Retry started")}
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
                      {MOCK_PAGES.slice(0, 4).map((page) => (
                        <li
                          key={page.url}
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
                        {MOCK_PAGES.length} pages indexed from {MOCK_PROJECT.domain}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-index
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {MOCK_PAGES.map((page) => (
                          <tr key={page.url} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-foreground">
                              {page.title}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                              <a
                                href={`https://${page.url}`}
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
                                Indexed
                              </Badge>
                            </td>
                          </tr>
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
                projectName={MOCK_PROJECT.name}
                projectDomain={MOCK_PROJECT.domain}
              />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Bot identity</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Customize how your AI assistant presents itself.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bot-name" className="text-xs font-medium">
                        Bot name
                      </Label>
                      <Input
                        id="bot-name"
                        value={botConfig.name}
                        onChange={(e) =>
                          setBotConfig((c) => ({ ...c, name: e.target.value }))
                        }
                        className="h-8 text-xs"
                        placeholder="Support Bot"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="welcome-msg" className="text-xs font-medium">
                        Welcome message
                      </Label>
                      <Textarea
                        id="welcome-msg"
                        value={botConfig.welcomeMessage}
                        onChange={(e) =>
                          setBotConfig((c) => ({
                            ...c,
                            welcomeMessage: e.target.value,
                          }))
                        }
                        className="min-h-0 resize-none text-xs"
                        rows={3}
                        placeholder="Hi! How can I help you today?"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Appearance</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Control the widget's visual style and placement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="primary-color" className="text-xs font-medium">
                        Primary color
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded border border-border"
                          style={{ backgroundColor: botConfig.primaryColor }}
                        />
                        <Input
                          id="primary-color"
                          type="color"
                          value={botConfig.primaryColor}
                          onChange={(e) =>
                            setBotConfig((c) => ({
                              ...c,
                              primaryColor: e.target.value,
                            }))
                          }
                          className="h-7 w-20 cursor-pointer border-0 bg-transparent p-0 text-xs"
                        />
                        <Input
                          value={botConfig.primaryColor}
                          onChange={(e) =>
                            setBotConfig((c) => ({
                              ...c,
                              primaryColor: e.target.value,
                            }))
                          }
                          className="h-7 w-28 font-mono text-xs"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Widget position</Label>
                      <Select
                        value={botConfig.position}
                        onValueChange={(v) =>
                          setBotConfig((c) => ({
                            ...c,
                            position: v as "left" | "right",
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right" className="text-xs">
                            Bottom Right
                          </SelectItem>
                          <SelectItem value="left" className="text-xs">
                            Bottom Left
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Crawl settings</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Control what SiteLearn crawls on your domain.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Crawl depth</Label>
                        <Select defaultValue="unlimited">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unlimited" className="text-xs">Unlimited</SelectItem>
                            <SelectItem value="3" className="text-xs">Max 3 levels</SelectItem>
                            <SelectItem value="5" className="text-xs">Max 5 levels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Re-crawl schedule</Label>
                        <Select defaultValue="weekly">
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
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Excluded paths{" "}
                        <span className="font-normal text-muted-foreground">(one per line)</span>
                      </Label>
                      <Textarea
                        className="min-h-0 resize-none font-mono text-xs"
                        rows={3}
                        placeholder={"/admin\n/private\n/checkout"}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handleSaveConfig}>
                  <Check className="h-3.5 w-3.5" />
                  Save changes
                </Button>
              </div>
            </TabsContent>

            {/* Embed */}
            <TabsContent value="embed" className="mt-6">
              <EmbedCode projectId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
