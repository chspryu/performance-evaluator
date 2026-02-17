const BASE = '/api/v1';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || res.statusText);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  saveApiKey(apiKey, provider = 'gemini') {
    return request('/settings/api-key', { method: 'POST', body: { apiKey: apiKey?.trim(), provider: (provider || 'gemini').toLowerCase() } });
  },
  hasApiKey() {
    return request('/settings/api-key');
  },
  uploadScore(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('/upload/score', { method: 'POST', body: fd });
  },
  validateYoutube(url) {
    return request('/validate/youtube', { method: 'POST', body: { url } });
  },
  uploadPerformance(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('/upload/performance', { method: 'POST', body: fd });
  },
  evaluate(payload) {
    return request('/evaluate', { method: 'POST', body: payload });
  },
  getHistory(limit, offset) {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', limit);
    if (offset != null) params.set('offset', offset);
    return request(`/history?${params}`);
  },
  getHistoryItem(id) {
    return request(`/history/${id}`);
  },
  deleteHistoryItem(id) {
    return request(`/history/${id}`, { method: 'DELETE' });
  },
};
