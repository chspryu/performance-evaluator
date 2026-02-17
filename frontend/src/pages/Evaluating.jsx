import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

export default function Evaluating() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scoreId, referenceYoutubeUrl, performance } = location.state || {};
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scoreId || !referenceYoutubeUrl || !performance) {
      navigate('/step/1', { replace: true });
      return;
    }

    const run = async () => {
      try {
        const payload = {
          scoreId,
          referenceYoutubeUrl,
          performance:
            performance.type === 'upload'
              ? { type: 'upload', performanceId: performance.performanceId }
              : { type: 'youtube', youtubeUrl: performance.youtubeUrl },
        };
        const res = await api.evaluate(payload);
        navigate('/result', { replace: true, state: { result: res.data.result, evaluationId: res.data.evaluationId } });
      } catch (err) {
        setError(err.message || '평가 중 오류가 발생했습니다.');
      }
    };

    run();
  }, [scoreId, referenceYoutubeUrl, performance, navigate]);

  if (error) {
    const needApiKey = /API 키|인증에 실패/.test(error);
    return (
      <div className="container">
        <div className="loading-wrap" style={{ flexDirection: 'column', gap: '16px' }}>
          <div className="alert alert-error">{error}</div>
          {needApiKey && (
            <button type="button" className="btn btn-primary" onClick={() => navigate('/settings')}>
              설정에서 API 키 입력하기
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => navigate('/step/3', { state: location.state })}>
            다시 시도
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/step/1')}>
            처음으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="loading-wrap">
        <div className="spinner" />
        <p>연주를 분석하고 있어요.</p>
        <p className="form-hint">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
