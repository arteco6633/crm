import { supabase } from '../config/supabase.js';

async function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    // список сделок (?country=Россия)
    try {
      const country = req.query?.country;
      let query = supabase
        .from('deals')
        .select(
          `
          *,
          clients:client_id (
            id,
            name,
            email,
            phone,
            company
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (country && typeof country === 'string') {
        query = query.eq('country', country.trim());
      }

      const { data, error } = await query;

      if (error) throw error;
      res.status(200).json(data || []);
    } catch (error) {
      console.error('Ошибка при получении сделок (api/deals):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'POST') {
    // создать сделку
    try {
      const { title, client_id, amount, stage, probability, close_date, country } =
        await getBody(req);

      const { data, error } = await supabase
        .from('deals')
        .insert([
          {
            title,
            client_id: client_id || null,
            amount: amount || 0,
            stage: stage || 'new',
            probability: probability || 0,
            close_date: close_date || null,
            country: country || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при создании сделки (api/deals):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

