# SPIRIT AD AI 🌿

**AI-powered marketing and customer-support platform for businesses on Facebook, Instagram and WhatsApp.**

Built for **Pinnacles Resource Centre Farm** (Offa, Kwara State, Nigeria) and designed as a multi-tenant SaaS platform.

---

## Features

| Module | Description |
|---|---|
| 🤖 **AI Campaign Generator** | Generates adverts using real business/product data from Supabase |
| 📅 **Content Calendar** | Visual monthly calendar with schedule, approve and publish workflow |
| 💬 **WhatsApp AI Support** | Automatically answers customers, detects leads, escalates to humans |
| 🎯 **Lead Detection** | Identifies and scores purchase intent from conversations |
| 🛒 **Order Management** | Tracks orders from WhatsApp to delivery |
| 📘 **Facebook Integration** | OAuth publishing and page analytics |
| 📷 **Instagram Integration** | OAuth publishing for Business accounts |
| 🔒 **AI Permissions** | Granular toggles — control exactly what AI can do |
| 📊 **Analytics** | Campaign, conversation, lead and order dashboards |
| 🔔 **Real-time Notifications** | Supabase Realtime for live message alerts |
| 🏢 **Multi-tenant** | Full data isolation via Supabase RLS |

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase PostgreSQL + Row Level Security
- **Auth**: Supabase Auth (email/password)
- **AI**: OpenAI GPT-4o + DALL-E 3
- **Social**: Meta Graph API (Facebook, Instagram, WhatsApp Business Platform)
- **Deployment**: Vercel + Supabase Cloud

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/majormarshall/spirit-ad-ai.git
cd spirit-ad-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Fill in your values — see SETUP.md for detailed instructions
```

### 4. Set up Supabase

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for full instructions.

```bash
# Apply the database schema
# Copy supabase/migrations/001_initial_schema.sql into the Supabase SQL Editor and run it
```

### 5. Seed demo data

```bash
SEED_USER_ID=your-supabase-user-uuid npx tsx scripts/seed.ts
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Documentation

| File | Contents |
|---|---|
| [SETUP.md](./SETUP.md) | Complete local setup guide |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Database, RLS, Storage, Realtime |
| [META_SETUP.md](./META_SETUP.md) | Facebook & Instagram OAuth |
| [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) | WhatsApp Business API & webhook |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment guide |
| [SECURITY.md](./SECURITY.md) | Security architecture |

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
META_APP_ID=
META_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Security

- All AI actions require explicit permission grants
- Supabase RLS enforces data isolation at DB level
- OAuth used for all social connections — passwords never stored
- Service role key never exposed to client
- Full AI audit log in `audit_logs` table
- Human can pause/revoke AI at any time

---

## Seed Business: Pinnacles Resource Centre Farm

The platform ships with seed data for:

- **Farm**: Pinnacles Resource Centre Farm, Offa, Kwara State
- **Website**: farm.pinnaclescentre.ng
- **Products**: Maize, Carrots, Eggs, Green Peas, Tomatoes, Bell Pepper, Garden Cucumber
- **FAQs**: 10 pre-loaded customer support questions

All data is stored in Supabase (not hardcoded in the AI).

---

## License

Private — All rights reserved.
