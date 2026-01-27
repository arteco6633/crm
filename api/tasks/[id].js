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
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      console.error('Ошибка при получении задачи (api/tasks/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'PUT') {
    try {
      const { title, description, client_id, deal_id, status, due_date, priority } =
        await getBody(req);

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (client_id !== undefined) updateData.client_id = client_id;
      if (deal_id !== undefined) updateData.deal_id = deal_id;
      if (status !== undefined) updateData.status = status;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (priority !== undefined) updateData.priority = priority;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при обновлении задачи (api/tasks/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'DELETE') {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении задачи (api/tasks/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

