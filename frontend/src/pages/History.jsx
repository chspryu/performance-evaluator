import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function History() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .getHistory()
      .then((r) => {
        setItems(r.data.items || []);
        setTotal(r.data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('이 평가를 삭제할까요?')) return;
    try {
      await api.deleteHistoryItem(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>평가 이력</h1>
          <Link to="/step/1" className="btn btn-primary">새 비교 추가</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <p>불러오는 중…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>저장된 평가가 없습니다.</p>
            <Link to="/step/1" className="btn btn-primary">새 비교 추가</Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Link to={`/history/${item.id}`} style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                <div className="row">
                  <span className="date">{formatDate(item.createdAt)}</span>
                  <span className="score">{item.totalScore}점</span>
                </div>
                <div className="meta">
                  참조: {item.referenceYoutubeUrl ? String(item.referenceYoutubeUrl).slice(0, 50) + '…' : '-'} / 본인: {String(item.performanceSummary || item.performanceType).slice(0, 40)}
                </div>
              </Link>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '6px 12px', minHeight: 'auto' }}
                onClick={(e) => handleDelete(e, item.id)}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
