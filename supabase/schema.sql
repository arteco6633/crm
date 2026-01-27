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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();