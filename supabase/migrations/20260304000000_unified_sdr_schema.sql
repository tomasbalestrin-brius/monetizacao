-- ============================================================================
-- COMPLETE SELF-CONTAINED SCHEMA: Monetização + SDR CRM
-- ============================================================================
-- This migration creates ALL tables, functions, triggers, policies, and indexes
-- needed by the Bethel Monetização + SDR system from scratch.
-- Safe to run on a fresh Supabase project (uses IF NOT EXISTS throughout).
-- ============================================================================

-- ============================================================================
-- 1. TYPES / ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new role values (idempotent)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'closer';

DO $$ BEGIN
  CREATE TYPE public.lead_classification AS ENUM ('diamante', 'ouro', 'prata', 'bronze');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('novo', 'em_atendimento', 'agendado', 'concluido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('agendado', 'reagendado', 'realizado', 'nao_compareceu', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. BASE TABLES (Monetização core)
-- ============================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id)
);

-- Module permissions
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

-- Squads
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Closers
CREATE TABLE IF NOT EXISTS public.closers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Metrics
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id UUID REFERENCES public.closers(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  entries DECIMAL(15,2) NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  revenue_trend NUMERIC DEFAULT 0,
  entries_trend NUMERIC DEFAULT 0,
  cancellations INTEGER DEFAULT 0,
  cancellation_value NUMERIC DEFAULT 0,
  cancellation_entries NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure unique constraint exists
DO $$ BEGIN
  ALTER TABLE public.metrics ADD CONSTRAINT metrics_closer_period_unique UNIQUE (closer_id, period_start, period_end);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Google Sheets config
CREATE TABLE IF NOT EXISTS public.google_sheets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT,
  row_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SDRs
CREATE TABLE IF NOT EXISTS public.sdrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sdr', 'social_selling')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SDR Metrics
CREATE TABLE IF NOT EXISTS public.sdr_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id UUID NOT NULL REFERENCES public.sdrs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activated INTEGER NOT NULL DEFAULT 0,
  scheduled INTEGER NOT NULL DEFAULT 0,
  scheduled_rate NUMERIC NOT NULL DEFAULT 0,
  scheduled_same_day INTEGER NOT NULL DEFAULT 0,
  attended INTEGER NOT NULL DEFAULT 0,
  attendance_rate NUMERIC NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  funnel TEXT NOT NULL DEFAULT '',
  scheduled_follow_up INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.sdr_metrics ADD CONSTRAINT sdr_metrics_sdr_id_date_funnel_key UNIQUE (sdr_id, date, funnel);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SDR Sheets config
CREATE TABLE IF NOT EXISTS public.sdr_sheets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT,
  row_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Squad Sheets config
CREATE TABLE IF NOT EXISTS public.squad_sheets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT,
  row_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(squad_id)
);

-- User entity links
CREATE TABLE IF NOT EXISTS public.user_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('closer', 'sdr')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  month DATE NOT NULL,
  metric_key TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, month, metric_key)
);

-- Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  meeting_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SDR Funnels (legacy)
CREATE TABLE IF NOT EXISTS public.sdr_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id UUID NOT NULL REFERENCES public.sdrs(id) ON DELETE CASCADE,
  funnel_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(sdr_id, funnel_name)
);

-- Funnels (unified)
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- User funnels
CREATE TABLE IF NOT EXISTS public.user_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE(user_id, funnel_id)
);

-- Funnel daily data
CREATE TABLE IF NOT EXISTS public.funnel_daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calls_scheduled INTEGER NOT NULL DEFAULT 0,
  calls_done INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  sales_value NUMERIC NOT NULL DEFAULT 0,
  sdr_id UUID,
  leads_count INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, funnel_id, date, sdr_id)
);

-- ============================================================================
-- 3. SDR CRM TABLES (new)
-- ============================================================================

-- Extend profiles for SDR system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL;

