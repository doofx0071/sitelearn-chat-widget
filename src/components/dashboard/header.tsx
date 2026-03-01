"use client";

import { useState } from "react";
import { Search, Bell, X, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "crawl" | "billing" | "system";
}

const initialNotifications: Notification[] = [];

interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export function Header({ breadcrumbs = [], className }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const typeColors: Record<Notification["type"], string> = {
    crawl: "bg-blue-500",
    billing: "bg-amber-500",
    system: "bg-slate-500",
  };

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-border bg-background px-4 gap-4",
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
        {breadcrumbs.length === 0 ? (
          <span className="font-semibold text-foreground">Dashboard</span>
        ) : (
          breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                {isLast ? (
                  <span className="truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <a
                    href={crumb.href ?? "#"}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </a>
                )}
              </span>
            );
          })
        )}
      </nav>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Search */}
        <div className="relative flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="h-8 w-56 pl-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0 text-sm">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                All caught up!
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex cursor-pointer gap-3 p-3"
                  onClick={() => markRead(notification.id)}
                >
                  <div className="mt-0.5 flex shrink-0 items-center">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        notification.read
                          ? "bg-transparent"
                          : typeColors[notification.type]
                      )}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium leading-tight",
                          !notification.read && "text-foreground"
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {notification.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-xs text-muted-foreground">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
