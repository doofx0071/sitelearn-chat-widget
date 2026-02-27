# Architecture Overview

## High-Level Architecture
SiteLearn Chat Widget is built as a modern web application using Next.js for the frontend and Convex for the backend/database.

### Components:
- **Frontend**: Next.js (App Router), Tailwind CSS, Radix UI.
- **Backend**: Convex (Real-time database, serverless functions).
- **Authentication**: Better Auth with Convex integration.
- **AI Integration**: OpenRouter for LLM capabilities.

## Data Flow
1. **User Interaction**: User sends a message via the chat widget.
2. **Frontend**: Next.js captures the input and invokes a Convex mutation.
3. **Backend**: Convex stores the message and triggers an action to fetch AI response via OpenRouter.
4. **AI Response**: OpenRouter returns the response, which Convex stores and streams back to the client.
5. **Real-time Update**: The UI updates automatically via Convex subscriptions.

## Security Considerations
- **Authentication**: Handled by Better Auth, ensuring secure session management.
- **Environment Variables**: Sensitive keys (API keys, secrets) are stored in `.env.local` and never committed.
- **Convex Schema**: Strict schema validation to prevent unauthorized data access.
- **CORS**: Configured to allow requests only from authorized domains.
