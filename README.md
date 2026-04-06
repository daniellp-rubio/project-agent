# AgentHub — Conversational AI for Clinics

> Turn every chat into a qualified appointment — automatically.

A multi-tenant platform for creating and deploying intelligent AI agents that qualify leads, answer questions, and convert conversations into revenue.

---

## Overview

Most clinics lose potential patients in the chat. They respond too late, miss objections, and have no visibility into why people don't book.

**AgentHub** solves this by deploying goal-oriented AI agents that:
- Handle patient conversations 24/7
- Detect intent, objections, and sentiment in real time
- Show you exactly where leads drop off — and how to fix it

---

## Key Features

| Feature | Description |
|---|---|
| **Embeddable widget** | One `<script>` tag to add the chat to any website |
| **Lead qualification** | Automatically identifies high-intent patients |
| **Conversation analytics** | Intent, sentiment, objections, and topic detection |
| **Insights dashboard** | Understand why leads aren't converting |
| **Auto system prompt improvement** | AI-generated suggestions to improve your agent |
| **Multi-tenant** | One platform, multiple organizations and agents |

---

## Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router, Server Components)
- **Database & Auth** — [Supabase](https://supabase.com) (PostgreSQL + RLS + Auth)
- **AI / LLMs** — [OpenRouter](https://openrouter.ai) (streaming completions + classifier)
- **UI** — Tailwind CSS v4, Recharts
- **Language** — TypeScript (strict)

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/daniellp-rubio/project-agent.git
cd project-agent
npm install
```

### 2. Configure environment variables

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (use JWT `eyJ...` key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (use JWT `eyJ...` key) |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `CLASSIFY_SECRET` | Generate with `openssl rand -hex 32` |

### 3. Run the database migrations

Execute `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (auth)/          # Login & register pages
├── api/             # REST endpoints (chat, classify, analytics, suggestions)
├── chat/[agentId]/  # Public chat page (embeddable)
├── dashboard/       # Admin panel (agents, conversations, analytics)
components/
├── chat/            # ChatWidget — embeddable + standalone
├── dashboard/       # AnalyticsDashboard, charts
lib/
├── supabase/        # Client, server, admin clients + types
├── openrouter/      # streamChat, chatCompletion helpers
public/
└── embed.js         # Vanilla JS snippet for third-party embedding
supabase/
└── migrations/      # SQL schema + RLS policies + triggers
```

---

## How It Works

```
User sends message
      ↓
POST /api/chat
      ↓
Validate agent → fetch system prompt
      ↓
Stream response from OpenRouter (SSE)
      ↓
Save messages to Supabase
      ↓
Every 4 messages → POST /api/classify (background)
      ↓
Classification stored → analytics updated
```

---

## Use Case

Built initially for **aesthetic clinics**, focused on:

- Automating patient interactions on their website
- Reducing manual WhatsApp workload for the sales team
- Increasing appointment conversion rates
- Understanding objections at scale (price, fear, trust)

---

## Contributing

1. Create a feature branch from `main`
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/) in English
3. Open a pull request — no direct pushes to `main`

---

## License

MIT
