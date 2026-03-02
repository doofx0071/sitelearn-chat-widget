"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Globe2, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WidgetPosition = "bottom-right" | "bottom-left";
type SnippetType = "html" | "next" | "react" | "vue";

export interface EmbedConfig {
  botId: string;
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
  botName: string;
}

const DEFAULT_CONFIG: EmbedConfig = {
  botId: "project_id_here",
  primaryColor: "#0f172a",
  position: "bottom-right",
  welcomeMessage: "Hi! How can I help you today?",
  botName: "SiteLearn Assistant",
};

/**
 * Resolves the widget script URL with fallback chain:
 * 1. NEXT_PUBLIC_WIDGET_SCRIPT_URL env var (if provided)
 * 2. ${NEXT_PUBLIC_SITE_URL}/widget.iife.js (if site URL exists)
 * 3. /widget.iife.js (relative path fallback)
 */
function getWidgetScriptUrl(): string {
  const envScriptUrl = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
  if (envScriptUrl) return envScriptUrl;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return `${siteUrl.replace(/\/$/, "")}/widget.iife.js`;

  return "/widget.iife.js";
}

const WIDGET_SCRIPT_URL = getWidgetScriptUrl();

interface EmbedCodeProps {
  config?: Partial<EmbedConfig>;
  projectId?: string;
}

