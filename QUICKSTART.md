# Быстрый старт

## 1. Установка зависимостей
```bash
npm install
```

## 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:
```env
VITE_SUPABASE_URL=https://uaenlkqvnaavithpelvs.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Y9T_Rp0-YaFUadM5EX0_0g_1t6Rb-lg

SUPABASE_URL=https://uaenlkqvnaavithpelvs.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Y9T_Rp0-YaFUadM5EX0_0g_1t6Rb-lg

PORT=3000
```

## 3. Настройка Supabase

### База данных
1. Откройте [Supabase Dashboard](https://uaenlkqvnaavithpelvs.supabase.co)
2. Перейдите в **SQL Editor**
3. Выполните SQL из файла `supabase/schema.sql`

### Storage для изображений
1. В Supabase Dashboard перейдите в **Storage**
2. Создайте новый bucket с именем `crm-images`
3. Сделайте bucket публичным (Public bucket)

## 4. Запуск

Откройте два терминала:

**Терминал 1 - Backend:**
```bash
npm run server:dev
```

**Терминал 2 - Frontend:**
```bash
npm run dev
```

Откройте браузер: http://localhost:5173

## Готово! 🎉

Теперь вы можете:
- Добавлять клиентов
- Создавать сделки и перетаскивать их в Kanban доске
- Загружать изображения для сделок
- Управлять задачами