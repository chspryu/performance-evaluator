import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api
      .getHistoryItem(id)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('이 평가를 삭제할까요?')) return;
    try {
      await api.deleteHistoryItem(id);
      navigate('/history');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-wrap">
          <div className="spinner" />
          <p>불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || '데이터를 불러올 수 없습니다.'}</div>
        <Link to="/history" className="btn btn-secondary">목록으로</Link>
      </div>
    );
  }

  const { result, createdAt } = data;
  const { totalScore, maxScore, summary, sections } = result || {};
  const scoreColor = totalScore >= 90 ? 'var(--success)' : totalScore >= 70 ? 'var(--primary)' : 'var(--danger)';

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/history" className="btn btn-secondary" style={{ marginBottom: '8px' }}>← 목록으로</Link>
            <h1 style={{ margin: 0 }}>평가 결과 ({formatDate(createdAt)})</h1>
          </div>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            삭제
          </button>
        </div>

        <div className="result-score">
          <span className="number" style={{ color: scoreColor }}>{totalScore}</span>
          <span className="max"> / {maxScore}</span>
        </div>

        <div className="section-block">
          <h3>기술</h3>
          <p>{summary?.technical || '-'}</p>
        </div>
        <div className="section-block">
          <h3>표현</h3>
          <p>{summary?.expression || '-'}</p>
        </div>

        <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>마디별 비교 및 개선 제안</h2>
        {(sections || []).map((sec, i) => (
          <div key={i} className="card" style={{ marginBottom: '12px' }}>
            <h3 className="card-title">{sec.label}</h3>
            <p><strong>차이:</strong> {sec.difference}</p>
            <p><strong>개선:</strong> {sec.suggestion}</p>
          </div>
        ))}

        <div className="actions" style={{ marginTop: '32px' }}>
          <Link to="/history" className="btn btn-secondary">목록으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
