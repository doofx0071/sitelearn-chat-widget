"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  ExternalLink,
  RotateCcw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm the SiteLearn assistant for this project. Ask me anything about the site's content!",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    role: "user",
    content: "What are the main features of your product?",
    timestamp: new Date(Date.now() - 90000),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Based on the site, the main features include:\n\n1. **AI-powered chat** trained on your site's content\n2. **Automatic crawling** that keeps the bot up to date\n3. **Easy embedding** with a single script tag\n4. **Analytics** to see what users are asking",
    citations: [
      {
        id: "c1",
        title: "Features Overview",
        url: "https://acme.com/features",
        snippet: "SiteLearn crawls your entire website and trains an AI chatbot...",
      },
      {
        id: "c2",
        title: "Getting Started",
        url: "https://acme.com/docs/getting-started",
        snippet: "Embed your bot with a single line of JavaScript...",
      },
    ],
    timestamp: new Date(Date.now() - 60000),
  },
];

interface ChatPlaygroundProps {
  projectName?: string;
  projectDomain?: string;
  className?: string;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n(\d+)\. /g, "</p><p>$1. ")
    .replace(/\n/g, "<br/>");
}

export function ChatPlayground({
  projectName = "My Project",
  projectDomain = "example.com",
  className,
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500));

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `This is a simulated response for testing purposes. In production, this would be an AI-generated answer based on **${projectDomain}** content, with relevant citations from indexed pages.`,
      citations: [
        {
          id: "sim-c1",
          title: "Sample Page",
          url: `https://${projectDomain}/sample`,
          snippet: "This is where the relevant content was found...",
        },
      ],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const reset = () => {
    setMessages([SAMPLE_MESSAGES[0]]);
    setInput("");
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-card",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">
                {projectName}
              </p>
              <p className="text-[10px] text-muted-foreground">{projectDomain}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-5 gap-1 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Playground
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={reset}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset conversation</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef as React.RefObject<React.ElementRef<typeof ScrollArea>>}>
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-3 py-2.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Info bar */}
        <div className="flex items-center gap-1.5 border-t border-border bg-muted/40 px-4 py-2">
          <Info className="h-3 w-3 shrink-0 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">
            Testing mode — responses are simulated. Deploy the widget for real AI answers.
          </p>
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this site..."
              className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
              rows={1}
              style={{
                height: "auto",
                overflowY: input.split("\n").length > 3 ? "scroll" : "hidden",
                maxHeight: "80px",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 80) + "px";
              }}
            />
            <Button
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Press <kbd className="rounded border border-border px-0.5 font-mono text-[9px]">Enter</kbd> to send,{" "}
            <kbd className="rounded border border-border px-0.5 font-mono text-[9px]">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

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
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className="prose-sm [&_p]:mb-1 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{
                __html: `<p>${parseMarkdown(message.content)}</p>`,
              }}
            />
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((citation, i) => (
              <a
                key={citation.id}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                title={citation.snippet}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground hover:bg-muted"
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground border border-border">
                  {i + 1}
                </span>
                <span className="max-w-[120px] truncate">{citation.title}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            ))}
          </div>
        )}

        <span className="text-[9px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
