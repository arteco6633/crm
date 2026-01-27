-- Политики RLS: доступ для anon (ключ API) к таблицам CRM
-- Выполните этот скрипт в Supabase → SQL Editor, если в таблицах есть данные,
-- но приложение получает пустой ответ или 500 при запросе /api/clients, /api/deals, /api/tasks.

-- Включаем RLS (если ещё не включён) и разрешаем anon всё нужное для API
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Клиенты: чтение и запись для anon (используется бэкендом с anon-ключом)
DROP POLICY IF EXISTS "clients_anon_all" ON clients;
CREATE POLICY "clients_anon_all" ON clients
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Сделки
DROP POLICY IF EXISTS "deals_anon_all" ON deals;
CREATE POLICY "deals_anon_all" ON deals
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Задачи
DROP POLICY IF EXISTS "tasks_anon_all" ON tasks;
CREATE POLICY "tasks_anon_all" ON tasks
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
