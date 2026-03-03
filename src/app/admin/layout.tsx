"use client";

import { useSession } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import AdminPanelShell from "@/components/admin-panel/admin-panel-shell";
import { api } from "../../../convex/_generated/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const adminStatus = useQuery(api.admin.getIsSuperAdmin);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
      return;
    }

    if (!isPending && session && adminStatus && !adminStatus.isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [session, isPending, adminStatus, router]);

  if (isPending || (session && !adminStatus)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!adminStatus?.isSuperAdmin) {
    return null;
  }

  return <AdminPanelShell>{children}</AdminPanelShell>;
}
