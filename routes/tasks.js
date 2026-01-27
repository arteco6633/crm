import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Получить все задачи
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        clients:client_id (
          id,
          name
        ),
        deals:deal_id (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить задачу по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        clients:client_id (
          id,
          name
        ),
        deals:deal_id (
          id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать новую задачу
router.post('/', async (req, res) => {
  try {
    const { title, description, client_id, deal_id, status, due_date, priority } = req.body;

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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, client_id, deal_id, status, due_date, priority } = req.body;

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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as tasksRouter };