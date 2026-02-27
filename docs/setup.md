# Setup Instructions

## 1. Clone and Install
```bash
git clone <repository-url>
cd sitelearn-chat-widget
npm install
```

## 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in the required values:
```bash
cp .env.example .env.local
```

## 3. Convex Setup
1. Install Convex CLI if not already: `npm install -g convex`
2. Initialize the project: `npx convex dev`
3. This will create your deployment and provide the `CONVEX_URL`.

## 4. Better Auth Configuration
1. Generate a secret: `openssl rand -base64 32`
2. Add it to `BETTER_AUTH_SECRET` in `.env.local`.
3. Configure your OAuth providers (e.g., GitHub) in the respective developer portals and add the IDs/Secrets.

## 5. Running the Project
- Development: `npm run dev`
- Convex Dev: `npm run convex:dev`
- Tests: `npm run test`
