import Link from "next/link";
import {
  Globe,
  Zap,
  Bot,
  Code2,
  BarChart3,
  Shield,
  ChevronRight,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthRedirect } from "@/components/auth-redirect";

const features = [
  {
    icon: Globe,
    title: "Intelligent Crawling",
    description:
      "SiteLearn automatically discovers and indexes every public page on your domain, keeping its knowledge current with scheduled re-crawls.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Bot,
    title: "AI-Powered Answers",
    description:
      "Powered by the latest LLMs, your bot answers questions with citations drawn directly from your site — no hallucinations, full transparency.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Code2,
    title: "One-Line Embed",
    description:
      "Drop a single script tag into your HTML or install the React component. Your AI widget is live in under two minutes.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Real-Time Sync",
    description:
      "When you publish new content, SiteLearn detects changes and updates its knowledge base automatically — no manual retraining required.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description:
      "Understand what your users are asking. Spot content gaps, track resolution rates, and improve your docs based on real questions.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Shield,
    title: "Domain Verification",
    description:
      "Only you can create a bot for your domain. We verify ownership via DNS or HTML meta tags before crawling begins.",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects and side experiments.",
    features: [
      "1 project",
      "Up to 100 pages indexed",
      "500 AI responses / month",
      "SiteLearn branding",
      "Community support",
    ],
    cta: "Get started free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For teams shipping production-grade support experiences.",
    features: [
      "Unlimited projects",
      "Up to 10,000 pages indexed",
      "20,000 AI responses / month",
      "Remove branding",
      "Custom domain",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated infrastructure, SLAs, and white-glove onboarding.",
    features: [
      "Unlimited pages & responses",
      "Dedicated crawl workers",
      "SSO / SAML",
      "Custom LLM integration",
      "99.9% uptime SLA",
      "Dedicated Slack channel",
    ],
    cta: "Contact sales",
    href: "mailto:sales@sitelearn.ai",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <>
      <AuthRedirect />
      <div className="flex min-h-screen flex-col bg-background">
        {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Globe className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">SiteLearn</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pb-24 pt-20">
          {/* Subtle gradient blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <Badge
              variant="secondary"
              className="mb-6 inline-flex items-center gap-1.5 text-xs"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Now in public beta — free to try
            </Badge>

            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Turn your website into
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                an AI assistant
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
              SiteLearn crawls your entire site, builds a knowledge base, and
              deploys a beautiful chat widget — trained on your content, ready
              in minutes.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-12 gap-2 px-8 text-base" asChild>
                <Link href="/signup">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
                asChild
              >
                <Link href="/dashboard">View demo</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Free tier available
            </p>

            {/* Hero mockup */}
            <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex h-8 items-center gap-1.5 border-b border-border bg-muted/50 px-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="ml-4 h-4 flex-1 rounded-full bg-muted" />
              </div>
              <div className="grid grid-cols-5 divide-x divide-border">
                {/* Sidebar mock */}
                <div className="col-span-1 space-y-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-7 rounded-md ${i === 0 ? "bg-accent" : "bg-transparent"}`}
                    />
                  ))}
                </div>
                {/* Content mock */}
                <div className="col-span-4 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-7 w-24 rounded-md bg-primary/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted/60" />
                        <div className="mt-3 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500/50"
                            style={{ width: `${60 + i * 15}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4 text-xs">
                Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to ship
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                SiteLearn handles the hard parts — crawling, embedding,
                inference, and delivery — so you can focus on your product.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4 text-xs">
                How it works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Live in three steps
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Add your domain",
                  description:
                    "Verify ownership of your domain via DNS or a meta tag. We'll start crawling immediately.",
                },
                {
                  step: "02",
                  title: "We index your content",
                  description:
                    "SiteLearn crawls every page, chunks the content, and builds a semantic search index.",
                },
                {
                  step: "03",
                  title: "Embed the widget",
                  description:
                    "Copy one script tag into your site. Your AI chat widget is live and answering questions.",
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl font-bold text-muted-foreground/30">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-border py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4 text-xs">
                Pricing
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start free. Upgrade when you need more.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlighted
                      ? "border-primary bg-primary text-primary-foreground shadow-xl"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 text-[10px] font-semibold">
                        Most popular
                      </Badge>
                    </div>
                  )}

                  <div>
                    <p
                      className={`text-sm font-medium ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {plan.name}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span
                          className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                        >
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-primary-foreground/70" : "text-emerald-500"}`}
                        />
                        <span
                          className={`text-sm ${plan.highlighted ? "text-primary-foreground/90" : "text-foreground"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      asChild
                      className={`w-full ${
                        plan.highlighted
                          ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                          : ""
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      <Link href={plan.href}>
                        {plan.cta}
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join hundreds of teams already using SiteLearn to answer customer
              questions automatically.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-12 gap-2 px-8" asChild>
                <Link href="/signup">
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold tracking-tight">SiteLearn</span>
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                AI-powered chat widgets trained on your website content.
              </p>
            </div>

            {[
              {
                heading: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                heading: "Developers",
                links: ["Documentation", "API Reference", "Widget SDK", "Status"],
              },
              {
                heading: "Company",
                links: ["About", "Blog", "Privacy", "Terms"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SiteLearn. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with ❤️ and Convex
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