const COLOR_PRESETS = [
  { label: "Slate", value: "#0f172a" },
  { label: "Blue", value: "#1d4ed8" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
];

function toWidgetSide(position: WidgetPosition): "left" | "right" {
  return position === "bottom-left" ? "left" : "right";
}

export function EmbedCode({ config: configOverride, projectId }: EmbedCodeProps) {
  const [config, setConfig] = useState<EmbedConfig>({
    ...DEFAULT_CONFIG,
    ...(projectId ? { botId: projectId } : {}),
    ...configOverride,
  });
  const [copied, setCopied] = useState<SnippetType | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInput, setPreviewInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content: "Open the real widget on your site to test live answers from learned content.",
    },
  ]);

  const updateConfig = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const widgetSide = toWidgetSide(config.position);

  const htmlScriptCode = `<script
  src="${WIDGET_SCRIPT_URL}"
  data-bot-id="${config.botId}"
  data-bot-name="${config.botName}"
  data-primary-color="${config.primaryColor}"
  data-position="${widgetSide}"
  data-welcome-message="${config.welcomeMessage}"
  defer
></script>`;

  const nextCode = `import Script from "next/script";

export function ChatWidget() {
  return (
    <Script
      id="sitelearn-widget"
      src="${WIDGET_SCRIPT_URL}"
      data-bot-id="${config.botId}"
      data-bot-name="${config.botName}"
      data-primary-color="${config.primaryColor}"
      data-position="${widgetSide}"
      data-welcome-message="${config.welcomeMessage}"
      strategy="afterInteractive"
    />
  );
}`;

  const reactCode = `import { useEffect } from "react";

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "${WIDGET_SCRIPT_URL}";
    script.defer = true;
    script.dataset.botId = "${config.botId}";
    script.dataset.botName = "${config.botName}";
    script.dataset.primaryColor = "${config.primaryColor}";
    script.dataset.position = "${widgetSide}";
    script.dataset.welcomeMessage = "${config.welcomeMessage}";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}`;

  const vueCode = `<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";

let scriptEl: HTMLScriptElement | null = null;

onMounted(() => {
  scriptEl = document.createElement("script");
  scriptEl.src = "${WIDGET_SCRIPT_URL}";
  scriptEl.defer = true;
  scriptEl.dataset.botId = "${config.botId}";
  scriptEl.dataset.botName = "${config.botName}";
  scriptEl.dataset.primaryColor = "${config.primaryColor}";
  scriptEl.dataset.position = "${widgetSide}";
  scriptEl.dataset.welcomeMessage = "${config.welcomeMessage}";
  document.body.appendChild(scriptEl);
});

onBeforeUnmount(() => {
  scriptEl?.remove();
});
</script>`;

  const snippets: Record<SnippetType, string> = {
    html: htmlScriptCode,
    next: nextCode,
    react: reactCode,
    vue: vueCode,
  };

  const handleCopy = async (type: SnippetType) => {
    await navigator.clipboard.writeText(snippets[type]);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendPreview = () => {
    const value = previewInput.trim();
    if (!value) return;

    setPreviewMessages((current) => [
      ...current,
      { role: "user", content: value },
      {
        role: "assistant",
        content: "Preview mode only. Use Playground or your embedded widget for real AI responses.",
      },
    ]);
    setPreviewInput("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Install on any stack</h3>
        </div>
        <ol className="ml-5 list-decimal space-y-1.5 text-xs text-muted-foreground">
          <li>Pick the snippet for your stack and copy it.</li>
          <li>Add it once per page (or root layout) and deploy.</li>
          <li>Open your site and click the chat button to validate replies.</li>
        </ol>
      </div>

      <Tabs defaultValue="snippets" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="snippets" className="text-xs">Code Snippets</TabsTrigger>
            <TabsTrigger value="config" className="text-xs">Widget Config</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {previewVisible ? (
              <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                <Label htmlFor="preview-open" className="text-[11px] text-muted-foreground">
                  Open chat
                </Label>
                <Switch
                  id="preview-open"
                  checked={previewOpen}
                  onCheckedChange={setPreviewOpen}
                />
              </div>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setPreviewVisible((value) => !value)}
            >
              {previewVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {previewVisible ? "Hide preview" : "Preview"}
            </Button>
          </div>
        </div>

        <TabsContent value="snippets" className="space-y-4">
          <Tabs defaultValue="html" className="space-y-3">
            <TabsList className="h-8">
              <TabsTrigger value="html" className="text-xs">HTML</TabsTrigger>
              <TabsTrigger value="next" className="text-xs">Next.js</TabsTrigger>
              <TabsTrigger value="react" className="text-xs">React</TabsTrigger>
              <TabsTrigger value="vue" className="text-xs">Vue</TabsTrigger>
            </TabsList>

            <TabsContent value="html">
              <CodeBlock code={htmlScriptCode} language="html" copied={copied === "html"} onCopy={() => handleCopy("html")} />
            </TabsContent>
            <TabsContent value="next">
              <CodeBlock code={nextCode} language="tsx" copied={copied === "next"} onCopy={() => handleCopy("next")} />
            </TabsContent>
            <TabsContent value="react">
              <CodeBlock code={reactCode} language="tsx" copied={copied === "react"} onCopy={() => handleCopy("react")} />
            </TabsContent>
            <TabsContent value="vue">
              <CodeBlock code={vueCode} language="vue" copied={copied === "vue"} onCopy={() => handleCopy("vue")} />
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="flex items-center gap-2 text-xs font-medium">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
              Script attributes used by the widget
            </h4>
            <div className="space-y-2 text-xs">
              {[
                ["data-bot-id", "Project ID for routing chat requests (required)"],
                ["data-bot-name", "Name shown in the widget header"],
                ["data-primary-color", "Widget accent color as #RRGGBB"],
                ["data-position", "left or right floating position"],
                ["data-welcome-message", "First message shown on open"],
              ].map(([name, description]) => (
                <div key={name} className="flex gap-2">
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {name}
                  </code>
                  <span className="text-muted-foreground">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Bot Name</Label>
            <Input
              value={config.botName}
              onChange={(event) => updateConfig("botName", event.target.value)}
              className="h-8 text-xs"
              placeholder="SiteLearn Assistant"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Welcome Message</Label>
            <Textarea
              value={config.welcomeMessage}
              onChange={(event) => updateConfig("welcomeMessage", event.target.value)}
              className="min-h-0 resize-none text-xs"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Primary Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateConfig("primaryColor", preset.value)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      config.primaryColor === preset.value
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                    aria-label={preset.label}
                  />
                ))}
              </div>
              <Input
                value={config.primaryColor}
                onChange={(event) => updateConfig("primaryColor", event.target.value)}
                className="h-8 w-28 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Position</Label>
            <Select
              value={config.position}
              onValueChange={(value) => updateConfig("position", value as WidgetPosition)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right" className="text-xs">Bottom Right</SelectItem>
                <SelectItem value="bottom-left" className="text-xs">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {previewVisible ? (
        <div className="relative min-h-[400px] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-slate-50 to-slate-100 lg:min-h-[520px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Widget placement preview</p>
          </div>

          {previewOpen ? (
            <div
              className={cn(
                "absolute bottom-24 flex max-h-[min(560px,calc(100%-7rem))] w-[min(336px,calc(100%-2rem))] flex-col rounded-xl border border-border bg-background shadow-xl lg:w-[min(420px,calc(100%-2rem))] lg:max-h-[min(680px,calc(100%-7rem))]",
                config.position === "bottom-left" ? "left-4" : "right-4"
              )}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-foreground">{config.botName}</p>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Online</Badge>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <p className="w-fit max-w-[90%] rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {config.welcomeMessage}
                  </p>
                  {previewMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={cn(
                        "w-fit max-w-[90%] rounded-xl px-3 py-2 text-xs",
                        message.role === "assistant"
                          ? "bg-muted text-muted-foreground"
                          : "ml-auto text-white"
                      )}
                      style={message.role === "user" ? { backgroundColor: config.primaryColor } : undefined}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex items-end gap-2 border-t border-border px-3 py-2.5">
                <input
                  value={previewInput}
                  onChange={(event) => setPreviewInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendPreview();
                    }
                  }}
                  className="h-9 flex-1 rounded-lg border border-border bg-muted/50 px-3 text-xs text-foreground outline-none ring-offset-background placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Type a message..."
                />
                <button
                  type="button"
                  onClick={handleSendPreview}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-50"
                  disabled={!previewInput.trim()}
                  style={{ backgroundColor: config.primaryColor }}
                  aria-label="Send preview message"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setPreviewOpen((value) => !value)}
            className={cn(
              "absolute bottom-6 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105",
              config.position === "bottom-left" ? "left-4" : "right-4"
            )}
            style={{ backgroundColor: config.primaryColor }}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
            {previewOpen ? "Close chat" : "Open chat"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CodeBlock({
  code,
  onCopy,
  copied,
  language,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
  language: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-muted/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {language}
        </span>
        <Button variant="ghost" size="sm" className="h-6 gap-1.5 px-2 text-[10px]" onClick={onCopy}>
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-[11px] leading-relaxed text-foreground">{code}</code>
      </pre>
    </div>
  );
}
