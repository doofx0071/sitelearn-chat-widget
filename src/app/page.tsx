import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import { SiteLogo } from "@/components/site-logo";
import { LandingSessionCta } from "@/components/landing/landing-session-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stackFeatures = [
  {
    label: "Semantic Retrieval",
    title: "It reads your site, then answers with citations.",
    description:
      "Every page is crawled, chunked, and indexed. Responses point to exact source URLs so your users can verify answers in one click.",
    icon: Search,
  },
  {
    label: "Injection Defense",
    title: "Hardened widget API with domain controls.",
    description:
      "Origin validation, rate limits, and strict request guards keep your bot reliable while still embedding in minutes.",
    icon: Shield,
  },
  {
    label: "Drop-In Widget",
    title: "One script tag to go live.",
    description:
      "Paste the script snippet, choose colors, and deploy. SiteLearn handles crawling, updates, and answer generation behind the scenes.",
    icon: Code2,
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    blurb: "For fast tests and small websites.",
    href: "/signup",
    cta: "Start free",
    points: [
      "1 domain",
      "Up to 100 pages indexed",
      "500 AI responses/month",
      "SiteLearn branding",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    blurb: "For production support and growth teams.",
    href: "/signup?plan=pro",
    cta: "Start 14-day trial",
    points: [
      "Unlimited domains",
      "Up to 10,000 pages indexed",
      "20,000 AI responses/month",
      "Branding removal + analytics",
    ],
    featured: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo className="h-7 w-7" />
            <span className="font-semibold tracking-tight text-[#333333] dark:text-[#fef536]">
              SiteLearn
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground md:flex">
            <a href="#stack" className="transition-colors hover:text-foreground">
              Stack
            </a>
            <a href="#demo" className="transition-colors hover:text-foreground">
              Demo
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <LandingSessionCta kind="nav" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-8 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[120px]" />
          </div>

          <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-14 px-4 py-20 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Public Beta - Free Tier Available
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-[0.95] tracking-tighter sm:text-6xl lg:text-7xl">
                  Your website,
                  <br />
                  speaking.
                  <br />
                  <span className="bg-gradient-to-r from-[#2f2f2f] to-[#f0e422] bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-[#fef536] dark:to-[#fffce0]">
                    Instantly.
                  </span>
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  SiteLearn turns any domain into a citation-backed AI chatbot widget.
                  Crawl pages, answer questions, and ship support that feels instant.
                </p>
              </div>

              <LandingSessionCta kind="hero" />

              <p className="font-mono text-xs text-muted-foreground">
                No credit card - 500 free responses/month - deploy in 2 minutes
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 bg-primary/10 blur-2xl" />
              <div className="relative border-2 border-border bg-card p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="h-4 w-4" />
                    Widget Preview
                  </div>
                  <Badge variant="outline" className="text-[10px]">Live</Badge>
                </div>

                <div className="space-y-3 rounded-md border border-border bg-background p-4">
                  <div className="ml-auto max-w-[88%] rounded-md border border-border bg-muted/40 p-2 text-xs">
                    Does your chatbot support API docs?
                  </div>
                  <div className="max-w-[94%] rounded-md border border-primary/40 bg-primary/10 p-2 text-xs">
                    Yes. SiteLearn indexed your /docs and /api pages. You can ask endpoint,
                    auth, and rate-limit questions. <span className="font-semibold">[1]</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ask about setup, pricing, or integration
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                  &lt;script src=&quot;https://sitelearn.ai/widget.js&quot;
                  <br />
                  data-bot-id=&quot;your-bot-id&quot;&gt;&lt;/script&gt;
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-widest">Trusted workflow</span>
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono">12,847 conversations handled this week</span>
          </div>
        </section>

        <section id="stack" className="border-b border-border py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-12 flex items-center gap-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                The Intelligence Stack
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {stackFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                const isMain = idx === 0;
                return (
                  <article
                    key={feature.title}
                    className={`border border-border bg-card p-6 transition-colors hover:border-primary/60 ${
                      isMain ? "lg:col-span-3" : "lg:col-span-2"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#333333] dark:text-[#f3f3f3]">
                      <Icon className="h-3.5 w-3.5" />
                      {feature.label}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {feature.title}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="demo" className="border-b border-border bg-muted/20 py-24">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                See It Work
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">One line. Zero config.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Add the widget script and SiteLearn handles ingestion, indexing, and response quality.
                Update your docs, and answers stay synced.
              </p>

              <div className="mt-8 space-y-3 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Crawl and index starts automatically
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Answers include source citation links
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Theme and behavior configurable per project
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="mb-3 border-b border-border pb-2 font-mono text-xs text-muted-foreground">
                index.html
              </div>
              <pre className="overflow-x-auto bg-foreground p-4 text-xs text-background">
{`<script
  src="https://sitelearn.ai/widget.js"
  data-bot-id="your-bot-id"
  data-position="right"
></script>`}
              </pre>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-border py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pricing</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Simple plans. Real usage.</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`border p-6 ${
                    plan.featured
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {plan.featured ? (
                      <Badge className="bg-background text-foreground hover:bg-background">Recommended</Badge>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-sm ${plan.featured ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                    {plan.blurb}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={`${plan.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <Check className={`mt-0.5 h-4 w-4 ${plan.featured ? "text-primary-foreground" : "text-primary"}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`mt-6 w-full ${
                      plan.featured
                        ? "bg-background text-foreground hover:bg-background/90"
                        : ""
                    }`}
                    variant={plan.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-foreground py-20 text-background">
          <div className="mx-auto max-w-5xl px-4">
            <div className="space-y-2 font-mono text-sm">
              <p>
                <span className="text-primary">$</span> sitelearn init docs.yourcompany.com
              </p>
              <p className="text-primary">[ok] learning pages...</p>
              <p className="text-primary">[ok] building semantic index...</p>
              <p className="text-primary">[ok] chatbot widget deployed.</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your AI support is live.</h2>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
                <Link href="/signup">
                  Deploy now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <SiteLogo className="h-7 w-7" />
            <span className="font-semibold tracking-tight text-[#333333] dark:text-[#fef536]">
              SiteLearn
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI chatbot widgets trained on your content with citation-backed answers.
          </p>
        </div>
      </footer>
    </div>
  );
}
