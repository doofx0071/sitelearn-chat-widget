"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock3 } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { AdminContentLayout } from "@/components/admin-panel/admin-content-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function relativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminSecurityPage() {
  const stats = useQuery(api.admin.getSecurityStats, { days: 7 });
  const events = useQuery(api.admin.listSecurityEvents, { limit: 80 });

  const topPattern = useMemo(() => {
    if (!events || events.length === 0) return "—";
    const counts = new Map<string, number>();
    for (const event of events) {
      for (const pattern of event.patternsMatched) {
        counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  }, [events]);

  return (
    <AdminContentLayout title="Super Admin · Security">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Telemetry</h1>
            <p className="text-sm text-muted-foreground">
              Jailbreak and abuse signals from widget traffic (last 7 days).
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <ShieldAlert className="h-3 w-3 text-amber-500" />
            Live
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{stats?.total ?? "…"}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Flagged signals captured</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Blocked Events</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{stats?.blocked ?? "…"}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Stopped before model response</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>High/Critical</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats ? (stats.bySeverity.high + stats.bySeverity.critical) : "…"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Needs closer review</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Top Pattern</CardDescription>
              <CardTitle className="text-sm">{topPattern}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Most frequent trigger</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Security Events</CardTitle>
            <CardDescription>PII-safe view (hashed identifiers are not shown in UI)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Patterns</TableHead>
                  <TableHead>Blocked</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.length ? (
                  events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{event.eventType}</TableCell>
                      <TableCell className="text-xs">{event.endpoint}</TableCell>
                      <TableCell className="text-xs">
                        {event.patternsMatched.length ? event.patternsMatched.join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        {event.blocked ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {relativeTime(event.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No events captured yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
