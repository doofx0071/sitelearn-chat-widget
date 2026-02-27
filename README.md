# SiteLearn Chat Widget

A production-ready multi-tenant SaaS that turns any website into an intelligent AI chatbot. Crawl your site, generate embeddings, and deploy a customizable chat widget — in minutes.

## Features

- **Multi-tenant Architecture**: Workspaces with role-based access control
- **Domain Verification**: Verify ownership via DNS TXT or HTML meta tag
- **Intelligent Crawling**: Sitemap-aware with robots.txt compliance
- **RAG-powered Chat**: Vector search + LLM for accurate answers with citations
- **Embeddable Widget**: Shadow DOM isolation, customizable themes
- **BYOK Support**: Bring your own AI provider API keys
- **Real-time Dashboard**: Monitor crawls, test bots, manage conversations

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.2.1 |
| Components | shadcn/ui 3.8.5 |
| Backend | Convex 1.32.0 |
| Auth | Better Auth 1.4.19 + Convex Component |
| Vector DB | Convex Vector Search |
| Testing | Vitest 4.0.18 |

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd sitelearn-chat-widget
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start Convex (creates dev deployment)
npx convex dev

# Start Next.js dev server
npm run dev
```

## Environment Variables

```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Provider (for default OpenRouter usage)
OPENROUTER_API_KEY=your-openrouter-key
```

## Project Structure

```
sitelearn-chat-widget/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema with vector index
│   ├── auth.ts            # User sync from Better Auth
│   ├── lib/
│   │   └── authorization.ts # RLS enforcement
│   ├── crawl/             # Crawl pipeline actions
│   ├── chat/              # RAG + LLM actions
│   ├── widget/            # Widget auth & rate limiting
│   └── domains/           # Domain verification
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth pages (login, signup)
│   │   ├── dashboard/     # Dashboard pages
│   │   └── api/auth/      # Better Auth API routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── auth/          # Auth forms
│   ├── lib/
│   │   ├── crawler/       # URL parsing, extraction
│   │   ├── rag/           # Chunking, embeddings
│   │   ├── auth.ts        # Better Auth config
│   │   └── auth-client.ts # Auth client hooks
│   └── widget/            # Embeddable widget
├── docs/                  # Documentation
└── vitest.config.ts       # Test configuration
```

## Architecture

### Data Flow

1. **Crawling**: User adds domain → verify ownership → crawl pages → extract content
2. **Indexing**: Chunk content → generate embeddings → store in Convex vector DB
3. **Chat**: Widget sends query → embed query → vector search → LLM with context → stream response

### Security

- Row-level security via authorization guards on every function
- Domain verification required before crawling
- Bot API keys with origin allowlisting and rate limiting
- BYOK keys encrypted and never sent to client
- Shadow DOM isolation for widget CSS

### Multi-tenancy

```
Workspace (tenant boundary)
├── Members (owner/admin/member roles)
├── Provider Keys (BYOK)
└── Projects (domain + bot)
    ├── Bot API Keys
    ├── Crawl Jobs
    ├── Pages & Chunks (vector indexed)
    └── Conversations & Messages
```

## Available Scripts

```bash
npm run dev              # Start Next.js dev server
npm run convex:dev       # Start Convex dev mode
npm run test             # Run Vitest tests
npm run test:ui          # Run tests with UI
npm run tooling          # Check for dependency updates
npm run widget:build     # Build widget bundle
npm run build            # Build for production
```

## Widget Embed Code

```html
<script 
  src="https://yoursite.com/widget/v1/widget.js" 
  data-bot="BOT_ID"
  data-primary-color="#3b82f6"
  data-position="bottom-right"
  data-welcome="Hi! How can I help?"
></script>
```

## Documentation

- [Setup Guide](./docs/setup.md)
- [Architecture](./docs/architecture.md)
- [Versions](./docs/versions.md)

## License

MIT
