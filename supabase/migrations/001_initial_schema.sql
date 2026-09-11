-- =============================================================================
-- SPIRIT AD AI — Supabase Database Migrations
-- Run this file in the Supabase SQL editor or via supabase db push
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner access" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- BUSINESSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  website         TEXT,
  email           TEXT,
  phone           TEXT,
  phone2          TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT DEFAULT 'Nigeria',
  opening_hours   JSONB DEFAULT '{}',
  brand_voice     TEXT,
  target_audience TEXT,
  currency        TEXT DEFAULT 'NGN',
  currency_symbol TEXT DEFAULT '₦',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- BUSINESS MEMBERS
-- =============================================================================
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'staff');

CREATE TABLE IF NOT EXISTS public.business_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.member_role NOT NULL DEFAULT 'staff',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is a member of a business
CREATE OR REPLACE FUNCTION public.is_business_member(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get all business IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.my_business_ids()
RETURNS SETOF UUID AS $$
  SELECT business_id FROM public.business_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Business RLS: members can read; owner/admin can write
CREATE POLICY "businesses: member read" ON public.businesses
  FOR SELECT USING (public.is_business_member(id));

CREATE POLICY "businesses: owner write" ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses: owner update" ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "businesses: owner delete" ON public.businesses
  FOR DELETE USING (owner_id = auth.uid());

-- Business members RLS
CREATE POLICY "business_members: member read" ON public.business_members
  FOR SELECT USING (public.is_business_member(business_id));

CREATE POLICY "business_members: owner manage" ON public.business_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Auto-insert owner as member on business creation
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_business_created ON public.businesses;
CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business();

-- =============================================================================
-- PRODUCTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  price       NUMERIC(12, 2),
  currency    TEXT DEFAULT 'NGN',
  unit        TEXT DEFAULT 'unit',
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: member access" ON public.products
  FOR ALL USING (public.is_business_member(business_id));

CREATE TABLE IF NOT EXISTS public.product_inventory (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  quantity            NUMERIC(12, 2) DEFAULT 0,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'low_stock', 'out_of_stock')),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_inventory: member access" ON public.product_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND public.is_business_member(p.business_id)
    )
  );

-- =============================================================================
-- KNOWLEDGE BASE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs: member access" ON public.faqs
  FOR ALL USING (public.is_business_member(business_id));

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT,
  file_url      TEXT,
  document_type TEXT DEFAULT 'text' CHECK (document_type IN ('text', 'pdf', 'image', 'other')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_documents: member access" ON public.knowledge_documents
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================
CREATE TYPE public.campaign_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed', 'cancelled'
);

CREATE TYPE public.social_platform AS ENUM ('facebook', 'instagram', 'whatsapp', 'all');

CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content_type    TEXT DEFAULT 'product_promotion',
  platform        public.social_platform DEFAULT 'all',
  status          public.campaign_status DEFAULT 'draft',
  headline        TEXT,
  caption         TEXT,
  call_to_action  TEXT,
  hashtags        TEXT[],
  image_url       TEXT,
  image_prompt    TEXT,
  scheduled_time  TIMESTAMPTZ,
  published_time  TIMESTAMPTZ,
  product_id      UUID REFERENCES public.products(id),
  ai_generated    BOOLEAN DEFAULT TRUE,
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  meta_post_id    TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: member access" ON public.campaigns
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- CUSTOMERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             TEXT,
  phone            TEXT,
  email            TEXT,
  platform         TEXT DEFAULT 'whatsapp',
  platform_user_id TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, platform, platform_user_id)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: member access" ON public.customers
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- CONVERSATIONS & MESSAGES
-- =============================================================================
CREATE TYPE public.conversation_status AS ENUM ('open', 'needs_human', 'assigned', 'resolved', 'closed');

CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES public.customers(id),
  platform      TEXT DEFAULT 'whatsapp',
  status        public.conversation_status DEFAULT 'open',
  assigned_to   UUID REFERENCES auth.users(id),
  ai_enabled    BOOLEAN DEFAULT TRUE,
  last_message  TEXT,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: member access" ON public.conversations
  FOR ALL USING (public.is_business_member(business_id));

CREATE TYPE public.sender_type AS ENUM ('customer', 'ai', 'human', 'system');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'document', 'template');

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type     public.sender_type NOT NULL,
  sender_id       TEXT,
  message         TEXT,
  message_type    public.message_type DEFAULT 'text',
  ai_generated    BOOLEAN DEFAULT FALSE,
  ai_confidence   NUMERIC(5, 2),
  meta_message_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: member access" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND public.is_business_member(c.business_id)
    )
  );

-- =============================================================================
-- ORDERS
-- =============================================================================
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled');

CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES public.customers(id),
  conversation_id  UUID REFERENCES public.conversations(id),
  status           public.order_status DEFAULT 'pending',
  total_amount     NUMERIC(12, 2),
  delivery_address TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: member access" ON public.orders
  FOR ALL USING (public.is_business_member(business_id));

CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity   NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2),
  notes      TEXT
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: member access" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND public.is_business_member(o.business_id)
    )
  );

