import { supabase } from '../../config/supabase.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      console.error('Ошибка при получении клиента (api/clients/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'PUT') {
    try {
      const { name, email, phone, company, status } = req.body || {};
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (company !== undefined) updateData.company = company;
      if (status !== undefined) updateData.status = status;

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Ошибка при обновлении клиента (api/clients/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (method === 'DELETE') {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении клиента (api/clients/[id]):', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

