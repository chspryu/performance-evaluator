import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import StepIndicator from '../components/StepIndicator';
import FileDropZone from '../components/FileDropZone';
import { api } from '../api/client';

export default function Step3() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scoreId, fileName, referenceYoutubeUrl } = location.state || {};
  const [mode, setMode] = useState('upload'); // 'upload' | 'youtube'
  const [perfUrl, setPerfUrl] = useState('');
  const [perfValid, setPerfValid] = useState(null);
  const [perfFile, setPerfFile] = useState(null);
  const [performanceId, setPerformanceId] = useState(null);
  const [performanceFileName, setPerformanceFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scoreId || !referenceYoutubeUrl) navigate('/step/1', { replace: true });
  }, [scoreId, referenceYoutubeUrl, navigate]);

  const handlePerfFile = async (file) => {
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadPerformance(file);
      setPerformanceId(res.data.performanceId);
      setPerformanceFileName(res.data.fileName);
      setPerfFile(file);
    } catch (err) {
      setError(err.message || '업로드에 실패했습니다.');
      setPerformanceId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleValidatePerfUrl = async () => {
    if (!perfUrl.trim()) return;
    setError(null);
    setPerfValid(null);
    setValidating(true);
    try {
      const res = await api.validateYoutube(perfUrl.trim());
      setPerfValid(res.data.valid);
      if (!res.data.valid) setError(res.data.reason || '영상을 불러올 수 없습니다.');
    } catch (err) {
      setPerfValid(false);
      setError(err.message || 'URL 형식이 올바르지 않습니다.');
    } finally {
      setValidating(false);
    }
  };

  const handleEvaluate = async () => {
    setError(null);
    const performance =
      mode === 'upload'
        ? { type: 'upload', performanceId, fileName: performanceFileName }
        : { type: 'youtube', youtubeUrl: perfUrl.trim() };

    if (mode === 'upload' && !performanceId) {
      setError('동영상 파일을 업로드해 주세요.');
      return;
    }
    if (mode === 'youtube' && (!perfUrl.trim() || !perfValid)) {
      setError('유효한 YouTube URL을 입력하고 확인해 주세요.');
      return;
    }

    navigate('/evaluating', {
      replace: true,
      state: {
        scoreId,
        referenceYoutubeUrl,
        performance,
      },
    });
  };

  const canSubmit =
    mode === 'upload' ? !!performanceId : !!(perfUrl.trim() && perfValid);

  if (!scoreId || !referenceYoutubeUrl) return null;

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <StepIndicator current={3} />
        <h1 style={{ marginBottom: '8px' }}>3. 본인 연주</h1>
        <p className="form-hint" style={{ marginBottom: '20px' }}>
          연주 영상을 YouTube 링크 또는 파일로 올려 주세요.
        </p>

        <div className="tabs">
          <button type="button" className={mode === 'youtube' ? 'active' : ''} onClick={() => setMode('youtube')}>
            YouTube 링크
          </button>
          <button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}>
            동영상 파일 업로드
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {mode === 'youtube' && (
          <div className="form-group">
            <label htmlFor="perfUrl">YouTube URL *</label>
            <input
              id="perfUrl"
              type="url"
              value={perfUrl}
              onChange={(e) => { setPerfUrl(e.target.value); setPerfValid(null); setError(null); }}
              onBlur={handleValidatePerfUrl}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {validating && <p className="form-hint">확인 중…</p>}
            {perfValid === true && <p className="form-success">✓ 재생 가능한 공개 영상입니다.</p>}
          </div>
        )}

        {mode === 'upload' && (
          <>
            {!performanceId ? (
              <FileDropZone
                onFile={handlePerfFile}
                accept=".mp4,.mov,.webm"
                hint="동영상을 끌어다 놓거나 선택 (MP4 등, 최대 500MB)"
                disabled={uploading}
              />
            ) : (
              <div className="card">
                <div className="card-header">
                  <span>🎬 {performanceFileName}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', minHeight: 'auto' }}
                    onClick={() => { setPerformanceId(null); setPerformanceFileName(''); setPerfFile(null); }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="actions">
          <Link to="/step/2" state={location.state} className="btn btn-secondary">이전</Link>
          <button type="button" className="btn btn-primary" onClick={handleEvaluate} disabled={!canSubmit}>
            평가하기
          </button>
        </div>
      </div>
    </div>
  );
}
