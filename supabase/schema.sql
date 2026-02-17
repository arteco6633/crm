-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сделок
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'new',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  close_date DATE,
  image_url TEXT,
  country VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_country ON deals(country);

-- Таблица Instagram аккаунтов
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255),
  user_link TEXT,
  full_name VARCHAR(500),
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE deals ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_instagram_account_id ON deals(instagram_account_id);

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at (DROP IF EXISTS чтобы скрипт можно было запускать повторно)
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: доступ для anon (API с anon-ключом) к таблицам
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Политики (DROP IF EXISTS чтобы скрипт можно было запускать повторно)
DROP POLICY IF EXISTS "clients_anon_all" ON clients;
CREATE POLICY "clients_anon_all" ON clients FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "deals_anon_all" ON deals;
CREATE POLICY "deals_anon_all" ON deals FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_anon_all" ON tasks;
CREATE POLICY "tasks_anon_all" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "instagram_accounts_anon_all" ON instagram_accounts;
CREATE POLICY "instagram_accounts_anon_all" ON instagram_accounts FOR ALL TO anon USING (true) WITH CHECK (true);