import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Маппинг Excel country / country_code → CRM страны
const COUNTRY_MAP = {
  'russian federation': 'Россия', 'ru': 'Россия', 'russia': 'Россия',
  'kazakhstan': 'Казахстан', 'kz': 'Казахстан',
  'belarus': 'Беларусь', 'by': 'Беларусь', 'belarussian': 'Беларусь',
  'uzbekistan': 'Узбекистан', 'uz': 'Узбекистан',
  'ukraine': 'Украина', 'ua': 'Украина',
  'armenia': 'Армения', 'am': 'Армения',
  'georgia': 'Грузия', 'ge': 'Грузия',
  'azerbaijan': 'Азербайджан', 'az': 'Азербайджан',
  'kyrgyzstan': 'Киргизия', 'kyrgyz': 'Киргизия', 'kg': 'Киргизия',
  'tajikistan': 'Таджикистан', 'tj': 'Таджикистан',
  'turkmenistan': 'Туркменистан', 'tm': 'Туркменистан',
};

function mapCountry(row) {
  const raw = (row.country || row.country_code || '').toString().trim().toLowerCase();
  if (!raw) return null;
  return COUNTRY_MAP[raw] || raw;
}

// Маппинг строки Excel на клиента и страну
function rowToItem(row) {
  const name = row.name || row.name_for_emails || row.query || '';
  const phone = row.phone || '';
  const company = row.name || row.city || row.address || '';
  const email = row.email || row.website || '';
  if (!name || typeof name !== 'string' || !name.trim()) return null;
  return {
    client: {
      name: String(name).trim().slice(0, 255),
      phone: phone ? String(phone).trim().slice(0, 50) : null,
      company: company ? String(company).trim().slice(0, 255) : null,
      email: email ? String(email).trim().slice(0, 255) : null,
      status: 'active',
    },
    country: mapCountry(row) || 'Россия',
  };
}

// POST /api/import/clients — загрузка Excel и импорт клиентов
router.post('/clients', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен. Выберите .xlsx или .xls файл.' });
    }

    const ext = (req.file.originalname || '').toLowerCase().split('.').pop();
    if (!['xlsx', 'xls'].includes(ext)) {
      return res.status(400).json({ error: 'Поддерживаются только файлы .xlsx и .xls' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const items = rows.map(rowToItem).filter(Boolean);

    if (items.length === 0) {
      return res.status(400).json({
        error: 'В файле нет подходящих записей. Ожидаются колонки: name, phone, address, city, website.',
        imported: 0,
      });
    }

    const BATCH = 50;
    let importedClients = 0;
    let importedDeals = 0;
    const errors = [];

    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      const clientsBatch = batch.map(it => it.client);

      const { data: insertedClients, error: clientsErr } = await supabase
        .from('clients')
        .insert(clientsBatch)
        .select('id');

      if (clientsErr) {
        errors.push({ batch: Math.floor(i / BATCH) + 1, message: clientsErr.message });
        continue;
      }

      importedClients += (insertedClients || []).length;

      const dealsBatch = batch.map((it, idx) => ({
        title: it.client.name,
        client_id: insertedClients?.[idx]?.id || null,
        stage: 'new',
        amount: 0,
        probability: 0,
        country: it.country,
      }));

      const { data: insertedDeals, error: dealsErr } = await supabase
        .from('deals')
        .insert(dealsBatch)
        .select('id');

      if (dealsErr) {
        errors.push({ batch: Math.floor(i / BATCH) + 1, deals: dealsErr.message });
      } else {
        importedDeals += (insertedDeals || []).length;
      }
    }

    res.json({
      success: true,
      imported: importedClients,
      importedClients,
      importedDeals,
      total: items.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('Ошибка импорта Excel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Маппинг строки Excel/CSV на Instagram аккаунт
function rowToInstagram(row) {
  const username = row.username || row.Username || '';
  if (!username || typeof username !== 'string' || !String(username).trim()) return null;
  const toBool = (v) => {
    if (v === true || v === 'true' || v === '1' || v === 'да' || v === 'yes') return true;
    const s = String(v).toLowerCase();
    if (s === 'истина' || s === 'true') return true;
    return false;
  };
  return {
    username: String(username).trim().slice(0, 255),
    user_link: (row.user_link || row.link || '').toString().trim().slice(0, 500) || null,
    full_name: (row.full_name || row.name || '').toString().trim().slice(0, 500) || null,
    is_private: toBool(row.is_private),
    is_verified: toBool(row.is_verified),
  };
}

// POST /api/import/instagram — загрузка Excel с Instagram аккаунтами
router.post('/instagram', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен. Выберите .xlsx или .xls.' });
    }
    const ext = (req.file.originalname || '').toLowerCase().split('.').pop();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      return res.status(400).json({ error: 'Поддерживаются только .xlsx, .xls, .csv' });
    }

    let rows = [];
    if (ext === 'csv') {
      const XLSX = (await import('xlsx')).default;
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }

    const accounts = rows.map(rowToInstagram).filter(Boolean);
    if (accounts.length === 0) {
      return res.status(400).json({ error: 'Нет записей. Ожидаются колонки: username, user_link, full_name, is_private, is_verified.' });
    }

    const BATCH = 50;
    let imported = 0;
    for (let i = 0; i < accounts.length; i += BATCH) {
      const batch = accounts.slice(i, i + BATCH);
      const { data, error } = await supabase.from('instagram_accounts').insert(batch).select('id');
      if (error) throw error;
      imported += (data || []).length;
    }

    res.json({ success: true, imported, total: accounts.length });
  } catch (error) {
    console.error('Ошибка импорта Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/create-deals-from-clients — создать сделки для клиентов, у которых их ещё нет
router.post('/create-deals-from-clients', express.json(), async (req, res) => {
  try {
    const country = req.body?.country || 'Россия';

    const { data: clients } = await supabase.from('clients').select('id, name');
    if (!clients?.length) {
      return res.json({ success: true, created: 0, message: 'Нет клиентов' });
    }

    const { data: deals } = await supabase.from('deals').select('client_id');
    const clientsWithDeals = new Set((deals || []).map(d => d.client_id).filter(Boolean));

    const clientsWithoutDeals = clients.filter(c => !clientsWithDeals.has(c.id));
    if (clientsWithoutDeals.length === 0) {
      return res.json({ success: true, created: 0, message: 'У всех клиентов уже есть сделки' });
    }

    const dealsToInsert = clientsWithoutDeals.map(c => ({
      title: c.name,
      client_id: c.id,
      stage: 'new',
      amount: 0,
      probability: 0,
      country,
    }));

    const BATCH = 50;
    let created = 0;
    for (let i = 0; i < dealsToInsert.length; i += BATCH) {
      const batch = dealsToInsert.slice(i, i + BATCH);
      const { data, error } = await supabase.from('deals').insert(batch).select('id');
      if (error) throw error;
      created += (data || []).length;
    }

    res.json({ success: true, created, total: clientsWithoutDeals.length });
  } catch (error) {
    console.error('Ошибка создания сделок:', error);
    res.status(500).json({
      error: error.message,
      hint: 'Убедитесь, что в таблице deals есть колонка country. Выполните supabase/migrations/add_country_to_deals.sql в Supabase SQL Editor.',
    });
  }
});

export { router as importRouter };
