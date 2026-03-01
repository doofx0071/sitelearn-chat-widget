"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Header } from "@/components/dashboard/header";
import { EmbedCode } from "@/components/dashboard/embed-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProjectEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = useQuery(api.projects.get, { projectId: id as Id<"projects"> });

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name, href: `/dashboard/projects/${id}` },
          { label: "Embed" },
        ]}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Page header */}
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link href={`/dashboard/projects/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Embed Widget
                </h1>
                <Badge variant="secondary" className="text-[10px]">
                  {project.domain}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure and embed the AI chat widget on your website.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Main embed panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Widget configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Customize the appearance and copy the embed code for your site.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmbedCode projectId={id} />
                </CardContent>
              </Card>
            </div>

            {/* Side info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Project info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`https://${project.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {project.domain}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Project ID:</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      {id}
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Installation guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground">
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground">1. Copy the embed code</p>
                    <p>
                      Choose either the HTML script tag or the React component, depending on your stack.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground">2. Paste into your site</p>
                    <p>
                      For HTML, add the script before your closing{" "}
                      <code className="rounded bg-muted px-1 font-mono text-[10px]">&lt;/body&gt;</code>{" "}
                      tag. For React, import the component anywhere in your tree.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground">3. Deploy and test</p>
                    <p>
                      The widget will appear on your site. Use the Playground tab to test responses before going live.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Before going live</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    Re-run learning after major content updates so answers stay current.
                  </p>
                  <p>
                    Test your first prompts in Playground, then validate behavior on your real site using the embed preview and production URL.
                  </p>
                  <p>
                    Keep your script URL and API endpoint consistent across environments (staging and production).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
