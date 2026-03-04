-- Adicionar coluna funnel para identificar origem das métricas
ALTER TABLE sdr_metrics ADD COLUMN funnel TEXT;

-- Remover constraint antiga se existir
ALTER TABLE sdr_metrics DROP CONSTRAINT IF EXISTS sdr_metrics_sdr_id_date_key;

-- Criar nova constraint única incluindo funil
ALTER TABLE sdr_metrics ADD CONSTRAINT sdr_metrics_sdr_id_date_funnel_key UNIQUE (sdr_id, date, funnel);

-- Criar índice para consultas por funil
CREATE INDEX IF NOT EXISTS idx_sdr_metrics_funnel ON sdr_metrics (funnel);