import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    // список сделок
    try {
      const { data, error } = await supabase
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
      const { title, client_id, amount, stage, probability, close_date } =
        req.body || {};

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

