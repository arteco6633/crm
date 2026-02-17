import { useState, useEffect, useRef } from 'react';
import { Instagram, FileSpreadsheet, ExternalLink, Trash2 } from 'lucide-react';
import './InstagramAccounts.css';

const API_UNREACHABLE_MSG = 'Сервер API недоступен. Запустите бэкенд в отдельном терминале: npm run server (или npm run dev:local для фронта и бэкенда вместе).';

export default function InstagramAccounts({ apiBase }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await fetch(`${apiBase}/instagram`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setApiError(API_UNREACHABLE_MSG);
        setAccounts([]);
        return;
      }
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки Instagram:', error);
      setApiError(API_UNREACHABLE_MSG);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setApiError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/import/instagram`, {
        method: 'POST',
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setImportResult({ error: API_UNREACHABLE_MSG });
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Ошибка импорта');
      setImportResult(data);
      loadAccounts();
    } catch (error) {
      setImportResult({ error: error.message });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот аккаунт из базы?')) return;
    try {
      await fetch(`${apiBase}/instagram/${id}`, { method: 'DELETE' });
      loadAccounts();
    } catch (error) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="instagram-page">
      <div className="page-header">
        <h2>Instagram аккаунты</h2>
        <div className="page-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <FileSpreadsheet size={18} />
            {importing ? 'Загрузка...' : 'Загрузить из файла'}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="import-result import-result--error">
          {apiError}
        </div>
      )}

      {importResult && (
        <div className={`import-result ${importResult.error ? 'import-result--error' : 'import-result--ok'}`}>
          {importResult.error ? (
            importResult.error
          ) : (
            <>
              Импортировано: <strong>{importResult.imported}</strong>
              {importResult.total != null && ` из ${importResult.total}`}
            </>
          )}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <Instagram size={48} />
          <h3>Нет загруженных аккаунтов</h3>
          <p>Загрузите Excel или CSV с колонками: username, user_link, full_name, is_private, is_verified</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <FileSpreadsheet size={18} />
            Загрузить файл
          </button>
        </div>
      ) : (
        <div className="instagram-table-wrap">
          <table className="instagram-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Имя / описание</th>
                <th>Приватный</th>
                <th>Верифицирован</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <a
                      href={acc.user_link || `https://instagram.com/${acc.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ig-username"
                    >
                      @{acc.username}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td className="ig-full-name">{acc.full_name || '—'}</td>
                  <td>{acc.is_private ? 'Да' : 'Нет'}</td>
                  <td>{acc.is_verified ? 'Да' : 'Нет'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={() => handleDelete(acc.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
