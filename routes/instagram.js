import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Ошибка получения Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Ошибка получения Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, user_link, full_name, is_private, is_verified } = req.body;
    const { data, error } = await supabase
      .from('instagram_accounts')
      .insert([{
        username: username || null,
        user_link: user_link || null,
        full_name: full_name || null,
        is_private: !!is_private,
        is_verified: !!is_verified,
      }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка создания Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { username, user_link, full_name, is_private, is_verified } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (user_link !== undefined) updates.user_link = user_link;
    if (full_name !== undefined) updates.full_name = full_name;
    if (is_private !== undefined) updates.is_private = !!is_private;
    if (is_verified !== undefined) updates.is_verified = !!is_verified;
    const { data, error } = await supabase
      .from('instagram_accounts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка обновления Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('instagram_accounts')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления Instagram:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as instagramRouter };
