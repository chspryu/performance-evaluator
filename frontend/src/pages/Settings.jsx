import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const PROVIDERS = [
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'openai', label: 'ChatGPT (OpenAI)' },
];

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const [savedProvider, setSavedProvider] = useState('gemini');

  const [useVertex, setUseVertex] = useState(false);
  const [vertexProjectId, setVertexProjectId] = useState(null);

  useEffect(() => {
    api.hasApiKey()
      .then((r) => {
        setHasKey(r.hasApiKey);
        setProvider(r.provider || 'gemini');
        setSavedProvider(r.provider || 'gemini');
        setUseVertex(r.useVertex || false);
        setVertexProjectId(r.vertexProjectId || null);
      })
      .catch(() => setHasKey(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'API 키를 입력해 주세요.' });
      return;
    }
    setLoading(true);
    try {
      await api.saveApiKey(apiKey.trim(), provider);
      setMessage({ type: 'success', text: provider === 'openai' ? 'ChatGPT(OpenAI) API 키가 저장되었습니다.' : 'API 키가 저장되었습니다.' });
      setApiKey('');
      setHasKey(true);
      setSavedProvider(provider);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || '저장에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <Link to="/" style={{ marginBottom: '16px', display: 'inline-block' }}>← 뒤로</Link>
        <h1 style={{ marginBottom: '8px' }}>설정</h1>
        {useVertex ? (
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            <strong>Vertex AI를 사용 중입니다.</strong>
            <br />프로젝트: {vertexProjectId}
            <br />별도 API 키 입력이 필요 없습니다. 바로 평가를 시작할 수 있습니다.
          </div>
        ) : (
          <p className="form-hint" style={{ marginBottom: '24px' }}>
            사용할 AI를 선택하고 API 키를 입력하면, 본인 계정 할당량으로 평가가 진행됩니다. 키는 서버 세션에만 저장됩니다.
          </p>
        )}
        {message && (
          <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-error'}>
            {message.text}
          </div>
        )}
        {!useVertex && (
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>AI 제공자</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{ display: 'block', padding: '8px 12px', minWidth: '200px' }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="apiKey">API 키 *</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'openai' ? 'sk-... (OpenAI API 키)' : 'API 키 붙여넣기'}
              autoComplete="off"
            />
            <p className="form-hint">
              {provider === 'openai' ? (
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  OpenAI API 키 발급받기
                </a>
              ) : (
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio에서 API 키 발급받기
                </a>
              )}
            </p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '저장 중…' : '저장'}
          </button>
        </form>
        )}
        {hasKey && !useVertex && savedProvider === provider && (
          <p className="form-success" style={{ marginTop: '16px' }}>
            ✓ {provider === 'openai' ? 'ChatGPT(OpenAI)' : 'Gemini'} API 키가 등록되어 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
