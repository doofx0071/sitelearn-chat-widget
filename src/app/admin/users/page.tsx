"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Users, ShieldCheck, Shield, User as UserIcon, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminContentLayout } from "@/components/admin-panel/admin-content-layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-2.5 w-48 rounded bg-muted/60" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-3 w-24 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

type GlobalRole = "admin" | "user";

const ROLE_CONFIG: Record<
  GlobalRole,
  { label: string; icon: React.ElementType; className: string }
> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    className:
      "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  user: {
    label: "User",
    icon: UserIcon,
    className:
      "border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
  },
};

function RoleBadge({ role }: { role: GlobalRole }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

// ─── Summary Pill ─────────────────────────────────────────────────────────────

interface SummaryPillProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading: boolean;
}

function SummaryPill({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading,
}: SummaryPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          iconBg
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground leading-none">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {isLoading ? "…" : value}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const isLoading = users === undefined;

  const adminCount = users?.filter((u: { role: string }) => u.role === "admin").length ?? 0;
  const userCount = users?.filter((u: { role: string }) => u.role === "user").length ?? 0;

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      await updateUserRole({ userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  return (
    <AdminContentLayout title="Super Admin · Users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            All registered users across the platform.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <SummaryPill
            label="Total Users"
            value={users?.length ?? 0}
            icon={Users}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Admins"
            value={adminCount}
            icon={ShieldCheck}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
            isLoading={isLoading}
          />
          <SummaryPill
            label="Users"
            value={userCount}
            icon={UserIcon}
            iconColor="text-zinc-500"
            iconBg="bg-zinc-400/10"
            isLoading={isLoading}
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">User List</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading users…"
                : `${users.length} user${users.length !== 1 ? "s" : ""} total`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={8} />
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No users yet
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs uppercase tracking-wider text-muted-foreground">
                      User
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Global Role
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Joined
                    </TableHead>
                    <TableHead className="text-right pr-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: { _id: string; name?: string; email: string; role: GlobalRole; createdAt: number }) => (
                    <TableRow key={user._id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground select-none">
                            {user.name?.slice(0, 2).toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name}</span>
                            <code className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">
                              {user._id}
                            </code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(user._id, "admin")}>
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user._id, "user")}>
                              Make User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
