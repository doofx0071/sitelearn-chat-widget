import Link from "next/link";
import { Bot, Code2, MessageSquare, Search, Shield, Zap } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { SiteLogo } from "@/components/site-logo";

interface AuthSplitLayoutProps {
  variant: "login" | "signup";
  title: string;
  subtitle: string;
  footerQuestion: string;
  footerLinkLabel: string;
  footerHref: string;
  children: React.ReactNode;
}

export function AuthSplitLayout({
  variant,
  title,
  subtitle,
  footerQuestion,
  footerLinkLabel,
  footerHref,
  children,
}: AuthSplitLayoutProps) {
  const illustrationTitle =
    variant === "signup"
      ? "Launch your first support bot in minutes."
      : "Turn your content into a live chatbot widget.";

  const illustrationSubtitle =
    variant === "signup"
      ? "Create an account, index your site, and publish a branded widget without extra setup."
      : "Crawl your website, answer with citations, and ship support that feels instant.";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Panel: Light in light mode, Dark in dark mode */}
      <section className="relative hidden border-r border-border bg-background lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 xl:gap-4"
            >
              <SiteLogo className="h-10 w-10 xl:h-12 xl:w-12" mode="auto" />
              <span className="text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">
                SiteLearn
              </span>
            </Link>

            <h1 className="mt-10 max-w-lg text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
              {illustrationTitle}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              {illustrationSubtitle}
            </p>

            {variant === "signup" ? (
              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { icon: Search, title: "Learning", hint: "Auto index" },
                  { icon: Bot, title: "Brand", hint: "Custom widget" },
                  { icon: MessageSquare, title: "Answer", hint: "With citations" },
                  { icon: Zap, title: "Deploy", hint: "One script" },
                ].map(({ icon: Icon, title: cardTitle, hint }) => (
                  <div
                    key={cardTitle}
                    className="group relative overflow-hidden rounded-lg border border-border/20 bg-muted/5 p-4 transition-all hover:border-primary/40 hover:bg-muted/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Icon className="relative h-4 w-4 text-primary" />
                    <p className="relative mt-2 text-sm font-semibold text-foreground">
                      {cardTitle}
                    </p>
                    <p className="relative text-xs text-muted-foreground">{hint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-foreground/90">
                  <Search className="h-4 w-4 text-primary" />
                  Citation-backed answers from indexed pages
                </div>
                <div className="flex items-center gap-2 text-foreground/90">
                  <Shield className="h-4 w-4 text-primary" />
                  Domain-safe API routing and limits
                </div>
                <div className="flex items-center gap-2 text-foreground/90">
                  <Code2 className="h-4 w-4 text-primary" />
                  Deploy widget with one script tag
                </div>
              </div>
            )}
          </div>

          {variant === "signup" ? (
            <div className="rounded-lg border border-border/20 bg-muted/5 p-4 font-mono text-xs leading-relaxed text-foreground/85">
              step 1/2: account + workspace
              <br />
              step 2/2: add domain + learning
              <br />
              status: ready to deploy widget
            </div>
          ) : (
            <div className="rounded-lg border border-border/20 bg-muted/5 p-4 font-mono text-xs leading-relaxed text-foreground/85 shadow-[0_0_40px_-10px_rgba(254,245,54,0.18)]">
              &gt; sitelearn init yourdomain.com
              <br />
              [ok] learning pages...
              <br />
              [ok] building semantic index...
              <br />
              [ok] widget deployed.
            </div>
          )}
        </div>
      </section>

      {/* Right Panel: Dark in light mode, Light in dark mode */}
      <section className="relative flex items-center justify-center bg-foreground px-4 py-10 sm:px-6 lg:px-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ModeToggle className="mr-0" />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 sm:gap-4 lg:hidden"
            >
              <SiteLogo className="h-10 w-10 sm:h-11 sm:w-11" mode="inverted" />
              <span className="text-2xl font-semibold tracking-tight text-background sm:text-3xl">
                SiteLearn
              </span>
            </Link>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-background">{title}</h2>
            <p className="mt-2 text-sm text-background/80">{subtitle}</p>
          </div>

          <div className="border border-white/20 dark:border-black/20 bg-white/5 dark:bg-black/5 p-5 sm:p-6">{children}</div>

          <p className="text-center text-sm text-background/70">
            {footerQuestion}{" "}
            <Link
              href={footerHref}
              className="font-medium text-background/90 underline underline-offset-4 decoration-background/50 hover:text-background hover:decoration-background"
            >
              {footerLinkLabel}
            </Link>
          </p>

          <p className="text-center text-sm text-background/70">
            <Link href="/" className="underline underline-offset-4 hover:text-background">
              Back to home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
