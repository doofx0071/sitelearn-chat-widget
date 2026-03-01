"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  User,
  Bot,
  Clock,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  AlertCircle,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApi = any;
const typedApi = api as AnyApi;

interface ConversationsTabProps {
  projectId: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationSummary {
  _id: Id<"conversations">;
  sessionId: string;
  messageCount: number;
  createdAt: number;
  lastMessageAt: number;
  pageUrl?: string;
}

interface MessageWithFeedback {
  _id: Id<"messages">;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  sources?: Array<{ url: string; title?: string; snippet: string }>;
  feedback: {
    rating: "up" | "down";
    note?: string | null;
  } | null;
}

interface ConversationDetail {
  _id: Id<"conversations">;
  sessionId: string;
  createdAt: number;
  lastMessageAt: number;
  pageUrl?: string;
  messages: MessageWithFeedback[];
}

interface LowConfidenceQuestion {
  feedbackId: Id<"feedback">;
  conversationId: Id<"conversations">;
  rating: "up" | "down";
  note: string | null;
  feedbackCreatedAt: number;
  userQuestion: string | null;
  assistantAnswer: string;
  assistantMessageId: Id<"messages">;
}

interface StatsData {
  totalConversations: number;
  totalMessages: number;
  thumbsUp: number;
  thumbsDown: number;
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ projectId }: { projectId: Id<"projects"> }) {
  const stats = useQuery(
    typedApi["chat/conversations"].getStats,
    { projectId }
  ) as StatsData | undefined;

  const items = [
    {
      label: "Total conversations",
      value: stats?.totalConversations ?? "—",
      icon: MessageSquare,
      color: "text-violet-500",
    },
    {
      label: "Total messages",
      value: stats?.totalMessages ?? "—",
      icon: Hash,
      color: "text-blue-500",
    },
    {
      label: "Thumbs up",
      value: stats?.thumbsUp ?? "—",
      icon: ThumbsUp,
      color: "text-emerald-500",
    },
    {
      label: "Thumbs down",
      value: stats?.thumbsDown ?? "—",
      icon: ThumbsDown,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn("h-3.5 w-3.5", item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Conversation List Row ────────────────────────────────────────────────────

interface ConversationRowProps {
  conversation: ConversationSummary;
  onClick: () => void;
}

function ConversationRow({ conversation, onClick }: ConversationRowProps) {
  let previewLabel = conversation.sessionId.slice(0, 20) + "…";
  if (conversation.pageUrl) {
    try {
      previewLabel = new URL(conversation.pageUrl).pathname;
    } catch {
      // fallback to sessionId
    }
  }

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-foreground">
            {previewLabel}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-2.5 w-2.5" />
            {conversation.messageCount} msg
            {conversation.messageCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: MessageWithFeedback }) {
  const isUser = message.role === "user";
  if (message.role === "system") return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted ring-1 ring-border"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          isUser && "items-end"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 text-xs leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.sources.map((source, i) => {
              let hostname = source.url;
              try {
                hostname = new URL(source.url).hostname;
              } catch {
                // use raw url
              }
              return (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.snippet}
                  className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-muted text-[8px] font-bold border border-border">
                    {i + 1}
                  </span>
                  <span className="max-w-[100px] truncate">
                    {source.title ?? hostname}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {/* Feedback badge */}
        {!isUser && message.feedback && (
          <div className="flex items-center gap-1.5">
            {message.feedback.rating === "up" ? (
              <Badge
                variant="outline"
                className="h-4 gap-0.5 px-1 text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400"
              >
                <ThumbsUp className="h-2 w-2" />
                Helpful
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-4 gap-0.5 px-1 text-[9px] bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 dark:text-rose-400"
              >
                <ThumbsDown className="h-2 w-2" />
                Not helpful
              </Badge>
            )}
            {message.feedback.note && (
              <span className="text-[9px] italic text-muted-foreground">
                &ldquo;{message.feedback.note}&rdquo;
              </span>
            )}
          </div>
        )}

        <span className="text-[9px] text-muted-foreground">
          {formatTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Conversation Detail ──────────────────────────────────────────────────────

function ConversationDetailView({
  conversationId,
  onBack,
}: {
  conversationId: Id<"conversations">;
  onBack: () => void;
}) {
  const data = useQuery(
    typedApi["chat/conversations"].getWithMessages,
    { conversationId }
  ) as ConversationDetail | null | undefined;

  if (data === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span className="text-xs">Loading conversation…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-xs text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  const visibleMessages = data.messages.filter((m) => m.role !== "system");

  let parsedPagePath: string | null = null;
  if (data.pageUrl) {
    try {
      parsedPagePath = new URL(data.pageUrl).pathname;
    } catch {
      // invalid URL — leave null
    }
  }
  const pagePathDisplay: React.ReactNode =
    data.pageUrl && parsedPagePath ? (
      <>
        {" · from "}
        <a
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {parsedPagePath}
        </a>
      </>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            Session:{" "}
            <span className="font-mono">
              {data.sessionId.slice(0, 20)}…
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTimestamp(data.createdAt)} · {visibleMessages.length} message
            {visibleMessages.length !== 1 ? "s" : ""}
            {pagePathDisplay}
          </span>
        </div>
      </div>

      {/* Thread */}
      <ScrollArea className="h-[520px] rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-4">
          {visibleMessages.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-xs text-muted-foreground">
                No messages in this conversation.
              </p>
            </div>
          ) : (
            visibleMessages.map((message) => (
              <MessageBubble key={message._id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Low Confidence Panel ─────────────────────────────────────────────────────

function LowConfidencePanel({
  projectId,
  onViewConversation,
}: {
  projectId: Id<"projects">;
  onViewConversation: (id: Id<"conversations">) => void;
}) {
  const questions = useQuery(
    typedApi["chat/conversations"].getLowConfidenceQuestions,
    { projectId }
  ) as (LowConfidenceQuestion | null)[] | undefined;

  if (questions === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span className="text-xs">Loading…</span>
        </div>
      </div>
    );
  }

  const filtered = questions.filter(
    (q): q is LowConfidenceQuestion => q !== null
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-14">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <ThumbsUp className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">All clear!</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No low-confidence or negatively-rated responses yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {filtered.length} question{filtered.length !== 1 ? "s" : ""} that
        received a thumbs-down rating — review and improve your content.
      </p>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {filtered.map((q) => (
          <div key={String(q.feedbackId)} className="flex flex-col gap-2 p-4">
            {/* User question */}
            {q.userQuestion && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {q.userQuestion}
                </p>
              </div>
            )}

            {/* Bot answer (truncated) */}
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                <Bot className="h-2.5 w-2.5 text-rose-500" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {truncate(q.assistantAnswer, 200)}
              </p>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 pl-7">
              <Badge
                variant="outline"
                className="h-4 gap-0.5 px-1 text-[9px] bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 dark:text-rose-400"
              >
                <ThumbsDown className="h-2 w-2" />
                Not helpful
              </Badge>

              {q.note && (
                <span className="text-[10px] italic text-muted-foreground">
                  &ldquo;{q.note}&rdquo;
                </span>
              )}

              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(q.feedbackCreatedAt)}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => onViewConversation(q.conversationId)}
              >
                View conversation
                <ChevronRight className="ml-0.5 h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ConversationsTab({ projectId }: ConversationsTabProps) {
  const convexProjectId = projectId as Id<"projects">;
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [innerTab, setInnerTab] = useState<"list" | "insights">("list");

  const conversations = useQuery(
    typedApi["chat/conversations"].listByProject,
    { projectId: convexProjectId }
  ) as ConversationSummary[] | undefined;

  // Conversation detail view (shared between list and insights tabs)
  if (selectedConversationId) {
    return (
      <ConversationDetailView
        conversationId={selectedConversationId}
        onBack={() => setSelectedConversationId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <StatsBar projectId={convexProjectId} />

      {/* Inner sub-tabs */}
      <Tabs
        value={innerTab}
        onValueChange={(v) => setInnerTab(v as "list" | "insights")}
      >
        <TabsList className="h-8 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          {[
            {
              value: "list",
              label: "All Conversations",
              icon: MessageSquare,
            },
            {
              value: "insights",
              label: "Unanswered / Low-Confidence",
              icon: AlertCircle,
            },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="relative h-8 rounded-none border-b-2 border-transparent px-3 text-xs font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Icon className="mr-1.5 h-3 w-3" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── All Conversations ── */}
        <TabsContent value="list" className="mt-4">
          {conversations === undefined ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                <span className="text-xs">Loading conversations…</span>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-14">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                <MessageSquare className="h-5 w-5 text-violet-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  No conversations yet
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Deploy the widget to start collecting conversations.
                </p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      Recent Conversations
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      {conversations.length} conversation
                      {conversations.length !== 1 ? "s" : ""} — click to view
                      chat log
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {conversations.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col divide-y divide-border/60">
                  {conversations.map((conversation) => (
                    <ConversationRow
                      key={String(conversation._id)}
                      conversation={conversation}
                      onClick={() =>
                        setSelectedConversationId(conversation._id)
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Unanswered / Low-Confidence ── */}
        <TabsContent value="insights" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Explainer */}
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="flex items-start gap-3 pb-4 pt-4">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    How to use this list
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    These are visitor questions where the bot received a
                    thumbs-down rating. Review each one and update your content
                    so the bot can answer confidently next time.
                  </p>
                </div>
              </CardContent>
            </Card>

            <LowConfidencePanel
              projectId={convexProjectId}
              onViewConversation={(id) => setSelectedConversationId(id)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
