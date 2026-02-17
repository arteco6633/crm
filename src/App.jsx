import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, KanbanSquare, CheckSquare2, Instagram, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import Clients from './components/Clients';
import DealsKanban from './components/DealsKanban';
import DealDetails from './components/DealDetails';
import Tasks from './components/Tasks';
import InstagramAccounts from './components/InstagramAccounts';
import Dashboard from './components/Dashboard';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uaenlkqvnaavithpelvs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Y9T_Rp0-YaFUadM5EX0_0g_1t6Rb-lg';

export const supabase = createClient(supabaseUrl, supabaseKey);

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [activeTasksCount, setActiveTasksCount] = useState(0);
  const isDealDetails = activeTab === 'deals' && selectedDealId;

  const fetchActiveTasksCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      const tasks = Array.isArray(data) ? data : [];
      setActiveTasksCount(tasks.filter(t => t.status !== 'completed').length);
    } catch {
      setActiveTasksCount(0);
    }
  }, []);

  useEffect(() => {
    fetchActiveTasksCount();
  }, [fetchActiveTasksCount]);

  return (
    <div className="app">
      <div className="app-shell">
        {/* Левый сайдбар */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="sidebar-logo-mark">C</span>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-icon-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              aria-label="Дэшборд"
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedDealId(null);
              }}
            >
              <LayoutDashboard size={20} />
            </button>
            <button
              className={`sidebar-icon-button ${activeTab === 'clients' ? 'active' : ''}`}
              aria-label="Клиенты"
              onClick={() => {
                setActiveTab('clients');
                setSelectedDealId(null);
              }}
            >
              <Users size={20} />
            </button>
            <button
              className={`sidebar-icon-button ${activeTab === 'deals' ? 'active' : ''}`}
              aria-label="Сделки"
              onClick={() => {
                setActiveTab('deals');
                setSelectedDealId(null);
              }}
            >
              <KanbanSquare size={20} />
            </button>
            <button
              className={`sidebar-icon-button ${activeTab === 'instagram' ? 'active' : ''}`}
              aria-label="Instagram"
              onClick={() => {
                setActiveTab('instagram');
                setSelectedDealId(null);
              }}
            >
              <Instagram size={20} />
            </button>
            <button
              className={`sidebar-icon-button ${activeTab === 'tasks' ? 'active' : ''}`}
              aria-label={activeTasksCount > 0 ? `Задачи (${activeTasksCount} активных)` : 'Задачи'}
              onClick={() => {
                setActiveTab('tasks');
                setSelectedDealId(null);
              }}
            >
              <CheckSquare2 size={20} />
              {activeTasksCount > 0 && (
                <span className="sidebar-badge sidebar-badge--tasks">{activeTasksCount}</span>
              )}
            </button>
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-icon-button" aria-label="Настройки">
              <Settings size={20} />
            </button>
          </div>
        </aside>

        {/* Основной контент */}
        <div className={isDealDetails ? 'shell-main details' : 'shell-main'}>
          <motion.main
            className={isDealDetails ? 'app-main deal-full' : 'app-main'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'dashboard' && !isDealDetails && (
              <Dashboard
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                apiBase={API_BASE}
              />
            )}
            {activeTab === 'clients' && <Clients apiBase={API_BASE} />}
            {activeTab === 'deals' && !selectedDealId && (
              <DealsKanban
                apiBase={API_BASE}
                onOpenDeal={(deal) => setSelectedDealId(deal.id)}
              />
            )}
            {activeTab === 'deals' && selectedDealId && (
              <DealDetails
                apiBase={API_BASE}
                dealId={selectedDealId}
                onBack={() => setSelectedDealId(null)}
              />
            )}
            {activeTab === 'instagram' && (
              <InstagramAccounts apiBase={API_BASE} />
            )}
            {activeTab === 'tasks' && (
              <Tasks apiBase={API_BASE} onTasksChange={fetchActiveTasksCount} />
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

export default App;