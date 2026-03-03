"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Check, Copy, Eye, EyeOff, Globe2, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type WidgetPosition = "bottom-right" | "bottom-left";

export interface EmbedConfig {
  botId: string;
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
  botName: string;
  headerFont: "editorial" | "modern" | "classic" | "minimal";
  avatarStyle: "sparkle" | "bot" | "chat" | "initial";
}

const DEFAULT_CONFIG: EmbedConfig = {
  botId: "project_id_here",
  primaryColor: "#0f172a",
  position: "bottom-right",
  welcomeMessage: "Hi! How can I help you today?",
  botName: "SiteLearn Assistant",
  headerFont: "modern",
  avatarStyle: "bot",
};

const WIDGET_SCRIPT_FALLBACK = "https://sitelearn.doofs.tech/widget.iife.js";

/**
 * Resolves the widget script URL with fallback chain:
 * 1. NEXT_PUBLIC_WIDGET_SCRIPT_URL env var (if provided)
 * 2. ${NEXT_PUBLIC_SITE_URL}/widget.iife.js (if site URL exists)
 * 3. window.location.origin + "/widget.iife.js" (browser only)
 * 4. https://sitelearn.doofs.tech/widget.iife.js (SSR fallback)
 */
function getWidgetScriptUrl(): string {
  const envScriptUrl = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
  if (envScriptUrl) return envScriptUrl;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return `${siteUrl.replace(/\/$/, "")}/widget.iife.js`;

  // Browser: use current origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}/widget.iife.js`;
  }

  // SSR: use hosted fallback
  return WIDGET_SCRIPT_FALLBACK;
}

const WIDGET_SCRIPT_URL = getWidgetScriptUrl();

interface EmbedCodeProps {
  config?: Partial<EmbedConfig>;
  projectId?: string;
  learningConfig?: {
    depth: "single" | "nested" | "full";
    schedule: "daily" | "weekly" | "monthly" | "manual";
    excludedPaths: string[];
  };
}

