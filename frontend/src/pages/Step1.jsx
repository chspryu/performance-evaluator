import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StepIndicator from '../components/StepIndicator';
import FileDropZone from '../components/FileDropZone';
import { api } from '../api/client';

export default function Step1() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [scoreId, setScoreId] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFile = async (f) => {
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadScore(f);
      setScoreId(res.data.scoreId);
      setFileName(res.data.fileName);
      setFile(f);
    } catch (err) {
      setError(err.message || '업로드에 실패했습니다.');
      setFile(null);
      setScoreId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (scoreId) navigate('/step/2', { state: { scoreId, fileName } });
  };

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <StepIndicator current={1} />
        <h1 style={{ marginBottom: '8px' }}>1. 악보 업로드</h1>
        <p className="form-hint" style={{ marginBottom: '24px' }}>
          악보를 업로드해 주세요. (PDF, PNG, JPG 등, 최대 20MB)
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {!scoreId ? (
          <FileDropZone
            onFile={handleFile}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            hint="파일을 여기에 끌어다 놓거나 클릭하여 선택"
            disabled={uploading}
          />
        ) : (
          <div className="card">
            <div className="card-header">
              <span>📄 {fileName}</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 12px', minHeight: 'auto' }}
                onClick={() => { setScoreId(null); setFileName(''); setFile(null); }}
              >
                삭제
              </button>
            </div>
          </div>
        )}
        <p className="form-hint" style={{ marginTop: '12px' }}>
          악보 품질이 좋을수록 평가 정확도가 올라갑니다. PDF는 첫 페이지만 사용될 수 있습니다.
        </p>
        <div className="actions">
          <Link to="/" className="btn btn-secondary">취소</Link>
          <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!scoreId}>
            다음: 참조 연주 URL
          </button>
        </div>
      </div>
    </div>
  );
}
