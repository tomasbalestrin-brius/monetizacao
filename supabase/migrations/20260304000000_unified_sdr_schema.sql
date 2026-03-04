-- ============================================================================
-- UNIFIED SCHEMA MIGRATION: SDR + Monetização
-- ============================================================================
-- This migration adds the SDR CRM tables to the existing Monetização database,
-- updates the role system, and creates the Agenda feature infrastructure.
-- ============================================================================

-- 1. EXTEND ROLE ENUM
-- Add new roles: 'lider', 'sdr', 'closer' to existing app_role enum
-- Existing values: 'admin', 'manager', 'viewer', 'user'
-- New unified values: 'admin', 'lider', 'sdr', 'closer' (keep old for backward compat)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'closer';

-- 2. NEW ENUMS FOR SDR CRM
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

-- 3. EXTEND PROFILES TABLE
-- Add fields needed by the SDR system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL;

-- 4. CRM COLUMNS (Kanban board)
CREATE TABLE IF NOT EXISTS public.crm_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  editable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default Kanban columns
INSERT INTO public.crm_columns (name, position, color, editable) VALUES
  ('Contato Inicial', 1, '#2563eb', false),
  ('Aguardando Resposta', 2, '#eab308', true),
  ('Processo de Ligação', 3, '#f97316', true),
  ('Agendado', 4, '#16a34a', false),
  ('Call Realizada', 5, '#7c3aed', false)
ON CONFLICT DO NOTHING;

ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_columns_select" ON public.crm_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_columns_manage" ON public.crm_columns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 5. NICHES (lookup table)
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

ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "niches_select" ON public.niches FOR SELECT TO authenticated USING (true);
CREATE POLICY "niches_manage" ON public.niches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 6. EXTEND FUNNELS TABLE (add SDR-specific columns)
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS sheet_name TEXT;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS column_mapping JSONB DEFAULT '{}';
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS sync_interval_minutes INTEGER DEFAULT 30;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS import_from_date DATE DEFAULT '2026-01-01';
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 7. LEADS TABLE
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

CREATE INDEX IF NOT EXISTS idx_leads_funnel ON public.leads(funnel_id);
CREATE INDEX IF NOT EXISTS idx_leads_sdr ON public.leads(assigned_sdr_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON public.leads(classification);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_crm_column ON public.leads(crm_column_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_admin_lider_all" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "leads_sdr_select" ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'sdr') AND assigned_sdr_id = auth.uid());
CREATE POLICY "leads_sdr_update" ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'sdr') AND assigned_sdr_id = auth.uid());

-- 8. APPOINTMENTS TABLE
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

CREATE INDEX IF NOT EXISTS idx_appointments_lead ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sdr ON public.appointments(sdr_id);
CREATE INDEX IF NOT EXISTS idx_appointments_closer ON public.appointments(closer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_admin_lider_all" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "appointments_sdr_select" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'sdr'));
CREATE POLICY "appointments_sdr_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'sdr') AND sdr_id = auth.uid());
CREATE POLICY "appointments_closer_select" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'closer') AND closer_id = auth.uid());
CREATE POLICY "appointments_closer_update" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'closer') AND closer_id = auth.uid());

-- 9. CLOSER AVAILABILITY
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

ALTER TABLE public.closer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closer_avail_admin_lider" ON public.closer_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "closer_avail_closer_own" ON public.closer_availability FOR ALL TO authenticated
  USING (closer_id = auth.uid());
CREATE POLICY "closer_avail_sdr_select" ON public.closer_availability FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'sdr'));

-- 10. DEFAULT AVAILABILITY CONFIG (admin-configured fixed schedules)
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

-- Default schedule: Mon-Fri 9:00-18:00 with 12:00-13:00 break
INSERT INTO public.default_availability (day_of_week, start_time, end_time, break_start, break_end) VALUES
  (1, '09:00', '18:00', '12:00', '13:00'),
  (2, '09:00', '18:00', '12:00', '13:00'),
  (3, '09:00', '18:00', '12:00', '13:00'),
  (4, '09:00', '18:00', '12:00', '13:00'),
  (5, '09:00', '18:00', '12:00', '13:00')
ON CONFLICT DO NOTHING;

ALTER TABLE public.default_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "default_avail_select" ON public.default_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "default_avail_manage" ON public.default_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. LEAD ACTIVITIES (CRM interaction log)
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

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities_admin_lider" ON public.lead_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "lead_activities_sdr_own" ON public.lead_activities FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'sdr') AND user_id = auth.uid());
CREATE POLICY "lead_activities_sdr_insert" ON public.lead_activities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'sdr'));

-- 12. QUALIFICATION RULES
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

ALTER TABLE public.qualification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qual_rules_select" ON public.qualification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "qual_rules_manage" ON public.qualification_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 13. DISTRIBUTION RULES
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

ALTER TABLE public.distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dist_rules_select" ON public.distribution_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "dist_rules_manage" ON public.distribution_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 14. LEAD DISTRIBUTION LOGS
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

ALTER TABLE public.lead_distribution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dist_logs_select" ON public.lead_distribution_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "dist_logs_insert" ON public.lead_distribution_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 15. SDR CAPACITIES
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

ALTER TABLE public.sdr_capacities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sdr_cap_select" ON public.sdr_capacities FOR SELECT TO authenticated USING (true);
CREATE POLICY "sdr_cap_manage" ON public.sdr_capacities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- 16. NOTIFICATIONS (with Realtime)
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 17. ACTIVITY LOGS (audit trail)
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

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_admin_lider" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 18. CLEANUP LOGS
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

ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cleanup_logs_admin_lider" ON public.cleanup_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update updated_at trigger (reuse existing function if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
DO $$ BEGIN
  CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_distribution_rules_updated_at BEFORE UPDATE ON public.distribution_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_sdr_capacities_updated_at BEFORE UPDATE ON public.sdr_capacities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_default_availability_updated_at BEFORE UPDATE ON public.default_availability
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification trigger: when appointment is created, notify the closer
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

DO $$ BEGIN
  CREATE TRIGGER on_appointment_created
    AFTER INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_created();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification trigger: when appointment status changes, notify the SDR
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

  -- Notify the SDR who scheduled it
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

  -- If call result was registered (realizado or nao_compareceu), update lead status
  IF NEW.status IN ('realizado', 'nao_compareceu') THEN
    UPDATE public.leads SET status = 'concluido' WHERE id = NEW.lead_id;
  END IF;

  -- If cancelled, update lead status back to em_atendimento for reagendamento
  IF NEW.status = 'cancelado' THEN
    UPDATE public.leads SET status = 'em_atendimento' WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_appointment_status_change
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_status_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification trigger: when lead is assigned to SDR
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

DO $$ BEGIN
  CREATE TRIGGER on_lead_assignment
    AFTER INSERT OR UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.notify_lead_assignment();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

  -- Default: bronze if no rule matches
  UPDATE public.leads SET classification = 'bronze' WHERE id = p_lead_id AND classification IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-qualify leads on insert
CREATE OR REPLACE FUNCTION public.trigger_qualify_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.apply_qualification_rules(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_qualify_lead_after_insert
    AFTER INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.trigger_qualify_lead();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper function: check if user is admin or lider
CREATE OR REPLACE FUNCTION public.is_admin_or_lider(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'lider', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- MIGRATE EXISTING ROLES (manager -> lider, user -> closer)
-- Run this AFTER adding enum values
-- ============================================================================
UPDATE public.user_roles SET role = 'lider' WHERE role = 'manager';
UPDATE public.user_roles SET role = 'closer' WHERE role = 'user';
