"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface LandingSessionCtaProps {
  kind: "nav" | "hero";
}

export function LandingSessionCta({ kind }: LandingSessionCtaProps) {
  const { data: session, isPending } = useSession();
  const isLoggedIn = Boolean(session);

  if (kind === "nav") {
    if (isPending) {
      return (
        <Button size="sm" disabled>
          Loading
        </Button>
      );
    }

    return isLoggedIn ? (
      <Button size="sm" asChild>
        <Link href="/dashboard">Open dashboard</Link>
      </Button>
    ) : (
      <Button size="sm" asChild>
        <Link href="/signup">
          Deploy now
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" className="h-12 px-7" disabled>
          Loading
        </Button>
      </div>
    );
  }

  return isLoggedIn ? (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" className="h-12 px-7" asChild>
        <Link href="/dashboard">
          Open dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="lg" className="h-12 px-7" asChild>
        <Link href="/dashboard/settings">Account settings</Link>
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" className="h-12 px-7" asChild>
        <Link href="/signup">
          Start for free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="lg" className="h-12 px-7" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  );
}
