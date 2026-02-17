import { Router } from 'express';

export const settingsRouter = Router();

settingsRouter.post('/api-key', (req, res, next) => {
  try {
    const { provider, apiKey } = req.body || {};
    const p = (provider || 'gemini').toLowerCase();
    if (p !== 'gemini' && p !== 'openai') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_PROVIDER', message: 'provider는 gemini 또는 openai여야 합니다.' },
      });
    }
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_API_KEY', message: 'API 키를 입력해 주세요.' },
      });
    }
    const trimmed = apiKey.trim();
    if (p === 'gemini' && !trimmed.startsWith('AIza')) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_API_KEY', message: 'Gemini API 키 형식이 올바르지 않습니다. (AIza로 시작)' },
      });
    }
    if (p === 'openai' && !trimmed.startsWith('sk-')) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_API_KEY', message: 'OpenAI API 키 형식이 올바르지 않습니다. (sk-로 시작)' },
      });
    }
    req.session.aiProvider = p;
    if (p === 'gemini') req.session.geminiApiKey = trimmed;
    else req.session.openaiApiKey = trimmed;
    res.json({ ok: true, message: p === 'openai' ? 'ChatGPT(OpenAI) API 키가 저장되었습니다.' : 'API 키가 저장되었습니다.' });
  } catch (e) {
    next(e);
  }
});

settingsRouter.get('/api-key', (req, res) => {
  const useVertex = process.env.USE_VERTEX_AI === 'true' || !!process.env.VERTEX_PROJECT_ID;
  const hasGeminiKey = !!req.session?.geminiApiKey || !!process.env.GEMINI_API_KEY;
  const hasOpenaiKey = !!req.session?.openaiApiKey || !!process.env.OPENAI_API_KEY;
  const provider = req.session?.aiProvider || process.env.AI_PROVIDER || 'gemini';
  const canEvaluate =
    (provider === 'openai' && hasOpenaiKey) ||
    (provider === 'gemini' && (useVertex || hasGeminiKey));
  res.json({
    ok: true,
    hasApiKey: canEvaluate,
    provider,
    useVertex: provider === 'gemini' ? useVertex : false,
    vertexProjectId: useVertex ? (process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0623486916') : null,
  });
});
