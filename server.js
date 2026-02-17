import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clientsRouter } from './routes/clients.js';
import { dealsRouter } from './routes/deals.js';
import { tasksRouter } from './routes/tasks.js';
import { uploadRouter } from './routes/upload.js';
import { importRouter } from './routes/import.js';
import { instagramRouter } from './routes/instagram.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/clients', clientsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/import', importRouter);
app.use('/api/instagram', instagramRouter);

// Проверка здоровья API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM API работает' });
});

app.listen(PORT, () => {
  console.log(`🚀 CRM сервер запущен на http://localhost:${PORT}`);
});