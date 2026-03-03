"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BrainCircuit, KeyRound, Loader2, Save, ServerCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminContentLayout } from "@/components/admin-panel/admin-content-layout";
import { toast } from "sonner";

type Provider = "openrouter" | "openai" | "custom";

const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  custom: "Custom",
};

const PROVIDER_DEFAULTS: Record<Provider, { baseURL?: string; placeholder: string }> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    placeholder: "sk-or-v1-…",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    placeholder: "sk-proj-…",
  },
  custom: {
    placeholder: "Enter your API key",
  },
};

const DEFAULT_EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`animate-pulse h-8 rounded-md bg-muted ${wide ? "w-full" : "w-48"}`} />
  );
}

export default function AdminAIPage() {
  const currentConfig = useQuery(api.admin.getAIConfig);
  const setAIConfig = useMutation(api.admin.setAIConfig);

  const [provider, setProvider] = useState<Provider>("openrouter");
  const [model, setModel] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  // Seed form from fetched config once
  useEffect(() => {
    if (currentConfig !== undefined && !initialised) {
      setInitialised(true);
      if (currentConfig) {
        setProvider(currentConfig.provider as Provider);
        setModel(currentConfig.model);
        setBaseURL(currentConfig.baseURL ?? "");
        setEmbeddingModel(currentConfig.embeddingModel ?? "");
        // Don't pre-fill the key input — user must explicitly enter a new one
      }
    }
  }, [currentConfig, initialised]);

  // Auto-fill baseURL when provider changes (only when user hasn't typed a custom value)
  const handleProviderChange = (value: Provider) => {
    setProvider(value);
    const defaultBaseURL = PROVIDER_DEFAULTS[value].baseURL ?? "";
    setBaseURL(defaultBaseURL);
  };

  const handleSave = async () => {
    if (!model.trim()) {
      toast.error("Model name is required.");
      return;
    }
    if (!apiKey.trim() && currentConfig === null) {
      toast.error("API key is required for the initial configuration.");
      return;
    }

    setIsSaving(true);
    try {
      await setAIConfig({
        provider,
        model: model.trim(),
        baseURL: baseURL.trim() || undefined,
        embeddingModel: embeddingModel.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
      });
      toast.success("AI configuration saved.");
      setApiKey("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save AI config.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = currentConfig === undefined;
  const hasExistingConfig = currentConfig !== null && currentConfig !== undefined;

  return (
    <AdminContentLayout title="Super Admin · AI">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Configuration
            </h1>
            <p className="text-sm text-muted-foreground">
              Set the global AI provider, model, and API key used across all workspaces.
            </p>
          </div>
          {hasExistingConfig && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs">Configured</span>
            </Badge>
          )}
        </div>

        {/* Current config summary */}
        {hasExistingConfig && (
          <Card className="border-muted bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ServerCog className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Current Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                {[
                  { label: "Provider", value: PROVIDER_LABELS[currentConfig.provider as Provider] ?? currentConfig.provider },
                  { label: "Model", value: currentConfig.model },
                  { label: "Embedding Model", value: currentConfig.embeddingModel ?? "Default" },
                  { label: "Base URL", value: currentConfig.baseURL ?? "Default" },
                  { label: "API Key", value: currentConfig.apiKeyEncrypted },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-0.5">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="truncate font-mono text-xs text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Config form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">
                {hasExistingConfig ? "Update Configuration" : "Initial Setup"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              This configuration is used as the fallback for all chat requests unless a
              workspace has its own provider key set.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Provider */}
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider" className="text-xs font-medium">
                Provider
              </Label>
              {isLoading ? (
                <FieldSkeleton />
              ) : (
                <Select value={provider} onValueChange={handleProviderChange}>
                  <SelectTrigger id="ai-provider" className="h-8 max-w-xs text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter" className="text-xs">
                      OpenRouter
                    </SelectItem>
                    <SelectItem value="custom" className="text-xs">
                      Custom
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <Label htmlFor="ai-model" className="text-xs font-medium">
                Model
              </Label>
              <p className="text-[11px] text-muted-foreground">
                e.g.{" "}
                {provider === "openrouter"
                  ? "openai/gpt-4o, anthropic/claude-3-5-sonnet"
                  : provider === "openai"
                  ? "gpt-4o, gpt-4o-mini"
                  : "your-model-id"}
              </p>
              {isLoading ? (
                <FieldSkeleton wide />
              ) : (
                <Input
                  id="ai-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={
                    provider === "openrouter"
                      ? "openai/gpt-4o"
                      : provider === "openai"
                      ? "gpt-4o"
                      : "your-model-id"
                  }
                  className="h-8 max-w-sm font-mono text-xs"
                />
              )}
            </div>

            {/* Base URL — only shown for custom provider */}
            {provider === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-base-url" className="text-xs font-medium">
                  Base URL
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  OpenAI-compatible endpoint, e.g. http://localhost:11434/v1
                </p>
                {isLoading ? (
                  <FieldSkeleton wide />
                ) : (
                  <Input
                    id="ai-base-url"
                    value={baseURL}
                    onChange={(e) => setBaseURL(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="h-8 max-w-sm font-mono text-xs"
                  />
                )}
              </div>
            )}

            {/* Embedding Model */}
            <div className="space-y-1.5">
              <Label htmlFor="ai-embedding-model" className="text-xs font-medium">
                Embedding Model
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Optional. Default: <code className="font-mono">{DEFAULT_EMBEDDING_MODEL}</code>
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-500">
                ⚠️ Changing the embedding model requires re-learning all projects to maintain search consistency.
              </p>
              {isLoading ? (
                <FieldSkeleton wide />
              ) : (
                <Input
                  id="ai-embedding-model"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  placeholder={DEFAULT_EMBEDDING_MODEL}
                  className="h-8 max-w-sm font-mono text-xs"
                />
              )}
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label htmlFor="ai-api-key" className="text-xs font-medium">
                <KeyRound className="mr-1 inline h-3 w-3" />
                API Key
              </Label>
              {hasExistingConfig && (
                <p className="text-[11px] text-muted-foreground">
                  Current key: <span className="font-mono">{currentConfig.apiKeyEncrypted}</span>.
                  Leave blank to keep the existing key.
                </p>
              )}
              {isLoading ? (
                <FieldSkeleton wide />
              ) : (
                <Input
                  id="ai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    hasExistingConfig
                      ? "Enter new key to replace existing"
                      : PROVIDER_DEFAULTS[provider].placeholder
                  }
                  className="h-8 max-w-sm font-mono text-xs"
                  autoComplete="new-password"
                />
              )}
            </div>

            {/* Save */}
            <div className="pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSaving ? "Saving…" : "Save configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Security note</p>
              <p className="text-[11px] text-muted-foreground">
                API keys are stored in Convex and used server-side to proxy chat requests.
                This global configuration is used for all chatbot widget and playground traffic.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
