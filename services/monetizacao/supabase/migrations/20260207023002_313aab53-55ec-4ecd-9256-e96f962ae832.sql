
-- Adicionar nova role 'user' ao enum (precisa ser commitado antes de usar)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
