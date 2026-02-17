import { Router } from 'express';
import { listEvaluations, getEvaluation, deleteEvaluation } from '../services/historyStore.js';

export const historyRouter = Router();

historyRouter.get('/', (req, res, next) => {
  try {
    const sessionId = req.session?.sid;
    if (!sessionId) {
      return res.json({ ok: true, data: { items: [], total: 0 } });
    }
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const data = listEvaluations(sessionId, { limit, offset });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
});

historyRouter.get('/:id', (req, res, next) => {
  try {
    const sessionId = req.session?.sid;
    const evaluation = getEvaluation(sessionId, req.params.id);
    if (!evaluation) {
      return res.status(404).json({
        ok: false,
        error: { code: 'EVALUATION_NOT_FOUND', message: '해당 평가 이력을 찾을 수 없습니다.' },
      });
    }
    res.json({
      ok: true,
      data: {
        id: evaluation.id,
        createdAt: evaluation.createdAt,
        result: evaluation.result,
        referenceYoutubeUrl: evaluation.referenceYoutubeUrl,
        performanceType: evaluation.performanceType,
        performanceSummary: evaluation.performanceSummary,
      },
    });
  } catch (e) {
    next(e);
  }
});

historyRouter.delete('/:id', (req, res, next) => {
  try {
    const sessionId = req.session?.sid;
    const deleted = deleteEvaluation(sessionId, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: { code: 'EVALUATION_NOT_FOUND', message: '해당 평가 이력을 찾을 수 없습니다.' },
      });
    }
    res.json({ ok: true, message: '평가 이력이 삭제되었습니다.' });
  } catch (e) {
    next(e);
  }
});
