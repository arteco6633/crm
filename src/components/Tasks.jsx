import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import './Tasks.css';

export default function Tasks({ apiBase }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/tasks`);
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await fetch(`${apiBase}/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch (error) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h2>Задачи</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>

      <div className="tasks-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Активные
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Завершенные
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={48} />
          <h3>Нет задач</h3>
          <p>Добавьте первую задачу</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div key={task.id} className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}>
              <button
                className="task-checkbox"
                onClick={() => handleToggleStatus(task)}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </button>
              <div className="task-content">
                <h3>{task.title}</h3>
                {task.description && <p>{task.description}</p>}
                <div className="task-meta">
                  {task.clients && (
                    <span className="task-meta-item">👤 {task.clients.name}</span>
                  )}
                  {task.deals && (
                    <span className="task-meta-item">💼 {task.deals.title}</span>
                  )}
                  {task.due_date && (
                    <span className="task-meta-item">
                      <Clock size={14} />
                      {formatDate(task.due_date)}
                    </span>
                  )}
                  <span className={`task-priority priority-${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              </div>
              <div className="task-actions">
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={() => {
            loadTasks();
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function TaskModal({ task, onClose, onSave, apiBase }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    deal_id: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    loadClients();
    loadDeals();
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        client_id: task.client_id || '',
        deal_id: task.deal_id || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
      });
    }
  }, [task]);

  const loadClients = async () => {
    try {
      const response = await fetch(`${apiBase}/clients`);
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await fetch(`${apiBase}/deals`);
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = task ? `${apiBase}/tasks/${task.id}` : `${apiBase}/tasks`;
      const method = task ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          client_id: formData.client_id || null,
          deal_id: formData.deal_id || null,
          due_date: formData.due_date || null,
        }),
      });

      onSave();
    } catch (error) {
      alert('Ошибка сохранения: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Редактировать задачу' : 'Добавить задачу'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Клиент</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Выберите клиента</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Сделка</label>
              <select
                value={formData.deal_id}
                onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
              >
                <option value="">Выберите сделку</option>
                {deals.map(deal => (
                  <option key={deal.id} value={deal.id}>{deal.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Статус</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">В ожидании</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершена</option>
                <option value="cancelled">Отменена</option>
              </select>
            </div>
            <div className="form-group">
              <label>Приоритет</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Срок выполнения</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPriorityLabel(priority) {
  const labels = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };
  return labels[priority] || priority;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU');
}