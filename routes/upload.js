import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Загрузка изображения в Supabase Storage
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `deals/${fileName}`;

    // Загружаем файл в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crm-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      // Если bucket не существует, создадим его через публичный URL
      console.error('Ошибка загрузки в Storage:', uploadError);
      return res.status(500).json({ 
        error: 'Ошибка загрузки изображения. Убедитесь, что bucket "crm-images" создан в Supabase Storage.' 
      });
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('crm-images')
      .getPublicUrl(filePath);

    res.json({ 
      success: true, 
      url: publicUrl,
      path: filePath 
    });
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as uploadRouter };