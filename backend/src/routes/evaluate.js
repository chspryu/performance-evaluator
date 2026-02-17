import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { evaluateWithGemini } from '../services/gemini.js';
import { evaluateWithOpenAI } from '../services/openai.js';
import { addEvaluation } from '../services/historyStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const scoreDir = path.join(uploadDir, 'scores');
const perfDir = path.join(uploadDir, 'performances');

export const evaluateRouter = Router();

function cleanupFiles(scoreId, performanceId) {
  if (scoreId) {
    const p = path.join(scoreDir, scoreId);
    if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
  }
  if (performanceId) {
    const p = path.join(perfDir, performanceId);
    if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
  }
}

evaluateRouter.post('/', async (req, res, next) => {
  let scoreId = null;
  let performanceId = null;
  try {
    const provider = req.session?.aiProvider || process.env.AI_PROVIDER || 'gemini';
    const useVertex = provider === 'gemini' && (process.env.USE_VERTEX_AI === 'true' || !!process.env.VERTEX_PROJECT_ID);
    const geminiKey = req.session?.geminiApiKey || process.env.GEMINI_API_KEY;
    const openaiKey = req.session?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (provider === 'openai') {
      if (!openaiKey) {
        return res.status(400).json({
          ok: false,
          error: { code: 'MISSING_API_KEY', message: '설정에서 ChatGPT(OpenAI) API 키를 입력해 주세요.' },
        });
      }
    } else if (!useVertex && !geminiKey) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_API_KEY', message: '설정에서 Gemini API 키를 입력해 주세요. (또는 .env에 VERTEX_PROJECT_ID 설정)' },
      });
    }

    const { scoreId: sid, referenceYoutubeUrl, performance } = req.body || {};
    if (!sid || !referenceYoutubeUrl || !performance?.type) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: '악보, 참조 연주 URL, 본인 연주 정보가 필요합니다.' },
      });
    }

    scoreId = sid;
    const performanceType = performance.type;
    if (performanceType === 'upload') {
      performanceId = performance.performanceId;
      if (!performanceId) {
        return res.status(400).json({
          ok: false,
          error: { code: 'INVALID_INPUT', message: '본인 연주 파일(performanceId)이 필요합니다.' },
        });
      }
    } else if (performanceType === 'youtube') {
      if (!performance.youtubeUrl) {
        return res.status(400).json({
          ok: false,
          error: { code: 'INVALID_INPUT', message: '본인 연주 YouTube URL이 필요합니다.' },
        });
      }
    } else {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'performance.type은 upload 또는 youtube여야 합니다.' },
      });
    }

    const evalOptions = {
      scoreId,
      referenceYoutubeUrl,
      performanceType,
      performanceId: performanceType === 'upload' ? performanceId : undefined,
      performanceYoutubeUrl: performanceType === 'youtube' ? performance.youtubeUrl : undefined,
    };
    const result =
      provider === 'openai'
        ? await evaluateWithOpenAI(openaiKey, evalOptions)
        : await evaluateWithGemini(geminiKey, evalOptions);

    const performanceSummary =
      performanceType === 'youtube' ? performance.youtubeUrl : (performance.fileName || performanceId || '');

    const evaluationId = addEvaluation(req.session.sid, {
      result,
      referenceYoutubeUrl,
      performanceType,
      performanceSummary,
    });

    cleanupFiles(scoreId, performanceId);

    res.json({
      ok: true,
      data: {
        jobId: `job_${evaluationId}`,
        evaluationId,
        status: 'completed',
        result,
      },
    });
  } catch (err) {
    cleanupFiles(scoreId, performanceId);
    const msg = err.message || '';
    if (msg.includes('Unable to authenticate') || msg.includes('GoogleAuthError') || err.name === 'GoogleAuthError') {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'GEMINI_ERROR',
          message: 'Vertex AI 인증에 실패했습니다. 설정에서 Gemini API 키를 입력해 사용하거나, Vertex 사용 시 터미널에서 gcloud auth application-default login 을 실행해 주세요.',
        },
      });
    }
    if (msg.includes('API key') || msg.includes('429') || msg.includes('quota')) {
      return res.status(503).json({
        ok: false,
        error: { code: 'GEMINI_ERROR', message: '평가 처리 중 오류가 발생했습니다. API 키와 할당량을 확인해 주세요.' },
      });
    }
    next(err);
  }
});

evaluateRouter.get('/:jobId', (req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: 'JOB_NOT_FOUND', message: '비동기 작업 조회는 현재 지원하지 않습니다. 동기 평가를 사용해 주세요.' },
  });
});
