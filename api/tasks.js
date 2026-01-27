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
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          *,
          clients:client_id (
            id,
            name
          ),
          deals:deal_id (
            id,
            title
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.status(200).json(data || []);
    } catch (error) {
      console.error('Ошибка при получении задач (api/tasks):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'POST') {
    try {
      const { title, description, client_id, deal_id, status, due_date, priority } =
        await getBody(req);

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description: description || null,
            client_id: client_id || null,
            deal_id: deal_id || null,
            status: status || 'pending',
            due_date: due_date || null,
            priority: priority || 'medium',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при создании задачи (api/tasks):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

