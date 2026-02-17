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

-- Связь сделок с Instagram
ALTER TABLE deals ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_instagram_account_id ON deals(instagram_account_id);

-- RLS
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "instagram_accounts_anon_all" ON instagram_accounts;
CREATE POLICY "instagram_accounts_anon_all" ON instagram_accounts
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
