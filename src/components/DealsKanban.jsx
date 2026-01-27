import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Image as ImageIcon, DollarSign, Calendar, User, Pencil, Trash2, GripVertical } from 'lucide-react';
import './DealsKanban.css';

const STAGES = [
  { id: 'new', label: 'Новая', color: '#94a3b8' },
  { id: 'qualification', label: 'Квалификация', color: '#3b82f6' },
  { id: 'proposal', label: 'Предложение', color: '#8b5cf6' },
  { id: 'negotiation', label: 'Переговоры', color: '#f59e0b' },
  { id: 'closed_won', label: 'Закрыта', color: '#10b981' },
  { id: 'closed_lost', label: 'Проиграна', color: '#ef4444' },
];

function DealCard({ deal, onEdit, onDelete, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stage = STAGES.find(s => s.id === deal.stage) || STAGES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="deal-card"
      onClick={() => onOpen && onOpen(deal)}
    >
      {deal.image_url && (
        <div className="deal-card-image">
          <img src={deal.image_url} alt={deal.title} />
        </div>
      )}
      <div className="deal-card-content">
        <h3 className="deal-card-title">{deal.title}</h3>
        {deal.clients && (
          <div className="deal-card-client">
            <User size={14} />
            <span>{deal.clients.name}</span>
          </div>
        )}
        <div className="deal-card-details">
          {deal.amount > 0 && (
            <div className="deal-card-detail">
              <DollarSign size={14} />
              <span>{formatCurrency(deal.amount)}</span>
            </div>
          )}
          {deal.probability > 0 && (
            <div className="deal-card-probability">
              {deal.probability}%
            </div>
          )}
        </div>
        {deal.close_date && (
          <div className="deal-card-date">
            <Calendar size={12} />
            <span>{formatDate(deal.close_date)}</span>
          </div>
        )}
      </div>
      <div className="deal-card-actions">
        <button
          className="btn-icon drag-handle"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(deal); }} className="btn-icon">
          <Pencil size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }} className="btn-icon">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, deals, onEdit, onDelete, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <div
            className="kanban-column-dot"
            style={{ backgroundColor: stage.color }}
          />
          <h2>{stage.label}</h2>
          <span className="kanban-column-count">{deals.length}</span>
        </div>
      </div>
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className={`kanban-column-content ${isOver ? 'is-over' : ''}`}>
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function DealsKanban({ apiBase, onOpenDeal }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [clients, setClients] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadDeals();
    loadClients();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/deals`);
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch(`${apiBase}/clients`);
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeDeal = deals.find(d => d.id === active.id);
    if (!activeDeal) return;

    const overColumn = over.id.toString();
    const isStage = STAGES.some(s => s.id === overColumn);

    if (isStage) {
      // Перемещение в другую колонку: оптимистично меняем стадию без рефреша
      const newStage = overColumn;
      setDeals(prev =>
        prev.map(d =>
          d.id === active.id ? { ...d, stage: newStage } : d
        ),
      );
      updateDealStage(active.id, newStage);
    } else {
      // Перемещение внутри колонки
      const oldIndex = deals.findIndex(d => d.id === active.id);
      const newIndex = deals.findIndex(d => d.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newDeals = arrayMove(deals, oldIndex, newIndex);
        setDeals(newDeals);
      }
    }
  };

  const updateDealStage = async (dealId, newStage) => {
    try {
      await fetch(`${apiBase}/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (error) {
      console.error('Ошибка обновления стадии:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить сделку?')) return;
    try {
      await fetch(`${apiBase}/deals/${id}`, { method: 'DELETE' });
      loadDeals();
    } catch (error) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  const getDealsByStage = (stageId) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="deals-kanban">
      <div className="page-header">
        <h2>Сделки</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Добавить сделку
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={getDealsByStage(stage.id)}
              onEdit={(deal) => {
                setEditingDeal(deal);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onOpen={onOpenDeal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} /> : null}
        </DragOverlay>
      </DndContext>

      {isModalOpen && (
        <DealModal
          deal={editingDeal}
          clients={clients}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDeal(null);
          }}
          onSave={() => {
            loadDeals();
            setIsModalOpen(false);
            setEditingDeal(null);
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function DealModal({ deal, clients, onClose, onSave, apiBase }) {
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    amount: '',
    stage: 'new',
    probability: '',
    close_date: '',
    image: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        client_id: deal.client_id || '',
        amount: deal.amount || '',
        stage: deal.stage || 'new',
        probability: deal.probability || '',
        close_date: deal.close_date || '',
        image: null,
      });
    }
  }, [deal]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = deal?.image_url || null;
    if (formData.image) {
      imageUrl = await uploadImage(formData.image);
    }

    const data = {
      title: formData.title,
      client_id: formData.client_id || null,
      amount: parseFloat(formData.amount) || 0,
      stage: formData.stage,
      probability: parseInt(formData.probability) || 0,
      close_date: formData.close_date || null,
      image_url: imageUrl,
    };

    try {
      const url = deal ? `${apiBase}/deals/${deal.id}` : `${apiBase}/deals`;
      const method = deal ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
          <h2>{deal ? 'Редактировать сделку' : 'Добавить сделку'}</h2>
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

          <div className="form-row">
            <div className="form-group">
              <label>Сумма</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Вероятность (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Стадия</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              >
                {STAGES.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Дата закрытия</label>
              <input
                type="date"
                value={formData.close_date}
                onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <ImageIcon size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Изображение
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formData.image && (
              <div className="image-preview">
                <img src={URL.createObjectURL(formData.image)} alt="Preview" />
              </div>
            )}
            {deal?.image_url && !formData.image && (
              <div className="image-preview">
                <img src={deal.image_url} alt="Current" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Загрузка...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU');
}