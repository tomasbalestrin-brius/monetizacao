-- Tabela para vincular usuários a Closers ou SDRs
CREATE TABLE public.user_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('closer', 'sdr')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Índices para performance
CREATE INDEX idx_user_entity_links_user ON public.user_entity_links(user_id);
CREATE INDEX idx_user_entity_links_entity ON public.user_entity_links(entity_type, entity_id);

-- Habilitar RLS
ALTER TABLE public.user_entity_links ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem gerenciar todos os vínculos
CREATE POLICY "Admins can manage entity links"
  ON public.user_entity_links FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Política: Usuários podem ver seus próprios vínculos
CREATE POLICY "Users can view their own links"
  ON public.user_entity_links FOR SELECT
  USING (user_id = auth.uid());