-- =============================================================================
-- LEADS
-- =============================================================================
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'negotiating', 'won', 'lost');
CREATE TYPE public.lead_type AS ENUM ('standard', 'high_value', 'bulk', 'recurring');

CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES public.customers(id),
  conversation_id UUID REFERENCES public.conversations(id),
  product_id      UUID REFERENCES public.products(id),
  quantity        NUMERIC(12, 2),
  lead_type       public.lead_type DEFAULT 'standard',
  lead_score      INTEGER DEFAULT 0,
  status          public.lead_status DEFAULT 'new',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: member access" ON public.leads
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- AI PERMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{
    "marketing": {
      "generate_adverts": true,
      "generate_images": true,
      "schedule_posts": true,
      "publish_automatically": false
    },
    "facebook": {
      "publish_posts": true,
      "delete_posts": false
    },
    "instagram": {
      "publish_posts": true,
      "delete_posts": false
    },
    "whatsapp": {
      "read_messages": true,
      "answer_faqs": true,
      "detect_leads": true,
      "send_bulk": false
    },
    "orders": {
      "create_drafts": true,
      "confirm_orders": false
    },
    "business": {
      "modify_products": false,
      "modify_prices": false
    }
  }',
  autopilot_enabled   BOOLEAN DEFAULT FALSE,
  approval_mode       TEXT DEFAULT 'approval' CHECK (approval_mode IN ('approval', 'auto')),
  confidence_threshold INTEGER DEFAULT 60,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_permissions: member access" ON public.ai_permissions
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- AI ACTION QUEUE
-- =============================================================================
CREATE TYPE public.action_status AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.ai_actions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id         UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id),
  action_type         TEXT NOT NULL,
  platform            public.social_platform,
  description         TEXT,
  payload             JSONB DEFAULT '{}',
  permission_required TEXT,
  status              public.action_status DEFAULT 'pending',
  approved_by         UUID REFERENCES auth.users(id),
  approved_at         TIMESTAMPTZ,
  rejection_note      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_actions: member access" ON public.ai_actions
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id),
  actor       TEXT DEFAULT 'user' CHECK (actor IN ('user', 'ai', 'system')),
  action      TEXT NOT NULL,
  platform    TEXT,
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  result      TEXT DEFAULT 'success' CHECK (result IN ('success', 'failure', 'pending')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: member read" ON public.audit_logs
  FOR SELECT USING (public.is_business_member(business_id));

-- Service role can insert audit logs freely (done via server-side admin client)
CREATE POLICY "audit_logs: service insert" ON public.audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- INTEGRATIONS (OAuth tokens)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'whatsapp')),
  status          TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  access_token    TEXT,  -- encrypted at rest via Supabase Vault in production
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  page_id         TEXT,
  page_name       TEXT,
  account_id      TEXT,
  account_name    TEXT,
  metadata        JSONB DEFAULT '{}',
  last_synced_at  TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, platform)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Only the business owner/admin can see tokens
CREATE POLICY "integrations: owner access" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = integrations.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TYPE public.notification_type AS ENUM (
  'human_needed', 'new_lead', 'new_order', 'approval_needed',
  'publish_failed', 'account_disconnected', 'token_expired', 'new_message'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  type        public.notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: user access" ON public.notifications
  FOR ALL USING (
    user_id = auth.uid() OR public.is_business_member(business_id)
  );

-- =============================================================================
-- SCHEDULED JOBS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_type      TEXT NOT NULL,
  payload       JSONB DEFAULT '{}',
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_jobs: member access" ON public.scheduled_jobs
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- ANALYTICS SNAPSHOTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform      TEXT,
  metric_date   DATE NOT NULL,
  campaigns_total   INTEGER DEFAULT 0,
  posts_published   INTEGER DEFAULT 0,
  posts_scheduled   INTEGER DEFAULT 0,
  conversations     INTEGER DEFAULT 0,
  ai_responses      INTEGER DEFAULT 0,
  human_handoffs    INTEGER DEFAULT 0,
  leads_detected    INTEGER DEFAULT 0,
  orders_created    INTEGER DEFAULT 0,
  post_reach        INTEGER DEFAULT 0,
  post_impressions  INTEGER DEFAULT 0,
  post_engagements  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, platform, metric_date)
);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_snapshots: member access" ON public.analytics_snapshots
  FOR ALL USING (public.is_business_member(business_id));

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'businesses', 'products', 'product_inventory',
    'faqs', 'knowledge_documents', 'campaigns', 'customers',
    'conversations', 'orders', 'leads', 'ai_permissions',
    'integrations', 'scheduled_jobs'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- =============================================================================
-- STORAGE BUCKETS
-- (Run these via Supabase Dashboard > Storage or the JS client)
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-creatives', 'campaign-creatives', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-docs', 'knowledge-docs', false);

-- Storage RLS (apply in Supabase Dashboard):
-- Allow members to read/write only their own business folders using business_id prefix.

-- =============================================================================
-- SEED: PINNACLES RESOURCE CENTRE FARM
-- (Run separately after creating the first admin user)
-- =============================================================================
-- See: scripts/seed.ts
