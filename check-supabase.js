#!/usr/bin/env node
/**
 * Быстрая проверка: подключение к Supabase и наличие таблиц.
 * Запуск: node check-supabase.js
 */
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '(используется fallback из config)';
const key = process.env.SUPABASE_ANON_KEY ? '(задан)' : '(не задан, используется fallback)';
console.log('SUPABASE_URL:', url);
console.log('SUPABASE_ANON_KEY:', key);
console.log('');

const { supabase } = await import('./config/supabase.js');

const tables = ['clients', 'deals', 'tasks'];
for (const table of tables) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(table + ':', 'ОШИБКА —', error.message);
    if (error.code === 'PGRST116') console.log('  → Таблица не найдена. Выполните supabase/schema.sql в Supabase SQL Editor.');
    if (error.message.includes('JWT') || error.message.includes('invalid') || error.message.includes('key')) console.log('  → Проверьте SUPABASE_ANON_KEY в .env (должен быть anon public из Dashboard).');
  } else {
    console.log(table + ':', 'OK, записей:', count ?? 0);
  }
}