-- Extend funnels for SDR
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS sheet_name TEXT;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS column_mapping JSONB DEFAULT '{}';
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS sync_interval_minutes INTEGER DEFAULT 30;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS import_from_date DATE DEFAULT '2026-01-01';
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- CRM Columns (Kanban board)
CREATE TABLE IF NOT EXISTS public.crm_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  editable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.crm_columns (name, position, color, editable) VALUES
  ('Contato Inicial', 1, '#2563eb', false),
  ('Aguardando Resposta', 2, '#eab308', true),
  ('Processo de Ligação', 3, '#f97316', true),
  ('Agendado', 4, '#16a34a', false),
  ('Call Realizada', 5, '#7c3aed', false)
ON CONFLICT DO NOTHING;

-- Niches
CREATE TABLE IF NOT EXISTS public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.niches (name) VALUES
  ('Salão de Beleza'), ('Barbearia'), ('Clínica Estética'), ('Academia'),
  ('Consultório Médico'), ('Consultório Odontológico'), ('Escritório de Advocacia'),
  ('Escritório de Contabilidade'), ('Agência de Marketing'), ('E-commerce'),
  ('Restaurante'), ('Loja de Roupas'), ('Imobiliária'), ('Educação/Cursos'),
  ('Tecnologia/SaaS'), ('Coaching/Mentoria'), ('Fotografia'), ('Arquitetura/Design'),
  ('Pet Shop'), ('Outros')
ON CONFLICT DO NOTHING;

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  revenue DECIMAL,
  niche TEXT,
  instagram TEXT,
  main_pain TEXT,
  difficulty TEXT,
  state TEXT,
  business_name TEXT,
  business_position TEXT CHECK (business_position IN ('dono', 'nao_dono')),
  has_partner BOOLEAN,
  knows_specialist_since TEXT,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  classification lead_classification DEFAULT 'bronze',
  qualification TEXT,
  assigned_sdr_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status lead_status NOT NULL DEFAULT 'novo',
  crm_column_id UUID REFERENCES public.crm_columns(id),
  custom_fields JSONB DEFAULT '{}',
  distributed_at TIMESTAMPTZ,
  distribution_origin TEXT CHECK (distribution_origin IN ('manual', 'automatic')),
  sheet_row_id TEXT,
  sheet_source_url TEXT,
  form_filled_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sdr_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  qualification TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 90,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  status appointment_status NOT NULL DEFAULT 'agendado',
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  attended BOOLEAN,
  converted BOOLEAN,
  conversion_value DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Closer availability
CREATE TABLE IF NOT EXISTS public.closer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(closer_id, day_of_week)
);

-- Default availability
CREATE TABLE IF NOT EXISTS public.default_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6) UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.default_availability (day_of_week, start_time, end_time, break_start, break_end) VALUES
  (1, '09:00', '18:00', '12:00', '13:00'),
  (2, '09:00', '18:00', '12:00', '13:00'),
  (3, '09:00', '18:00', '12:00', '13:00'),
  (4, '09:00', '18:00', '12:00', '13:00'),
  (5, '09:00', '18:00', '12:00', '13:00')
ON CONFLICT DO NOTHING;

-- Lead activities (CRM log)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  column_id UUID REFERENCES public.crm_columns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Qualification rules
CREATE TABLE IF NOT EXISTS public.qualification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  qualification_label TEXT NOT NULL,
  classification lead_classification,
  priority INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Distribution rules
CREATE TABLE IF NOT EXISTS public.distribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  classifications TEXT[] DEFAULT '{}',
  sdr_ids UUID[] NOT NULL,
  max_leads_per_sdr INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_days INTEGER[] DEFAULT '{}',
  schedule_time TIME DEFAULT '09:00',
  distribution_mode TEXT DEFAULT 'equal' CHECK (distribution_mode IN ('equal', 'percentage', 'funnel_limit')),
  sdr_percentages JSONB DEFAULT '{}',
  sdr_funnel_limits JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead distribution logs
