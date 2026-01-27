import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.status(200).json(data || []);
    } catch (error) {
      console.error('Ошибка при получении клиентов (api/clients):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'POST') {
    try {
      const { name, email, phone, company, status } = req.body || {};

      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name,
            email: email || null,
            phone: phone || null,
            company: company || null,
            status: status || 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при создании клиента (api/clients):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

