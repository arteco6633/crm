import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Bell } from 'lucide-react';
import '../App.css';

export default function Dashboard({ activeTab, setActiveTab, apiBase }) {
  const [metrics, setMetrics] = useState({
    dealsCount: null,
    tasksCount: null,
    funnelPercent: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [dealsRes, tasksRes] = await Promise.all([
          fetch(`${apiBase}/deals`),
          fetch(`${apiBase}/tasks`),
        ]);
        const dealsData = await dealsRes.json();
        const tasksData = await tasksRes.json();

        const deals = Array.isArray(dealsData) ? dealsData : [];
        const tasks = Array.isArray(tasksData) ? tasksData : [];

        const dealsCount = deals.length;
        const tasksCount = tasks.length;

        const wonDeals = deals.filter(
          (d) =>
            d.stage === 'closed_won' ||
            d.stage === 'won' ||
            d.status === 'won'
        ).length;
        const funnelPercent =
          dealsCount > 0 ? Math.round((wonDeals / dealsCount) * 100) : 0;

        setMetrics({ dealsCount, tasksCount, funnelPercent });
      } catch (e) {
        console.error('Ошибка загрузки метрик дэшборда', e);
      }
    };

    load();
  }, [apiBase]);

  return (
    <div className="dashboard-page">
      <div className="header-top">
        <div>
          <div className="greeting-pill">
            <Sparkles size={14} />
            <span>Сегодня</span>
          </div>
          <h1 className="logo">Hello, LVL80</h1>
          <p className="logo-subtitle">Фокус на самых важных сделках и клиентах.</p>
        </div>
        <div className="header-actions">
          <div className="search-shell">
            <Search size={16} />
            <input placeholder="Поиск по CRM" />
          </div>
          <button className="icon-chip">
            <Bell size={18} />
          </button>
          <div className="avatar-chip">
            <span>AV</span>
          </div>
        </div>
      </div>

      <div className="header-metrics">
        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <span className="metric-label">Активные сделки</span>
          <span className="metric-value">
            {metrics.dealsCount !== null ? metrics.dealsCount : '—'}
          </span>
          <span className="metric-sub">Всего сделок в CRM</span>
        </motion.div>
        <motion.div
          className="metric-card accent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <span className="metric-label">Продано</span>
          <span className="metric-value">
            {metrics.funnelPercent !== null ? `${metrics.funnelPercent}%` : '—'}
          </span>
          <div className="metric-progress">
            <div
              className="metric-progress-fill"
              style={{
                width:
                  metrics.funnelPercent !== null
                    ? `${Math.max(0, Math.min(100, metrics.funnelPercent))}%`
                    : '0%',
              }}
            />
          </div>
        </motion.div>
        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <span className="metric-label">Задачи</span>
          <span className="metric-value">
            {metrics.tasksCount !== null ? metrics.tasksCount : '—'}
          </span>
          <span className="metric-sub">Всего задач в CRM</span>
        </motion.div>
      </div>

    </div>
  );
}

