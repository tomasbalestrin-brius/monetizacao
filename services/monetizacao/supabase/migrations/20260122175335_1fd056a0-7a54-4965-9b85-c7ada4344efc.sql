-- Remover registros antigos que não têm funil identificado
-- Esses dados são redundantes pois foram re-importados com o nome do funil
DELETE FROM sdr_metrics WHERE funnel IS NULL;