import { useState, useEffect } from 'react';
import { Plus, User, Mail, Phone, Building, Edit2, Trash2 } from 'lucide-react';
import './Clients.css';

export default function Clients({ apiBase }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/clients`);
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить клиента?')) return;
    try {
      await fetch(`${apiBase}/clients/${id}`, { method: 'DELETE' });
      loadClients();
    } catch (error) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Клиенты</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Добавить клиента
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <h3>Нет клиентов</h3>
          <p>Добавьте первого клиента</p>
        </div>
      ) : (
        <div className="clients-list">
          {clients.map((client) => (
            <div key={client.id} className="client-row">
              <div className="client-row-main">
                <div className="client-avatar">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="client-row-info">
                  <div className="client-row-name">{client.name}</div>
                  {client.company && (
                    <div className="client-row-company">{client.company}</div>
                  )}
                </div>
              </div>
              <div className="client-row-contact">
                {client.phone && (
                  <div className="client-row-line">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="client-row-line">
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                )}
              </div>
              <div className="client-row-status">
                <span className={`client-status status-${client.status}`}>
                  {getStatusLabel(client.status)}
                </span>
              </div>
              <div className="client-row-actions">
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditingClient(client);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(client.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          onSave={() => {
            loadClients();
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function ClientModal({ client, onClose, onSave, apiBase }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        status: client.status || 'active',
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = client ? `${apiBase}/clients/${client.id}` : `${apiBase}/clients`;
      const method = client ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          <h2>{client ? 'Редактировать клиента' : 'Добавить клиента'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Компания</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Статус</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Активный</option>
              <option value="inactive">Неактивный</option>
              <option value="lead">Лид</option>
            </select>
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

function getStatusLabel(status) {
  const labels = {
    active: 'Активный',
    inactive: 'Неактивный',
    lead: 'Лид',
  };
  return labels[status] || status;
}