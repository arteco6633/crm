-- Миграция: добавление поля country в deals для сегментации по странам
-- Выполните в Supabase SQL Editor, если таблицы уже созданы

ALTER TABLE deals ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_country ON deals(country);
