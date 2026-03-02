"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Plus, Globe, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { ProjectCard, type Project } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const previousStatusByProjectRef = useRef<Record<string, string>>({});
  
  const workspace = useQuery(api.workspaces.getMyWorkspace);
  const workspaceId = workspace?._id;

  const rawProjects = useQuery(
    api.projects.list,
    workspaceId ? { workspaceId } : "skip"
  );
  
  const removeProject = useMutation(api.projects.remove);
  const startCrawl = useMutation(api.crawl.start.startCrawl);

  const isLoading = rawProjects === undefined;

  // Map Convex projects to the UI Project type
  const projects: Project[] = (rawProjects || []).map((p: any) => {
    let mappedStatus: Project["status"] = "pending";
    if (p.crawlStatus === "crawling") mappedStatus = "crawling";
    else if (p.crawlStatus === "completed") mappedStatus = "active";
    else if (p.crawlStatus === "failed") mappedStatus = "failed";
    else if (p.crawlStatus === "idle") mappedStatus = "paused";

    return {
      id: p._id,
      name: p.name,
      domain: p.domain,
      status: mappedStatus,
      pageCount: p.pageCount || 0,
      lastCrawled: p.lastCrawledAt ? new Date(p.lastCrawledAt).toISOString() : null,
    };
  });

  const handleSettings = (id: string) => {
    router.push(`/dashboard/projects/${id}`);
  };

  const handleEmbedCode = (id: string) => {
    router.push(`/dashboard/projects/${id}?tab=embed`);
  };

  const handleDelete = async (id: string) => {
    try {
      await removeProject({ projectId: id as any });
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleRecrawl = async (id: string) => {
    try {
      const project = projects.find((p) => p.id === id);
      if (!project) {
        toast.error("Project not found");
        return;
      }

      await startCrawl({
        projectId: id as any,
        url: `https://${project.domain}`,
        depth: "full",
      });
      toast.success("Re-learning started");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start re-learning"
      );
    }
  };

  useEffect(() => {
    if (!rawProjects) return;

    for (const project of rawProjects) {
      const prev = previousStatusByProjectRef.current[project._id];
      const curr = project.crawlStatus ?? "idle";

      if (prev === "crawling" && curr === "completed") {
        toast.success(`Learning finished for ${project.domain}`);
      }
      if (prev === "crawling" && curr === "failed") {
        toast.error(`Learning failed for ${project.domain}`);
      }

      previousStatusByProjectRef.current[project._id] = curr;
    }
  }, [rawProjects]);

  const handleProjectCreated = (domain: string) => {
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
                Add your first website to get started. SiteLearn will learn
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
