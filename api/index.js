import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clientsRouter } from '../routes/clients.js';
import { dealsRouter } from '../routes/deals.js';
import { tasksRouter } from '../routes/tasks.js';
import { uploadRouter } from '../routes/upload.js';

// Загружаем .env локально; на Vercel переменные уже есть в process.env
dotenv.config();

const app = express();

// Общие middlewares
app.use(cors());
app.use(express.json());

// API-роуты (без префикса /api, т.к. сам файл уже лежит в /api)
app.use('/clients', clientsRouter);
app.use('/deals', dealsRouter);
app.use('/tasks', tasksRouter);
app.use('/upload', uploadRouter);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM API (serverless) работает' });
});

// Экспортируем express-приложение как handler для Vercel
export default app;

