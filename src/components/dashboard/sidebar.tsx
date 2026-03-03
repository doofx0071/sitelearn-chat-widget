"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  User,
  Building2,
  Plus,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SiteLogo } from "@/components/site-logo";
import { cn } from "@/lib/utils";

const workspaces = [
  { id: "ws-1", name: "Acme Corp", plan: "Pro", avatar: "AC" },
  { id: "ws-2", name: "Personal", plan: "Free", avatar: "PE" },
  { id: "ws-3", name: "Side Project", plan: "Free", avatar: "SP" },
];

const navItems = [
  { label: "Projects", href: "/dashboard", icon: LayoutGrid },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

interface SidebarProps {
  defaultCollapsed?: boolean;
}

export function Sidebar({ defaultCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b border-border px-3", collapsed ? "justify-center" : "gap-2 px-4")}>
        <SiteLogo className="h-7 w-7 shrink-0" />
        {!collapsed && (
          <span className="font-semibold tracking-tight text-[#333333] dark:text-[#fef536]">
            SiteLearn
          </span>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className={cn("p-2", collapsed && "flex justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto w-full justify-start gap-2 px-2 py-2 font-normal hover:bg-sidebar-accent",
                collapsed && "w-10 justify-center px-0"
              )}
            >
              <Avatar className="h-6 w-6 shrink-0 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
                  {activeWorkspace.avatar}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium leading-tight text-sidebar-foreground">
                      {activeWorkspace.name}
                    </span>
                    <span className="text-[10px] leading-tight text-muted-foreground">
                      {activeWorkspace.plan} plan
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                className="gap-2"
              >
                <Avatar className="h-5 w-5 rounded-md">
                  <AvatarFallback className="rounded-md bg-primary text-[9px] font-semibold text-primary-foreground">
                    {ws.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{ws.name}</span>
                  <span className="text-[10px] text-muted-foreground">{ws.plan}</span>
                </div>
                {activeWorkspace.id === ws.id && (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="mx-2 w-auto" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-2 w-auto" />

      {/* User Dropdown */}
      <div className={cn("p-2", collapsed && "flex justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto w-full justify-start gap-2 px-2 py-2 font-normal hover:bg-sidebar-accent",
                collapsed && "w-10 justify-center px-0"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="text-xs font-medium">JD</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium leading-tight text-sidebar-foreground">
                      Jane Doe
                    </span>
                    <span className="max-w-[130px] truncate text-[10px] leading-tight text-muted-foreground">
                      jane@acme.com
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Jane Doe</span>
                <span className="text-xs text-muted-foreground">jane@acme.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sm">
              <User className="h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm">
              <Building2 className="h-3.5 w-3.5" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
