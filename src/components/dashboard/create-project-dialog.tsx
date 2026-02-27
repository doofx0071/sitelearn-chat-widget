"use client";

import { useState } from "react";
import {
  Globe,
  Shield,
  Code2,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Info,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type VerificationMethod = "dns" | "html";
type Step = "domain" | "verify" | "success";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (domain: string) => void;
}

const DNS_RECORD = {
  type: "TXT",
  host: "@",
  value: "sitelearn-verify=v1_abc123xyz456def",
};

const HTML_TAG = `<meta name="sitelearn-verification" content="v1_abc123xyz456def" />`;

export function CreateProjectDialog({
  trigger,
  onSuccess,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [method, setMethod] = useState<VerificationMethod>("dns");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [copied, setCopied] = useState(false);

  const validateDomain = (value: string): boolean => {
    const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/;
    return regex.test(trimmed);
  };

  const normalizeDomain = (value: string): string => {
    return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  };

  const handleDomainNext = () => {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
      setDomainError("Please enter a domain.");
      return;
    }
    if (!validateDomain(normalized)) {
      setDomainError("Enter a valid domain (e.g. example.com).");
      return;
    }
    setDomainError("");
    setDomain(normalized);
    setStep("verify");
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError("");

    // Simulate verification check
    await new Promise((r) => setTimeout(r, 2000));

    // Simulate occasional failure for demo
    if (Math.random() > 0.3) {
      setIsVerifying(false);
      setStep("success");
      setTimeout(() => {
        onSuccess?.(domain);
        handleClose();
      }, 1500);
    } else {
      setIsVerifying(false);
      setVerifyError(
        method === "dns"
          ? "DNS record not found yet. Records can take up to 48 hours to propagate. Please try again."
          : "Verification tag not found on your homepage. Ensure it's in the <head> section and try again."
      );
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep("domain");
      setDomain("");
      setDomainError("");
      setVerifyError("");
      setIsVerifying(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          {(["domain", "verify", "success"] as Step[]).map((s, i) => {
            const isActive = s === step;
            const isPast =
              (step === "verify" && s === "domain") ||
              (step === "success" && s !== "success");
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isPast && "bg-emerald-500 text-white",
                    !isActive && !isPast && "bg-muted text-muted-foreground"
                  )}
                >
                  {isPast ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium capitalize",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s === "success" ? "Done" : s}
                </span>
                {i < 2 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step: Domain */}
        {step === "domain" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Add a new project</DialogTitle>
              <DialogDescription className="text-sm">
                Enter the domain you want SiteLearn to crawl and index.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="domain" className="text-xs font-medium">
                  Domain
                </Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      setDomainError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleDomainNext()}
                    placeholder="example.com"
                    className={cn(
                      "pl-8 text-sm",
                      domainError && "border-destructive focus-visible:ring-destructive"
                    )}
                    autoFocus
                  />
                </div>
                {domainError && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {domainError}
                  </p>
                )}
                <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  We&apos;ll crawl all publicly accessible pages on this domain.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleDomainNext} className="gap-1.5">
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Verify */}
        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Verify ownership</DialogTitle>
              <DialogDescription className="text-sm">
                Prove you own <span className="font-medium text-foreground">{domain}</span> using one of these methods.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {/* Method selector */}
              <div className="grid grid-cols-2 gap-2">
                <MethodCard
                  icon={<Shield className="h-4 w-4" />}
                  title="DNS Record"
                  description="Add a TXT record to your DNS"
                  selected={method === "dns"}
                  onClick={() => setMethod("dns")}
                  badge="Recommended"
                />
                <MethodCard
                  icon={<Code2 className="h-4 w-4" />}
                  title="HTML Tag"
                  description="Add a meta tag to your site"
                  selected={method === "html"}
                  onClick={() => setMethod("html")}
                />
              </div>

              <Separator />

              {/* Instructions */}
              {method === "dns" ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Add this TXT record to your domain&apos;s DNS settings:
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="grid grid-cols-3 gap-0 divide-x divide-border text-[10px]">
                      <div className="p-2">
                        <p className="font-medium text-muted-foreground mb-1">Type</p>
                        <p className="font-mono text-foreground">TXT</p>
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-muted-foreground mb-1">Host</p>
                        <p className="font-mono text-foreground">{DNS_RECORD.host}</p>
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-muted-foreground mb-1">Value</p>
                        <div className="flex items-start gap-1">
                          <p className="min-w-0 truncate font-mono text-foreground">
                            {DNS_RECORD.value.slice(0, 20)}…
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 shrink-0"
                            onClick={() => handleCopy(DNS_RECORD.value)}
                          >
                            {copied ? (
                              <Check className="h-2.5 w-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-2.5 w-2.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    DNS changes can take up to 48 hours to propagate.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Add this meta tag to the{" "}
                    <code className="rounded bg-muted px-1 font-mono text-[11px]">&lt;head&gt;</code>{" "}
                    of your homepage:
                  </p>
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50">
                    <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">html</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 gap-1 px-1.5 text-[10px]"
                        onClick={() => handleCopy(HTML_TAG)}
                      >
                        {copied ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="overflow-x-auto p-3">
                      <code className="font-mono text-[11px] text-foreground whitespace-pre-wrap break-all">
                        {HTML_TAG}
                      </code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {verifyError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  <p className="text-xs text-destructive">{verifyError}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStep("domain"); setVerifyError(""); }}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying}
                className="gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Verify &amp; Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Project created!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{domain}</span> has been
                verified. We&apos;re starting the crawl now.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Redirecting to your project...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MethodCard({
  icon,
  title,
  description,
  selected,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
      )}
    >
      {badge && (
        <Badge
          variant="secondary"
          className="absolute right-2 top-2 text-[9px] px-1 h-4"
        >
          {badge}
        </Badge>
      )}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
      </div>
      <div
        className={cn(
          "absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-2",
          badge ? "top-8" : "",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30"
        )}
      >
        {selected && (
          <Check className="absolute inset-0 m-auto h-2 w-2 text-primary-foreground" />
        )}
      </div>
    </button>
  );
}
