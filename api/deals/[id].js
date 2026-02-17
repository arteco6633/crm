import { supabase } from '../../config/supabase.js';

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
  const {
    query: { id },
    method,
  } = req;

  if (method === 'GET') {
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
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      console.error('Ошибка при получении сделки (api/deals/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'PUT') {
    try {
      const { title, client_id, amount, stage, probability, close_date, country } =
        await getBody(req);

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (client_id !== undefined) updateData.client_id = client_id;
      if (amount !== undefined) updateData.amount = amount;
      if (stage !== undefined) updateData.stage = stage;
      if (probability !== undefined) updateData.probability = probability;
      if (close_date !== undefined) updateData.close_date = close_date;
      if (country !== undefined) updateData.country = country || null;

      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при обновлении сделки (api/deals/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'DELETE') {
    try {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении сделки (api/deals/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