const COLOR_PRESETS = [
  { label: "Slate", value: "#0f172a" },
  { label: "Blue", value: "#1d4ed8" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
];

const FONT_OPTIONS: Array<{ value: EmbedConfig["headerFont"]; label: string }> = [
  { value: "modern", label: "Modern (DM Sans)" },
  { value: "editorial", label: "Editorial (Lora)" },
  { value: "classic", label: "Classic (Georgia)" },
  { value: "minimal", label: "Minimal (System)" },
];

const AVATAR_OPTIONS: Array<{ value: EmbedConfig["avatarStyle"]; label: string }> = [
  { value: "bot", label: "Bot icon" },
  { value: "sparkle", label: "Sparkle" },
  { value: "chat", label: "Chat bubble" },
  { value: "initial", label: "Initial letter" },
];

export function EmbedCode({ config: configOverride, projectId, learningConfig }: EmbedCodeProps) {
  const updateProjectSettings = useMutation(api.projects.updateSettings);
  const [config, setConfig] = useState<EmbedConfig>({
    ...DEFAULT_CONFIG,
    ...configOverride,
    ...(projectId ? { botId: projectId } : {}),
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSignatureRef = useRef<string>("");

  const hydratedConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...configOverride,
      ...(projectId ? { botId: projectId } : {}),
    }),
    [configOverride, projectId]
  );

  useEffect(() => {
    setConfig(hydratedConfig);
    lastSavedSignatureRef.current = JSON.stringify({
      botConfig: {
        name: hydratedConfig.botName,
        welcomeMessage: hydratedConfig.welcomeMessage,
        primaryColor: hydratedConfig.primaryColor,
        position: hydratedConfig.position,
        headerFont: hydratedConfig.headerFont,
        avatarStyle: hydratedConfig.avatarStyle,
      },
    });
  }, [hydratedConfig]);

  useEffect(() => {
    if (!projectId) return;

    const signature = JSON.stringify({
      botConfig: {
        name: config.botName,
        welcomeMessage: config.welcomeMessage,
        primaryColor: config.primaryColor,
        position: config.position,
        headerFont: config.headerFont,
        avatarStyle: config.avatarStyle,
      },
    });

    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState("saving");

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProjectSettings({
          projectId: projectId as Id<"projects">,
          botConfig: {
            name: config.botName,
            welcomeMessage: config.welcomeMessage,
            primaryColor: config.primaryColor,
            position: config.position,
            headerFont: config.headerFont,
            avatarStyle: config.avatarStyle,
          },
          learningConfig: learningConfig ?? {
            depth: "full",
            schedule: "weekly",
            excludedPaths: [],
          },
        });

        lastSavedSignatureRef.current = signature;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, learningConfig, projectId, updateProjectSettings]);

  const updateConfig = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const htmlScriptCode = `<script src="${WIDGET_SCRIPT_URL}" data-bot-id="${config.botId}" defer></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(htmlScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Generates the iframe HTML document that loads the real widget.
   * Uses srcdoc for a self-contained preview that requires no separate file.
   */
  const previewIframeDoc = useMemo(() => {
    const scriptUrl = WIDGET_SCRIPT_URL;
    const position = config.position === "bottom-left" ? "left" : "right";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .preview-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 12px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="preview-placeholder">Widget placement preview</div>
   <script
    src="${scriptUrl}"
    data-bot-id="${config.botId}"
  data-bot-name="${config.botName}"
  data-primary-color="${config.primaryColor}"
  data-welcome-message="${config.welcomeMessage.replace(/"/g, '&quot;')}"
  data-header-font="${config.headerFont}"
  data-avatar-style="${config.avatarStyle}"
  data-position="${position}"
  data-auto-open="${previewOpen}"
  data-disable-server-config="true"
  defer
  ></script>
</body>
</html>`;
  }, [
    config.botId,
    config.botName,
    config.primaryColor,
    config.welcomeMessage,
    config.position,
    previewOpen,
  ]);

  // Reset iframe loaded state when config changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [previewIframeDoc]);

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
          <p className="text-[11px] text-muted-foreground">Copy this one-line script and paste it before `&lt;/body&gt;` in any site or app shell.</p>
          <CodeBlock code={htmlScriptCode} language="html" copied={copied} onCopy={handleCopy} />

          <Separator />

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="flex items-center gap-2 text-xs font-medium">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
              Script attributes used by the widget
            </h4>
            <div className="space-y-2 text-xs">
              {[
                ["data-bot-id", "Project ID for routing chat requests (required)"],
                ["data-bot-name", "Optional override for bot name"],
                ["data-primary-color", "Optional override for accent color"],
                ["data-position", "Optional left/right floating position"],
                ["data-welcome-message", "Optional override for first message"],
                ["data-header-font", "Optional font style override"],
                ["data-avatar-style", "Optional avatar style override"],
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

          <div className="space-y-2">
            <Label className="text-xs font-medium">Header font</Label>
            <Select
              value={config.headerFont}
              onValueChange={(value) => updateConfig("headerFont", value as EmbedConfig["headerFont"])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Avatar icon</Label>
            <Select
              value={config.avatarStyle}
              onValueChange={(value) => updateConfig("avatarStyle", value as EmbedConfig["avatarStyle"])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVATAR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Auto-saved" : saveState === "error" ? "Save failed" : ""}
            </span>
          </div>
        </TabsContent>
      </Tabs>

      {previewVisible ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Live preview using the actual widget bundle
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* Loading overlay */}
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading widget...</span>
                </div>
              </div>
            )}
            {/* Iframe sandbox for widget preview */}
            <iframe
              key={iframeKey}
              srcDoc={previewIframeDoc}
              onLoad={() => setIframeLoaded(true)}
              className="h-[520px] w-full bg-gradient-to-br from-slate-50 to-slate-100"
              sandbox="allow-scripts allow-same-origin"
              title="Widget preview"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            The widget runs in an isolated iframe. Toggle &quot;Open chat&quot; in the header to test the expanded state.
          </p>
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
