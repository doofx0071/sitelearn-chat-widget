"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Globe,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Info,
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
import { cn } from "@/lib/utils";

type Step = "domain" | "success";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (domain: string) => void;
}

export function CreateProjectDialog({
  trigger,
  onSuccess,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createProject = useMutation(api.domains.verify.createProject);
  const ensureWorkspace = useMutation(api.workspaces.ensureWorkspace);

  const workspace = useQuery(api.workspaces.getMyWorkspace);
  const workspaceId = workspace?._id;

  const validateDomain = (value: string): boolean => {
    const trimmed = value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/;
    return regex.test(trimmed);
  };

  const normalizeDomain = (value: string): string => {
    return value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
  };

  const handleCreate = async () => {
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
    setIsCreating(true);

    try {
      const ensuredWorkspaceId = workspaceId ?? (await ensureWorkspace());
      await createProject({
        name: normalized,
        domain: normalized,
        workspaceId: ensuredWorkspaceId,
      });

      setStep("success");
      setTimeout(() => {
        onSuccess?.(normalized);
        handleClose();
      }, 1200);
    } catch (error) {
      setDomainError("Failed to create project. Please try again.");
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("domain");
      setDomain("");
      setDomainError("");
      setIsCreating(false);
    }, 250);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <div className="mb-1 flex items-center gap-1.5">
          {["domain", "success"].map((s, i) => {
            const current = step === s;
            const done = step === "success" && s === "domain";
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    current && "bg-primary text-primary-foreground",
                    done && "bg-emerald-500 text-white",
                    !current && !done && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium capitalize",
                    current ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s === "success" ? "Done" : s}
                </span>
                {i < 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

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
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
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
                  Project is created immediately and crawling starts automatically.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                className="gap-1.5"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Project created!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{domain}</span> is queued and
                crawl has started.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing dashboard...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
