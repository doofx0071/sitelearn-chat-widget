"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EmbedConfig {
  projectId: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  welcomeMessage: string;
  placeholder: string;
  showBranding: boolean;
  buttonLabel: string;
}

const DEFAULT_CONFIG: EmbedConfig = {
  projectId: "proj_abc123xyz",
  primaryColor: "#0F172A",
  position: "bottom-right",
  welcomeMessage: "Hi! How can I help you today?",
  placeholder: "Ask me anything...",
  showBranding: true,
  buttonLabel: "Chat with us",
};

interface EmbedCodeProps {
  config?: Partial<EmbedConfig>;
  projectId?: string;
}

const COLOR_PRESETS = [
  { label: "Slate", value: "#0F172A" },
  { label: "Blue", value: "#1D4ED8" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Rose", value: "#E11D48" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#D97706" },
];

export function EmbedCode({ config: configOverride, projectId }: EmbedCodeProps) {
  const [config, setConfig] = useState<EmbedConfig>({
    ...DEFAULT_CONFIG,
    ...(projectId ? { projectId } : {}),
    ...configOverride,
  });
  const [copied, setCopied] = useState<"script" | "react" | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const updateConfig = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const scriptCode = `<!-- SiteLearn Widget -->
<script
  src="https://cdn.sitelearn.ai/widget.js"
  data-project-id="${config.projectId}"
  data-color="${config.primaryColor}"
  data-position="${config.position}"
  data-welcome="${config.welcomeMessage}"
  data-placeholder="${config.placeholder}"
  data-branding="${config.showBranding}"
  defer
></script>`;

  const reactCode = `import { SiteLearnWidget } from '@sitelearn/react';

export function App() {
  return (
    <>
      {/* Your app content */}
      <SiteLearnWidget
        projectId="${config.projectId}"
        primaryColor="${config.primaryColor}"
        position="${config.position}"
        welcomeMessage="${config.welcomeMessage}"
        placeholder="${config.placeholder}"
        showBranding={${config.showBranding}}
      />
    </>
  );
}`;

  const handleCopy = async (type: "script" | "react") => {
    const text = type === "script" ? scriptCode : reactCode;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="code">
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="code" className="text-xs">
              Embed Code
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              Configure
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setPreviewVisible(!previewVisible)}
          >
            {previewVisible ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {previewVisible ? "Hide" : "Preview"}
          </Button>
        </div>

        {/* Code Tab */}
        <TabsContent value="code" className="mt-4 space-y-4">
          {/* HTML / Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">HTML / Script Tag</Label>
              <Badge variant="secondary" className="text-[10px]">
                Recommended
              </Badge>
            </div>
            <CodeBlock
              code={scriptCode}
              onCopy={() => handleCopy("script")}
              copied={copied === "script"}
              language="html"
            />
          </div>

          <Separator />

          {/* React */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">React / Next.js</Label>
            <CodeBlock
              code={reactCode}
              onCopy={() => handleCopy("react")}
              copied={copied === "react"}
              language="jsx"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Paste the script tag before the closing{" "}
            <code className="rounded bg-muted px-1 font-mono text-[11px]">
              &lt;/body&gt;
            </code>{" "}
            tag, or import the React component directly.
          </p>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="mt-4 space-y-5">
          {/* Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Primary Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("primaryColor", preset.value)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      config.primaryColor === preset.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                    aria-label={preset.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <Input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig("primaryColor", e.target.value)}
                  className="h-6 w-20 cursor-pointer border-0 bg-transparent p-0 text-xs"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => updateConfig("primaryColor", e.target.value)}
                  className="h-7 w-24 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Widget Position</Label>
            <Select
              value={config.position}
              onValueChange={(v) =>
                updateConfig("position", v as EmbedConfig["position"])
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right" className="text-xs">
                  Bottom Right
                </SelectItem>
                <SelectItem value="bottom-left" className="text-xs">
                  Bottom Left
                </SelectItem>
                <SelectItem value="top-right" className="text-xs">
                  Top Right
                </SelectItem>
                <SelectItem value="top-left" className="text-xs">
                  Top Left
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Welcome Message</Label>
            <Textarea
              value={config.welcomeMessage}
              onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
              className="min-h-0 resize-none text-xs"
              rows={2}
              placeholder="Hi! How can I help you today?"
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Input Placeholder</Label>
            <Input
              value={config.placeholder}
              onChange={(e) => updateConfig("placeholder", e.target.value)}
              className="h-8 text-xs"
              placeholder="Ask me anything..."
            />
          </div>

          {/* Button Label */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Button Label</Label>
            <Input
              value={config.buttonLabel}
              onChange={(e) => updateConfig("buttonLabel", e.target.value)}
              className="h-8 text-xs"
              placeholder="Chat with us"
            />
          </div>

          {/* Branding */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-xs font-medium text-foreground">Show branding</p>
              <p className="text-[10px] text-muted-foreground">
                Display "Powered by SiteLearn" in the widget
              </p>
            </div>
            <Switch
              checked={config.showBranding}
              onCheckedChange={(v) => updateConfig("showBranding", v)}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      {previewVisible && (
        <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Your website content here</p>
          </div>

          {/* Simulated widget button */}
          <div
            className={cn(
              "absolute flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg text-white text-xs font-medium",
              "transition-transform hover:scale-105 cursor-pointer",
              config.position === "bottom-right" && "bottom-4 right-4",
              config.position === "bottom-left" && "bottom-4 left-4",
              config.position === "top-right" && "top-4 right-4",
              config.position === "top-left" && "top-4 left-4"
            )}
            style={{ backgroundColor: config.primaryColor }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {config.buttonLabel}
          </div>
        </div>
      )}
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
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[10px]"
          onClick={onCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied!</span>
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
        <code className="font-mono text-[11px] leading-relaxed text-foreground">
          {code}
        </code>
      </pre>
    </div>
  );
}