CREATE TABLE IF NOT EXISTS public.lead_distribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES public.distribution_rules(id) ON DELETE SET NULL,
  leads_count INTEGER NOT NULL,
  sdr_ids UUID[] NOT NULL,
  distribution_mode TEXT NOT NULL,
  classifications TEXT[],
  lead_ids UUID[],
  workload_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SDR capacities
CREATE TABLE IF NOT EXISTS public.sdr_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  max_leads INTEGER DEFAULT 50,
  percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sdr_id, funnel_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs (audit)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cleanup logs
CREATE TABLE IF NOT EXISTS public.cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  lead_data JSONB NOT NULL,
  cleanup_reason TEXT NOT NULL CHECK (cleanup_reason IN ('bronze', 'nao_fit', 'manual')),
  google_sheet_row INTEGER,
  google_sheet_url TEXT,
  sheet_name TEXT,
  exported_at TIMESTAMPTZ,
  cleaned_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sheets_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_sheets_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Check user role (supports both old and new role names)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role::text = _role
        -- Support legacy role lookups: manager -> lider, user -> closer
        OR (_role = 'manager' AND role::text = 'lider')
        OR (_role = 'lider' AND role::text = 'manager')
        OR (_role = 'user' AND role::text = 'closer')
        OR (_role = 'closer' AND role::text = 'user')
      )
  )
$$;

-- Check module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.module_permissions
    WHERE user_id = _user_id
      AND module = _module
  )
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-assign default role on profile creation
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Check if user is linked to entity
CREATE OR REPLACE FUNCTION public.is_linked_to_entity(_user_id UUID, _entity_type TEXT, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entity_links
    WHERE user_id = _user_id
      AND entity_type = _entity_type
      AND entity_id = _entity_id
  )
$$;

-- Manager access checks
CREATE OR REPLACE FUNCTION public.manager_can_access_closer(_user_id UUID, _closer_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.closers c
    JOIN public.squads s ON s.id = c.squad_id
    JOIN public.module_permissions mp ON mp.user_id = _user_id AND mp.module = s.slug
    WHERE c.id = _closer_id
  )
$$;

CREATE OR REPLACE FUNCTION public.manager_can_access_sdr(_user_id UUID, _sdr_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.module_permissions
    WHERE user_id = _user_id
      AND module = 'sdrs'
  )
$$;

-- Check admin or lider
CREATE OR REPLACE FUNCTION public.is_admin_or_lider(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin', 'lider', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- SDR total metrics RPC
CREATE OR REPLACE FUNCTION public.get_sdr_total_metrics(p_type TEXT, p_period_start DATE, p_period_end DATE)
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'activated', COALESCE(SUM(sm.activated), 0),
    'scheduled', COALESCE(SUM(sm.scheduled), 0),
    'scheduled_follow_up', COALESCE(SUM(sm.scheduled_follow_up), 0),
    'scheduled_same_day', COALESCE(SUM(sm.scheduled_same_day), 0),
    'attended', COALESCE(SUM(sm.attended), 0),
    'sales', COALESCE(SUM(sm.sales), 0),
    'scheduled_rate', CASE WHEN SUM(sm.activated) > 0 THEN ROUND((SUM(sm.scheduled)::numeric / SUM(sm.activated)::numeric) * 100, 1) ELSE 0 END,
    'attendance_rate', CASE WHEN SUM(sm.scheduled) > 0 THEN ROUND((SUM(sm.attended)::numeric / SUM(sm.scheduled)::numeric) * 100, 1) ELSE 0 END,
    'conversion_rate', CASE WHEN SUM(sm.attended) > 0 THEN ROUND((SUM(sm.sales)::numeric / SUM(sm.attended)::numeric) * 100, 1) ELSE 0 END
  )
  FROM public.sdr_metrics sm
  JOIN public.sdrs s ON s.id = sm.sdr_id
  WHERE s.type = p_type
    AND sm.date >= p_period_start
    AND sm.date <= p_period_end
$$;

