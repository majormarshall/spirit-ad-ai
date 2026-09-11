# SUPABASE SETUP

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organisation, set a project name (e.g. `spirit-ad-ai`) and a strong database password
4. Choose the **West Africa (Lagos)** or nearest region
5. Click **Create new project** and wait for it to spin up

---

## 2. Get Your API Keys

In your project dashboard → **Settings → API**:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

Paste these into your `.env.local`.

---

## 3. Apply the Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/001_initial_schema.sql` from this repo
4. Paste the entire contents and click **Run**
5. Verify tables appear in **Table Editor**

---

## 4. Configure Authentication

In **Authentication → Settings**:

- Enable **Email/Password** sign-in
- Set **Site URL** to your app URL (e.g. `http://localhost:3000` for dev)
- Add **Redirect URLs**: `http://localhost:3000/auth/callback`
- When deploying: add your Vercel URL too

---

## 5. Set Up Storage Buckets

In **Storage → New bucket**, create these **private** buckets:

| Bucket Name | Public |
|---|---|
| `business-logos` | No |
| `product-images` | No |
| `campaign-creatives` | No |
| `knowledge-docs` | No |

Then for each bucket, add a Storage Policy (RLS):

```sql
-- Allow authenticated users to access their business folder
CREATE POLICY "Business members can manage own files"
ON storage.objects FOR ALL
USING (
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT business_id::text FROM public.business_members WHERE user_id = auth.uid()
  )
);
```

---

## 6. Enable Realtime

In **Database → Replication**, enable replication for:
- `messages`
- `notifications`
- `conversations`

---

## 7. Create First Admin User

1. Go to **Authentication → Users → Add User**
2. Enter email and password
3. Copy the generated **User ID (UUID)**
4. Run the seed script:

```bash
SEED_USER_ID=your-uuid-here npx tsx scripts/seed.ts
```

---

## 8. Row Level Security

RLS is enabled on every table in the migration. To verify:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

> ⚠️ **Never disable RLS** as a debugging shortcut. Use the service role key for server-side admin operations instead.
