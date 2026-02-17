import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, evaluationId } = location.state || {};

  if (!result) {
    navigate('/step/1', { replace: true });
    return null;
  }

  const { totalScore, maxScore, summary, sections } = result;
  const scoreColor = totalScore >= 90 ? 'var(--success)' : totalScore >= 70 ? 'var(--primary)' : 'var(--danger)';

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>평가 결과</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/history" className="btn btn-secondary">이력 보기</Link>
            <Link to="/step/1" className="btn btn-primary">다시 평가하기</Link>
          </div>
        </div>
        {evaluationId && (
          <p className="form-success" style={{ marginBottom: '16px' }}>✓ 이력에 저장되었습니다.</p>
        )}

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
          <Link to="/history" className="btn btn-secondary">이력 보기</Link>
          <Link to="/step/1" className="btn btn-primary">다시 평가하기</Link>
        </div>
      </div>
    </div>
  );
}