-- Funnel report RPCs
CREATE OR REPLACE FUNCTION public.get_funnel_report(p_funnel_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'leads_count', COALESCE(SUM(fdd.leads_count), 0),
    'qualified_count', COALESCE(SUM(fdd.qualified_count), 0),
    'calls_scheduled', COALESCE(SUM(fdd.calls_scheduled), 0),
    'calls_done', COALESCE(SUM(fdd.calls_done), 0),
    'sales_count', COALESCE(SUM(fdd.sales_count), 0),
    'sales_value', COALESCE(SUM(fdd.sales_value), 0)
  ) INTO result
  FROM public.funnel_daily_data fdd
  WHERE fdd.funnel_id = p_funnel_id
    AND fdd.date >= p_period_start
    AND fdd.date <= p_period_end;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_funnels_summary(p_period_start DATE, p_period_end DATE)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      f.id,
      f.name,
      f.category,
      COALESCE(SUM(fdd.leads_count), 0) AS leads_count,
      COALESCE(SUM(fdd.qualified_count), 0) AS qualified_count,
      COALESCE(SUM(fdd.calls_scheduled), 0) AS calls_scheduled,
      COALESCE(SUM(fdd.calls_done), 0) AS calls_done,
      COALESCE(SUM(fdd.sales_count), 0) AS sales_count,
      COALESCE(SUM(fdd.sales_value), 0) AS sales_value
    FROM public.funnels f
    LEFT JOIN public.funnel_daily_data fdd ON fdd.funnel_id = f.id
      AND fdd.date >= p_period_start
      AND fdd.date <= p_period_end
    WHERE f.is_active = true
    GROUP BY f.id, f.name, f.category
    ORDER BY f.name
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_person_and_product(p_period_start DATE, p_period_end DATE)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    -- Closers from funnel_daily_data
    SELECT
      c.name AS person_name,
      'closer' AS person_type,
      f.name AS funnel_name,
      SUM(fdd.sales_count) AS sales_count,
      SUM(fdd.sales_value) AS sales_value
    FROM public.funnel_daily_data fdd
    JOIN public.funnels f ON f.id = fdd.funnel_id
    JOIN public.user_entity_links uel ON uel.user_id = fdd.user_id AND uel.entity_type = 'closer'
    JOIN public.closers c ON c.id = uel.entity_id
    WHERE fdd.date >= p_period_start AND fdd.date <= p_period_end
    GROUP BY c.name, f.name

    UNION ALL

    -- Closers from metrics table (legacy, funnel = 'Geral')
    SELECT
      c.name AS person_name,
      'closer' AS person_type,
      'Geral' AS funnel_name,
      SUM(m.sales) AS sales_count,
      SUM(m.revenue) AS sales_value
    FROM public.metrics m
    JOIN public.closers c ON c.id = m.closer_id
    WHERE m.period_start >= p_period_start AND m.period_end <= p_period_end
      AND NOT EXISTS (
        SELECT 1 FROM public.funnel_daily_data fdd2
        JOIN public.user_entity_links uel2 ON uel2.user_id = fdd2.user_id AND uel2.entity_type = 'closer'
        WHERE uel2.entity_id = c.id
          AND fdd2.date >= p_period_start AND fdd2.date <= p_period_end
      )
    GROUP BY c.name

    UNION ALL

    -- SDRs from sdr_metrics
    SELECT
      s.name AS person_name,
      s.type AS person_type,
      sm.funnel AS funnel_name,
      SUM(sm.sales) AS sales_count,
      0 AS sales_value
    FROM public.sdr_metrics sm
    JOIN public.sdrs s ON s.id = sm.sdr_id
    WHERE sm.date >= p_period_start AND sm.date <= p_period_end
    GROUP BY s.name, s.type, sm.funnel

    ORDER BY person_name, funnel_name
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  lead_name TEXT;
  sdr_name TEXT;
