"use client";

import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Globe, ShieldCheck, BarChart3 } from "lucide-react";

export default function SettingsPage() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const workspace = useQuery(api.workspaces.getMyWorkspace);
  const projects = useQuery(
    api.projects.list,
    workspace?._id ? { workspaceId: workspace._id } : "skip"
  );

  const projectCount = projects?.length ?? 0;
  const projectLimit = workspace?.maxProjects ?? 0;
  const pagesIndexed = (projects ?? []).reduce(
    (sum, project) => sum + (project.pageCount ?? 0),
    0
  );

  return (
    <>
      <Header breadcrumbs={[{ label: "Settings" }]} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Account and usage information for your projects.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Account</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Your profile and authentication information.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="text-sm text-foreground">{currentUser?.name ?? "Not set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{currentUser?.email ?? "Not set"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Usage</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Current limits and total usage across your websites.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Projects</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {projectCount}
                  <span className="text-sm font-normal text-muted-foreground"> / {projectLimit || "-"}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pages Indexed</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{pagesIndexed.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Plan</p>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {workspace?.plan ?? "free"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">AI Configuration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                AI keys and model settings are managed globally by admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>- Client dashboards do not manage model API keys.</p>
              <p>
                - Global AI provider/model is configured under
                <span className="font-medium text-foreground"> Admin -&gt; AI</span>.
              </p>
              <p>- Chatbot widget and playground use the admin-managed AI configuration.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Website Projects</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Add and manage your websites from the Dashboard projects page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage crawling, embed, and chatbot behavior per site from
              <span className="font-medium text-foreground"> Dashboard</span>.
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
