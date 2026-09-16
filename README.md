# Yasirmail

Temporary email service with disposable inboxes. Built with Next.js.

## Features

- **Temporary email addresses** — generate and use disposable inboxes
- **Multiple domains** — bring your own domain or use defaults
- **IMAP support** — optional IMAP inbox polling
- **Webhook** — receive emails via webhook
- **Theme system** — 3 themes: Neo Brutal (default), Glassmorphism, Neomorph
- **Starfield background** — twinkling stars + shooting stars (theme-aware)
- **API key support** — GitHub OAuth login → generate API keys → OpenAI-style API

## Architecture

The system is **separated** into two distinct API layers:

### Internal API (Web UI)
- `/api/inbox`, `/api/download`, `/api/retention` — used by the frontend
- Accessible via session cookie (anonymous for temp mail, no API key required)
- The web UI never holds or exposes API keys

### Public API (Developers)
- `/api/v1/inbox`, `/api/v1/download`, `/api/v1/retention` — for external developers
- **Requires API key** via `Authorization: Bearer <key>` header (OpenAI-style)
- Rate limiting: implement as needed (recommended)

## API Key System

1. **Login with GitHub** at `/api-access`
2. **Generate API key** — visible exactly once (`vm-xxx...`)
3. **Use API key** — pass in `Authorization: Bearer vm-xxx...` header
4. **Revoke** — delete keys from the API access page

### Example

```bash
curl -H "Authorization: Bearer vm-xxx..." \
  https://yourdomain.com/api/v1/inbox?address=nama@domain.com
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth App client secret |
| `APP_URL` | No | Public base URL (auto-detect if not set) |
| `REQUIRE_API_KEY` | No | Set to `1` to require keys on public API |

### GitHub OAuth Setup

1. Go to [GitHub OAuth Apps](https://github.com/settings/developers) → New OAuth App
2. **Homepage URL**: `https://yourdomain.com`
3. **Callback URL**: `https://yourdomain.com/api/auth/github/callback`
4. Create the app, copy Client ID and Secret
5. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in:
   - Environment variables, or
   - Admin panel → API & Integrations (recommended)

## Deployment

### Node (MongoDB)

```bash
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run build
npm start
```

### Cloudflare (D1)

Deploy using the Cloudflare Pages + D1 setup. See admin panel for details.

## Tech Stack

- Next.js 16 (App Router)
- MongoDB / Cloudflare D1 (storage)
- tailwindcss
- framer-motion
- sonner (toasts)
- lucide-react (icons)