BEGIN
  SELECT full_name INTO lead_name FROM public.leads WHERE id = NEW.lead_id;
  SELECT COALESCE(name, email) INTO sdr_name FROM public.profiles WHERE id = NEW.sdr_id;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.closer_id,
    'Novo Agendamento',
    format('Você tem um novo agendamento com %s às %s (agendado por %s)',
      lead_name,
      to_char(NEW.scheduled_date AT TIME ZONE NEW.timezone, 'DD/MM/YYYY HH24:MI'),
      COALESCE(sdr_name, 'SDR')
    ),
    'appointment',
    jsonb_build_object(
      'appointment_id', NEW.id,
      'lead_id', NEW.lead_id,
      'scheduled_date', NEW.scheduled_date
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  lead_name TEXT;
  status_label TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO lead_name FROM public.leads WHERE id = NEW.lead_id;

  CASE NEW.status::text
    WHEN 'realizado' THEN status_label := 'realizada';
    WHEN 'nao_compareceu' THEN status_label := 'marcada como não compareceu';
    WHEN 'cancelado' THEN status_label := 'cancelada';
    WHEN 'reagendado' THEN status_label := 'reagendada';
    ELSE status_label := NEW.status::text;
  END CASE;

  IF NEW.sdr_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.sdr_id,
      'Atualização de Agendamento',
      format('A call com %s foi %s', lead_name, status_label),
      'appointment_update',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'lead_id', NEW.lead_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'converted', NEW.converted,
        'conversion_value', NEW.conversion_value
      )
    );
  END IF;

  IF NEW.status IN ('realizado', 'nao_compareceu') THEN
    UPDATE public.leads SET status = 'concluido' WHERE id = NEW.lead_id;
  END IF;

  IF NEW.status = 'cancelado' THEN
    UPDATE public.leads SET status = 'em_atendimento' WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_lead_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_sdr_id IS NOT NULL AND
     (OLD.assigned_sdr_id IS NULL OR OLD.assigned_sdr_id != NEW.assigned_sdr_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.assigned_sdr_id,
      'Novo Lead Atribuído',
      format('Você recebeu um novo lead: %s (%s)', NEW.full_name, COALESCE(NEW.niche, 'sem nicho')),
      'lead_assignment',
      jsonb_build_object('lead_id', NEW.id, 'lead_name', NEW.full_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Qualification rules engine
CREATE OR REPLACE FUNCTION public.apply_qualification_rules(p_lead_id UUID)
RETURNS void AS $$
DECLARE
  rule_record RECORD;
  lead_record RECORD;
  condition_item JSONB;
  all_conditions_met BOOLEAN;
  field_value TEXT;
  condition_value TEXT;
  condition_operator TEXT;
  condition_field TEXT;
BEGIN
  SELECT * INTO lead_record FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR rule_record IN
    SELECT * FROM public.qualification_rules
    WHERE active = true
      AND (funnel_id IS NULL OR funnel_id = lead_record.funnel_id)
    ORDER BY priority ASC
  LOOP
    all_conditions_met := true;

    FOR condition_item IN SELECT * FROM jsonb_array_elements(rule_record.conditions)
    LOOP
      condition_field := condition_item->>'field';
      condition_operator := condition_item->>'operator';
      condition_value := condition_item->>'value';

      EXECUTE format('SELECT ($1.%I)::text', condition_field) INTO field_value USING lead_record;

      CASE condition_operator
        WHEN 'equals' THEN
          IF LOWER(COALESCE(field_value, '')) != LOWER(condition_value) THEN all_conditions_met := false; END IF;
        WHEN 'not_equals' THEN
          IF LOWER(COALESCE(field_value, '')) = LOWER(condition_value) THEN all_conditions_met := false; END IF;
        WHEN 'contains' THEN
          IF COALESCE(field_value, '') NOT ILIKE '%' || condition_value || '%' THEN all_conditions_met := false; END IF;
        WHEN 'greater_than' THEN
          IF COALESCE(field_value::numeric, 0) <= condition_value::numeric THEN all_conditions_met := false; END IF;
        WHEN 'less_than' THEN
          IF COALESCE(field_value::numeric, 0) >= condition_value::numeric THEN all_conditions_met := false; END IF;
        ELSE
          all_conditions_met := false;
      END CASE;

      EXIT WHEN NOT all_conditions_met;
    END LOOP;

    IF all_conditions_met THEN
      UPDATE public.leads
      SET classification = rule_record.classification,
          qualification = rule_record.qualification_label
      WHERE id = p_lead_id;
      RETURN;
    END IF;
  END LOOP;

  UPDATE public.leads SET classification = 'bronze' WHERE id = p_lead_id AND classification IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_qualify_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.apply_qualification_rules(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auth triggers
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER on_profile_created_assign_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at triggers
DO $$ BEGIN CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_closers_updated_at BEFORE UPDATE ON public.closers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON public.metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_google_sheets_config_updated_at BEFORE UPDATE ON public.google_sheets_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_sdrs_updated_at BEFORE UPDATE ON public.sdrs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_sdr_metrics_updated_at BEFORE UPDATE ON public.sdr_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_squad_sheets_config_updated_at BEFORE UPDATE ON public.squad_sheets_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON public.meeting_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_meeting_action_items_updated_at BEFORE UPDATE ON public.meeting_action_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_distribution_rules_updated_at BEFORE UPDATE ON public.distribution_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_sdr_capacities_updated_at BEFORE UPDATE ON public.sdr_capacities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER update_default_availability_updated_at BEFORE UPDATE ON public.default_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notification triggers
DO $$ BEGIN CREATE TRIGGER on_appointment_created AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_created(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER on_appointment_status_change AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_status_change(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER on_lead_assignment AFTER INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.notify_lead_assignment(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_qualify_lead_after_insert AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.trigger_qualify_lead(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sdr_metrics_funnel ON public.sdr_metrics(funnel);
CREATE INDEX IF NOT EXISTS idx_sdr_metrics_sdr_date ON public.sdr_metrics(sdr_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sdr_metrics_date ON public.sdr_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_closer_period ON public.metrics(closer_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_period ON public.metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_closers_squad ON public.closers(squad_id);
CREATE INDEX IF NOT EXISTS idx_goals_entity_month ON public.goals(entity_type, entity_id, month);
CREATE INDEX IF NOT EXISTS idx_user_entity_links_user ON public.user_entity_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entity_links_entity ON public.user_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_user ON public.user_entity_links(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_module_perms_user ON public.module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting ON public.meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_meeting ON public.meeting_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_data_user_id ON public.funnel_daily_data(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_data_funnel_id ON public.funnel_daily_data(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_data_date ON public.funnel_daily_data(date);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_data_sdr_id ON public.funnel_daily_data(sdr_id);
CREATE INDEX IF NOT EXISTS idx_user_funnels_user_id ON public.user_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_funnels_funnel_id ON public.user_funnels(funnel_id);
CREATE INDEX IF NOT EXISTS idx_leads_funnel ON public.leads(funnel_id);
CREATE INDEX IF NOT EXISTS idx_leads_sdr ON public.leads(assigned_sdr_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON public.leads(classification);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_crm_column ON public.leads(crm_column_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sdr ON public.appointments(sdr_id);
CREATE INDEX IF NOT EXISTS idx_appointments_closer ON public.appointments(closer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);

-- ============================================================================
-- 8. RLS POLICIES (using lider/sdr/closer - the unified role names)
-- ============================================================================
-- NOTE: has_role() function above handles mapping manager<->lider and user<->closer
-- so policies using 'manager' will still work. New policies use the new names.

-- profiles
DO $$ BEGIN CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Liders can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_roles
DO $$ BEGIN CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- module_permissions
DO $$ BEGIN CREATE POLICY "Users can view their own permissions" ON public.module_permissions FOR SELECT TO authenticated USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can view all permissions" ON public.module_permissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage permissions" ON public.module_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- squads
DO $$ BEGIN CREATE POLICY "Authenticated users can view squads" ON public.squads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage squads" ON public.squads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- closers
DO $$ BEGIN CREATE POLICY "Authenticated users can view closers" ON public.closers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins and managers can manage closers" ON public.closers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can view linked closers" ON public.closers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'user') AND public.is_linked_to_entity(auth.uid(), 'closer', id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- metrics
DO $$ BEGIN CREATE POLICY "Authenticated users can view metrics" ON public.metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage all metrics" ON public.metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage module metrics" ON public.metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider') AND public.manager_can_access_closer(auth.uid(), closer_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert metrics" ON public.metrics FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own metrics" ON public.metrics FOR UPDATE TO authenticated USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete their own metrics" ON public.metrics FOR DELETE TO authenticated USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- google_sheets_config
DO $$ BEGIN CREATE POLICY "Admins can manage sheets config" ON public.google_sheets_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can view sheets config" ON public.google_sheets_config FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Authenticated users can view sync status" ON public.google_sheets_config FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sdrs
DO $$ BEGIN CREATE POLICY "Authenticated users can view sdrs" ON public.sdrs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins and managers can manage sdrs" ON public.sdrs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sdr_metrics
DO $$ BEGIN CREATE POLICY "Authenticated users can view sdr_metrics" ON public.sdr_metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage all sdr_metrics" ON public.sdr_metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage module sdr_metrics" ON public.sdr_metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider') AND public.manager_can_access_sdr(auth.uid(), sdr_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert sdr_metrics" ON public.sdr_metrics FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sdr_sheets_config
DO $$ BEGIN CREATE POLICY "Admins can manage sdr_sheets_config" ON public.sdr_sheets_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- squad_sheets_config
DO $$ BEGIN CREATE POLICY "Admins and managers can manage squad sheets config" ON public.squad_sheets_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Authenticated users can view squad sheets config" ON public.squad_sheets_config FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_entity_links
DO $$ BEGIN CREATE POLICY "Admins can manage entity links" ON public.user_entity_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can view their own links" ON public.user_entity_links FOR SELECT TO authenticated USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- goals
DO $$ BEGIN CREATE POLICY "Admins can manage all goals" ON public.goals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage module goals" ON public.goals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- meetings
DO $$ BEGIN CREATE POLICY "Admins can manage meetings" ON public.meetings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage meetings" ON public.meetings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage meeting_participants" ON public.meeting_participants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage meeting_participants" ON public.meeting_participants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage meeting_notes" ON public.meeting_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage meeting_notes" ON public.meeting_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage meeting_action_items" ON public.meeting_action_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage meeting_action_items" ON public.meeting_action_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sdr_funnels
DO $$ BEGIN CREATE POLICY "Admins can manage sdr_funnels" ON public.sdr_funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage sdr_funnels" ON public.sdr_funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Authenticated users can view sdr_funnels" ON public.sdr_funnels FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- funnels
DO $$ BEGIN CREATE POLICY "Authenticated users can view funnels" ON public.funnels FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage funnels" ON public.funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage funnels" ON public.funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_funnels
DO $$ BEGIN CREATE POLICY "Authenticated users can view user_funnels" ON public.user_funnels FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage user_funnels" ON public.user_funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage user_funnels" ON public.user_funnels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- funnel_daily_data
DO $$ BEGIN CREATE POLICY "Authenticated users can view funnel_daily_data" ON public.funnel_daily_data FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins can manage funnel_daily_data" ON public.funnel_daily_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Managers can manage funnel_daily_data" ON public.funnel_daily_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CRM columns
DO $$ BEGIN CREATE POLICY "crm_columns_select" ON public.crm_columns FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "crm_columns_manage" ON public.crm_columns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- niches
DO $$ BEGIN CREATE POLICY "niches_select" ON public.niches FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "niches_manage" ON public.niches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- leads
DO $$ BEGIN CREATE POLICY "leads_admin_lider_all" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "leads_sdr_select" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'sdr') AND assigned_sdr_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "leads_sdr_update" ON public.leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'sdr') AND assigned_sdr_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- appointments
DO $$ BEGIN CREATE POLICY "appointments_admin_lider_all" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "appointments_sdr_select" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'sdr')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "appointments_sdr_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'sdr') AND sdr_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "appointments_closer_select" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'closer') AND closer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "appointments_closer_update" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'closer') AND closer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- closer_availability
DO $$ BEGIN CREATE POLICY "closer_avail_admin_lider" ON public.closer_availability FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "closer_avail_closer_own" ON public.closer_availability FOR ALL TO authenticated USING (closer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "closer_avail_sdr_select" ON public.closer_availability FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'sdr')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- default_availability
DO $$ BEGIN CREATE POLICY "default_avail_select" ON public.default_availability FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "default_avail_manage" ON public.default_availability FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lead_activities
DO $$ BEGIN CREATE POLICY "lead_activities_admin_lider" ON public.lead_activities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "lead_activities_sdr_own" ON public.lead_activities FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'sdr') AND user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "lead_activities_sdr_insert" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'sdr')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- qualification_rules
DO $$ BEGIN CREATE POLICY "qual_rules_select" ON public.qualification_rules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "qual_rules_manage" ON public.qualification_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- distribution_rules
DO $$ BEGIN CREATE POLICY "dist_rules_select" ON public.distribution_rules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dist_rules_manage" ON public.distribution_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lead_distribution_logs
DO $$ BEGIN CREATE POLICY "dist_logs_select" ON public.lead_distribution_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dist_logs_insert" ON public.lead_distribution_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sdr_capacities
DO $$ BEGIN CREATE POLICY "sdr_cap_select" ON public.sdr_capacities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sdr_cap_manage" ON public.sdr_capacities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- notifications
DO $$ BEGIN CREATE POLICY "notifications_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- activity_logs
DO $$ BEGIN CREATE POLICY "activity_logs_admin_lider" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- cleanup_logs
DO $$ BEGIN CREATE POLICY "cleanup_logs_admin_lider" ON public.cleanup_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 9. REALTIME
-- ============================================================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.metrics; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_metrics; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 10. SEED DATA (squads & closers, idempotent)
-- ============================================================================

INSERT INTO public.squads (name, slug) VALUES
  ('Eagles', 'eagles'),
  ('Alcateia', 'alcateia'),
  ('Sharks', 'sharks')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.closers (name, squad_id) VALUES
  ('Deyvid', (SELECT id FROM public.squads WHERE slug = 'eagles')),
  ('Hannah', (SELECT id FROM public.squads WHERE slug = 'eagles')),
  ('Carlos', (SELECT id FROM public.squads WHERE slug = 'eagles'))
ON CONFLICT DO NOTHING;

INSERT INTO public.closers (name, squad_id) VALUES
  ('Isis', (SELECT id FROM public.squads WHERE slug = 'alcateia')),
  ('Tainara', (SELECT id FROM public.squads WHERE slug = 'alcateia')),
  ('Gisele', (SELECT id FROM public.squads WHERE slug = 'alcateia'))
ON CONFLICT DO NOTHING;

INSERT INTO public.closers (name, squad_id) VALUES
  ('Leandro', (SELECT id FROM public.squads WHERE slug = 'sharks'))
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. ROLE MIGRATION NOTE
-- ============================================================================
-- The has_role() function above handles mapping manager<->lider and user<->closer
-- automatically, so existing 'manager' and 'user' roles will work without data migration.
-- If you want to rename roles in the data, run these SEPARATELY (in a new SQL query)
-- AFTER this migration has been committed:
--
--   UPDATE public.user_roles SET role = 'lider' WHERE role = 'manager';
--   UPDATE public.user_roles SET role = 'closer' WHERE role = 'user';
--

-- ============================================================================
-- DONE! All tables, functions, triggers, policies and indexes are created.
-- ============================================================================
