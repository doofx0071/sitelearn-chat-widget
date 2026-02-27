"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { ProjectCard, type Project } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { toast } from "sonner";

// Mock projects for demo — replace with Convex queries
const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_1",
    name: "Acme Docs",
    domain: "docs.acme.com",
    status: "active",
    pageCount: 1243,
    lastCrawled: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    favicon: undefined,
  },
  {
    id: "proj_2",
    name: "Marketing Site",
    domain: "acme.com",
    status: "crawling",
    pageCount: 87,
    lastCrawled: null,
    favicon: undefined,
  },
  {
    id: "proj_3",
    name: "Help Center",
    domain: "help.acme.com",
    status: "failed",
    pageCount: 0,
    lastCrawled: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    favicon: undefined,
  },
  {
    id: "proj_4",
    name: "Blog",
    domain: "blog.acme.com",
    status: "paused",
    pageCount: 342,
    lastCrawled: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    favicon: undefined,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const isLoading = false;

  const handleSettings = (id: string) => {
    router.push(`/dashboard/projects/${id}`);
  };

  const handleEmbedCode = (id: string) => {
    router.push(`/dashboard/projects/${id}/embed`);
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Project deleted");
  };

  const handleRecrawl = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "crawling" as const } : p))
    );
    toast.success("Re-crawl started");
  };

  const handleProjectCreated = (domain: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: domain,
      domain,
      status: "crawling",
      pageCount: 0,
      lastCrawled: null,
    };
    setProjects((prev) => [newProject, ...prev]);
    toast.success(`Project created for ${domain}`);
  };

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Projects</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
            </p>
          </div>
          <CreateProjectDialog
            onSuccess={handleProjectCreated}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            }
          />
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <LayoutGrid className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No projects yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Add your first website to get started. SiteLearn will crawl
                your content and build an AI chat widget.
              </p>
              <CreateProjectDialog
                onSuccess={handleProjectCreated}
                trigger={
                  <Button className="mt-6 gap-2" size="sm">
                    <Globe className="h-4 w-4" />
                    Add your first project
                  </Button>
                }
              />
            </div>
          ) : (
            /* Projects grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSettings={handleSettings}
                  onEmbedCode={handleEmbedCode}
                  onDelete={handleDelete}
                  onRecrawl={handleRecrawl}
                />
              ))}

              {/* Add project card */}
              <CreateProjectDialog
                onSuccess={handleProjectCreated}
                trigger={
                  <button className="flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border transition-colors hover:border-muted-foreground/40 hover:bg-muted/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Add project</span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
