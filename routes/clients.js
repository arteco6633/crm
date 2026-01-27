import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Получить всех клиентов
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Ошибка при получении клиентов:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить клиента по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении клиента:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать нового клиента
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;

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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при создании клиента:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить клиента
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, status } = req.body;

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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при обновлении клиента:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить клиента
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении клиента:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as clientsRouter };