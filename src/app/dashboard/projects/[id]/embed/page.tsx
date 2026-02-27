"use client";

import { use } from "react";
import { Header } from "@/components/dashboard/header";
import { EmbedCode } from "@/components/dashboard/embed-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock data — replace with Convex query
const MOCK_PROJECT = {
  id: "proj_1",
  name: "Acme Docs",
  domain: "docs.acme.com",
};

export default function ProjectEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: MOCK_PROJECT.name, href: `/dashboard/projects/${id}` },
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
                  {MOCK_PROJECT.domain}
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
                      href={`https://${MOCK_PROJECT.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {MOCK_PROJECT.domain}
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
                  <CardTitle className="text-sm">Allowed domains</CardTitle>
                  <CardDescription className="text-xs">
                    The widget will only load on these domains.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[MOCK_PROJECT.domain, `www.${MOCK_PROJECT.domain}`].map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="font-mono text-[11px] text-foreground">{d}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600">
                        Verified
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="mt-1 h-7 w-full text-xs text-muted-foreground">
                    + Add domain
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
