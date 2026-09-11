# DEPLOYMENT GUIDE

## Deploying SPIRIT AD AI to Vercel + Supabase

---

## Prerequisites

- [ ] Supabase project set up (see SUPABASE_SETUP.md)
- [ ] All environment variables ready
- [ ] GitHub repository: `https://github.com/majormarshall/spirit-ad-ai`

---

## 1. Push to GitHub

```bash
cd "spirit ad ai"
git init
git remote add origin https://github.com/majormarshall/spirit-ad-ai.git
git add .
git commit -m "feat: initial SPIRIT AD AI platform"
git branch -M main
git push -u origin main
```

---

## 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your `spirit-ad-ai` repository
4. Click **Deploy** (Vercel auto-detects Next.js)

---

## 3. Configure Environment Variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add all variables from `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
META_APP_ID
META_APP_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN
NEXT_PUBLIC_APP_URL          ← Set to your Vercel URL e.g. https://spirit-ad-ai.vercel.app
APP_SECRET
CRON_SECRET
APP_TIMEZONE
```

---

## 4. Verify Cron Job

The daily AI campaign cron runs at 7:00 AM UTC (8:00 AM WAT) via `vercel.json`.

To verify it's configured correctly:
- In Vercel Dashboard → your project → **Cron Jobs**
- You should see `/api/cron/daily-campaign` scheduled for `0 7 * * *`

The cron uses `CRON_SECRET` for authorization. Set a strong random value.

---

## 5. Update Supabase Auth Redirect URLs

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## 6. Configure WhatsApp Webhook

Update the webhook URL in Meta Developer Console:
```
https://your-app.vercel.app/api/webhooks/whatsapp
```

---

## 7. Redeploy After Config

After adding all environment variables in Vercel:
1. Go to **Deployments**
2. Click the latest deployment → **Redeploy**

---

## Custom Domain (Optional)

1. In Vercel → **Settings → Domains** → Add your domain
2. Update DNS records at your registrar
3. Update `NEXT_PUBLIC_APP_URL` and Supabase redirect URLs to your custom domain

---

## Monitoring

- **Vercel Dashboard**: Functions logs, cron job history, error tracking
- **Supabase Dashboard**: Database queries, Auth events, Storage usage
- **Audit Logs**: `/dashboard/analytics` in the app shows AI action history
