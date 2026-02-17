import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Получить все сделки (опционально: ?country=Россия)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('deals')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone,
          company
        ),
        instagram_accounts:instagram_account_id (
          id,
          username,
          user_link,
          full_name,
          is_private,
          is_verified
        )
      `)
      .order('created_at', { ascending: false });

    const { country } = req.query;
    if (country && typeof country === 'string') {
      query = query.eq('country', country.trim());
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Ошибка при получении сделок:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить сделку по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone,
          company
        ),
        instagram_accounts:instagram_account_id (
          id,
          username,
          user_link,
          full_name,
          is_private,
          is_verified
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении сделки:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать новую сделку
router.post('/', async (req, res) => {
  try {
    const { title, client_id, amount, stage, probability, close_date, country, instagram_account_id } = req.body;

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
          instagram_account_id: instagram_account_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при создании сделки:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить сделку
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, client_id, amount, stage, probability, close_date, image_url, country, instagram_account_id } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (amount !== undefined) updateData.amount = amount;
    if (stage !== undefined) updateData.stage = stage;
    if (probability !== undefined) updateData.probability = probability;
    if (close_date !== undefined) updateData.close_date = close_date;
    if (country !== undefined) updateData.country = country || null;
    if (instagram_account_id !== undefined) updateData.instagram_account_id = instagram_account_id || null;
    // image_url колонка может отсутствовать, чтобы не падать — обновляем только если она есть в БД
    // if (image_url !== undefined) updateData.image_url = image_url;

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при обновлении сделки:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить сделку
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении сделки:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as dealsRouter };