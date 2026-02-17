import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import StepIndicator from '../components/StepIndicator';
import { api } from '../api/client';

export default function Step2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scoreId, fileName } = location.state || {};
  const [url, setUrl] = useState('');
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scoreId) navigate('/step/1', { replace: true });
  }, [scoreId, navigate]);

  const handleValidate = async () => {
    if (!url.trim()) return;
    setError(null);
    setValid(null);
    setValidating(true);
    try {
      const res = await api.validateYoutube(url.trim());
      setValid(res.data.valid);
      if (!res.data.valid) setError(res.data.reason || '영상을 불러올 수 없습니다.');
    } catch (err) {
      setValid(false);
      setError(err.message || 'URL 형식이 올바르지 않습니다.');
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    if (valid && url.trim()) {
      navigate('/step/3', { state: { ...location.state, referenceYoutubeUrl: url.trim() } });
    }
  };

  if (!scoreId) return null;

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <StepIndicator current={2} />
        <h1 style={{ marginBottom: '8px' }}>2. 참조 연주 (프로)</h1>
        <p className="form-hint" style={{ marginBottom: '24px' }}>
          본받고 싶은 프로 연주의 YouTube 링크를 입력하세요.
        </p>
        <div className="form-group">
          <label htmlFor="refUrl">YouTube URL *</label>
          <input
            id="refUrl"
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setValid(null); setError(null); }}
            onBlur={handleValidate}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {validating && <p className="form-hint">확인 중…</p>}
          {valid === true && <p className="form-success">✓ 재생 가능한 공개 영상입니다.</p>}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="actions">
          <Link to="/step/1" state={location.state} className="btn btn-secondary">이전</Link>
          <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!valid || !url.trim()}>
            다음: 본인 연주
          </button>
        </div>
      </div>
    </div>
  );
}
