import { useEffect, useState } from 'react';
import { ArrowLeft, User, Phone, FileText, Calendar, Plus, CheckCircle2, Globe, Instagram, ExternalLink } from 'lucide-react';
import './DealDetails.css';

export default function DealDetails({ apiBase, dealId, onBack }) {
  const [deal, setDeal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDeal, setSavingDeal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [infoForm, setInfoForm] = useState({
    title: '',
    amount: '',
    probability: '',
    close_date: '',
    country: '',
    instagram_account_id: '',
  });
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [rightTab, setRightTab] = useState('tasks'); // 'tasks' | 'comments'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
  });

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const digits = String(value).replace(/[^\d]/g, '');
    if (!digits) return '';
    const num = Number(digits);
    if (!num) return '';
    return num.toLocaleString('ru-RU');
  };

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealRes, tasksRes, igRes] = await Promise.all([
        fetch(`${apiBase}/deals/${dealId}`),
        fetch(`${apiBase}/tasks`),
        fetch(`${apiBase}/instagram`),
      ]);

      const dealData = await dealRes.json();
      const tasksData = await tasksRes.json();
      const igData = await igRes.json();

      setDeal(dealData || null);
      setInstagramAccounts(Array.isArray(igData) ? igData : []);
      if (dealData) {
        setInfoForm({
          title: dealData.title || '',
          amount: dealData.amount != null ? String(dealData.amount) : '',
          probability: dealData.probability || '',
          close_date: dealData.close_date || '',
          country: dealData.country || '',
          instagram_account_id: dealData.instagram_account_id || '',
        });
      }
      if (dealData?.clients) {
        setClientForm({
          name: dealData.clients.name || '',
          phone: dealData.clients.phone || '',
        });
      } else {
        setClientForm({ name: '', phone: '' });
      }
      setTasks(Array.isArray(tasksData) ? tasksData.filter(t => t.deal_id === dealId) : []);

      // Локальные комментарии (пока без БД)
      const raw = window.localStorage.getItem('dealComments') || '{}';
      const map = JSON.parse(raw);
      setComments(map[dealId] || []);
    } catch (error) {
      console.error('Ошибка загрузки сделки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!infoForm.title.trim()) return;

    try {
      setSavingDeal(true);

      // сначала сохраняем изменения по сделке
      const res = await fetch(`${apiBase}/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: infoForm.title,
          amount: infoForm.amount ? Number(String(infoForm.amount).replace(/[^\d]/g, '')) : 0,
          probability: infoForm.probability ? Number(infoForm.probability) : 0,
          close_date: infoForm.close_date || null,
          country: infoForm.country || null,
          instagram_account_id: infoForm.instagram_account_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка сохранения сделки');
      }

      const updatedDeal = data.data || data;
      setDeal(updatedDeal);

      // затем сохраняем или создаём клиента, если введены данные
      const hasClientData = clientForm.name.trim() || clientForm.phone.trim();
      if (hasClientData) {
        let clientId = updatedDeal.client_id;

        // если клиента нет — создаём нового
        if (!clientId) {
          const createClientRes = await fetch(`${apiBase}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientForm.name.trim() || 'Без имени',
              phone: clientForm.phone.trim() || null,
              status: 'active',
            }),
          });
          const createClientData = await createClientRes.json();
          if (!createClientRes.ok) {
            throw new Error(createClientData?.error || 'Ошибка создания клиента');
          }
          clientId = createClientData.data?.id || createClientData.id;

          // привязываем сделку к новому клиенту
          await fetch(`${apiBase}/deals/${dealId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId }),
          });
        } else {
          // если клиент уже есть — обновляем его данные
          await fetch(`${apiBase}/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientForm.name.trim() || 'Без имени',
              phone: clientForm.phone.trim() || null,
            }),
          });
        }
      }

      // обновляем все данные сделки/задач/комментов в интерфейсе
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения сделки:', error);
    } finally {
      setSavingDeal(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setSavingTask(true);
      const payload = {
        title: taskForm.title,
        description: taskForm.description || null,
        deal_id: dealId,
        client_id: deal?.client_id || null,
        status: 'pending',
        priority: 'medium',
        due_date: taskForm.due_date || null,
      };

      const url = editingTaskId
        ? `${apiBase}/tasks/${editingTaskId}`
        : `${apiBase}/tasks`;
      const method = editingTaskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка при сохранении задачи');
      }

      setTaskForm({ title: '', description: '', due_date: '' });
      setEditingTaskId(null);
      setShowTaskForm(false);
      loadData();
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    } finally {
      setSavingTask(false);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: Date.now().toString(),
      body: text,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => {
      const next = [...prev, newComment];
      const raw = window.localStorage.getItem('dealComments') || '{}';
      const map = JSON.parse(raw);
      map[dealId] = next;
      window.localStorage.setItem('dealComments', JSON.stringify(map));
      return next;
    });

    setCommentText('');
  };

  const handleEditTask = (task) => {
    setRightTab('tasks');
    setShowTaskForm(true);
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || '',
    });
  };

  const handleCompleteTask = async (task) => {
    try {
      const res = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка при обновлении задачи');
      }
      loadData();
    } catch (error) {
      console.error('Ошибка завершения задачи:', error);
    }
  };

  if (loading || !deal) {
    return <div className="deal-details loading">Загрузка сделки...</div>;
  }

  const client = deal.clients || null;

  return (
    <div className="deal-details">
      <div className="deal-details-header">
        <div className="deal-header-main">
          <div className="deal-client-chip">
            <User size={14} />
            <span>{infoForm.title || deal.title}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onBack} aria-label="Закрыть карточку сделки">
          <span className="close-icon">×</span>
        </button>
      </div>

      <div className="deal-layout">
        <section className="deal-info">
          <form className="deal-info-block" onSubmit={handleSaveDeal}>
            <h3>Информация о сделке</h3>
            <div className="deal-field">
              <span className="label">Название</span>
              <input
                className="value-input"
                type="text"
                value={infoForm.title}
                placeholder="Название сделки"
                onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
              />
            </div>

            <div className="deal-field">
              <span className="label">Клиент</span>
              <input
                className="value-input"
                type="text"
                value={clientForm.name}
                placeholder="Имя клиента"
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              />
            </div>

            <div className="deal-field">
              <span className="label">Телефон</span>
              <input
                className="value-input"
                type="tel"
                value={clientForm.phone}
                placeholder="Номер телефона"
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              />
            </div>

            <div className="deal-field">
              <span className="label">Сумма</span>
              <input
                className="value-input"
                type="text"
                inputMode="numeric"
                value={formatMoney(infoForm.amount)}
                placeholder="0"
                onChange={(e) =>
                  setInfoForm({
                    ...infoForm,
                    amount: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
              />
            </div>

            <div className="deal-field">
              <span className="label">Вероятность</span>
              <input
                className="value-input"
                type="number"
                min="0"
                max="100"
                value={infoForm.probability}
                placeholder="0"
                onChange={(e) => setInfoForm({ ...infoForm, probability: e.target.value })}
              />
            </div>

            <div className="deal-field">
              <span className="label">Instagram</span>
              <select
                className="value-input"
                value={infoForm.instagram_account_id}
                onChange={(e) => setInfoForm({ ...infoForm, instagram_account_id: e.target.value })}
              >
                <option value="">Не привязан</option>
                {instagramAccounts.map(ig => (
                  <option key={ig.id} value={ig.id}>@{ig.username} {ig.full_name ? `— ${ig.full_name}` : ''}</option>
                ))}
              </select>
            </div>

            {deal?.instagram_accounts && (
              <div className="deal-instagram-block">
                <h4><Instagram size={16} /> Instagram аккаунт</h4>
                <div className="deal-instagram-row">
                  <span className="label">Username:</span>
                  <a href={deal.instagram_accounts.user_link || `https://instagram.com/${deal.instagram_accounts.username}`} target="_blank" rel="noopener noreferrer">
                    @{deal.instagram_accounts.username}
                    <ExternalLink size={12} />
                  </a>
                </div>
                {deal.instagram_accounts.full_name && (
                  <div className="deal-instagram-row">
                    <span className="label">Имя:</span>
                    <span>{deal.instagram_accounts.full_name}</span>
                  </div>
                )}
                <div className="deal-instagram-row">
                  <span className="label">Приватный:</span>
                  <span>{deal.instagram_accounts.is_private ? 'Да' : 'Нет'}</span>
                </div>
                <div className="deal-instagram-row">
                  <span className="label">Верифицирован:</span>
                  <span>{deal.instagram_accounts.is_verified ? 'Да' : 'Нет'}</span>
                </div>
              </div>
            )}

            <div className="deal-field">
              <span className="label">Страна</span>
              <select
                className="value-input"
                value={infoForm.country}
                onChange={(e) => setInfoForm({ ...infoForm, country: e.target.value })}
              >
                <option value="">Не указана</option>
                {['Россия', 'Казахстан', 'Беларусь', 'Узбекистан', 'Украина', 'Армения', 'Грузия', 'Азербайджан', 'Киргизия', 'Таджикистан', 'Туркменистан', 'Другое'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="deal-field">
              <span className="label">Дата закрытия</span>
              <span className="value with-icon">
                <Calendar size={14} />
                <input
                  className="value-input"
                  type="date"
                  value={infoForm.close_date}
                  onChange={(e) => setInfoForm({ ...infoForm, close_date: e.target.value })}
                />
              </span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={savingDeal}>
                {savingDeal ? 'Сохраняю...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>

        </section>

        <section className="deal-tasks">
          <div className="deal-info-block">
            <div className="deal-right-tabs">
              <button
                type="button"
                className={`right-tab ${rightTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setRightTab('tasks')}
              >
                Дела
              </button>
              <button
                type="button"
                className={`right-tab ${rightTab === 'comments' ? 'active' : ''}`}
                onClick={() => setRightTab('comments')}
              >
                Комментарии
              </button>
            </div>

            {rightTab === 'comments' && (
              <>
                <form className="task-form" onSubmit={handleAddComment}>
                  <div className="form-group">
                    <label>Новый комментарий</label>
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Запишите важные детали разговора, договорённости и т.д."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      <Plus size={16} />
                      Добавить комментарий
                    </button>
                  </div>
                </form>

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <div className="empty-tasks">
                      <FileText size={16} />
                      <span>Пока нет комментариев по этой сделке</span>
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-date">
                          {new Date(c.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="comment-body">{c.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {rightTab === 'tasks' && (
              <>
                <div className="deal-tasks-header">
                  <h3>Задачи по сделке</h3>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowTaskForm((v) => !v)}
                  >
                    <Plus size={16} />
                    {showTaskForm ? 'Скрыть форму' : 'Добавить задачу'}
                  </button>
                </div>

                {showTaskForm && (
                  <form className="task-form" onSubmit={handleCreateTask}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Название задачи *</label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          placeholder="Позвонить клиенту, отправить КП..."
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Дата задачи</label>
                        <input
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Комментарий</label>
                      <textarea
                        rows={3}
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        placeholder="Что нужно сделать, детали разговора и т.д."
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={savingTask}>
                        <Plus size={16} />
                        {savingTask ? 'Сохраняю...' : 'Добавить задачу'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="deal-info-block secondary">
                  <h3>Список задач</h3>
                  {tasks.length === 0 ? (
                    <div className="empty-tasks">
                      <CheckCircle2 size={20} />
                      <span>Пока нет задач по этой сделке</span>
                    </div>
                  ) : (
                    <ul className="deal-tasks-list">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className={`deal-task-item ${task.status === 'completed' ? 'completed' : ''}`}
                        >
                          <div>
                            <div className="deal-task-title">{task.title}</div>
                            {task.description && (
                              <div className="deal-task-desc">{task.description}</div>
                            )}
                          </div>
                          <div className="deal-task-meta">
                            <div>
                              {task.due_date && (
                                <span className="meta-pill">
                                  <Calendar size={12} />
                                  {new Date(task.due_date).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                              <span className="meta-pill status">
                                {task.status === 'completed' ? 'Завершена' : 'Активна'}
                              </span>
                            </div>
                            <div className="task-inline-actions">
                              <button
                                type="button"
                                className="task-inline-btn primary"
                                onClick={() => handleCompleteTask(task)}
                              >
                                {task.status === 'completed' ? 'Вернуть в работу' : 'Выполнено'}
                              </button>
                              <button
                                type="button"
                                className="task-inline-btn"
                                onClick={() => handleEditTask(task)}
                              >
                                Редактировать
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

