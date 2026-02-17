import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const scoreDir = path.join(uploadDir, 'scores');
const perfDir = path.join(uploadDir, 'performances');

// 이미지에 있는 프로젝트 정보 (사용자 입력 없이 바로 사용)
const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0623486916';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm'];
const PDF_MIME = 'application/pdf';

function fileToPart(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  const b64 = data.toString('base64');
  if (IMAGE_MIMES.includes(mimeType) || VIDEO_MIMES.includes(mimeType) || mimeType === PDF_MIME) {
    return {
      inlineData: {
        data: b64,
        mimeType,
      },
    };
  }
  return null;
}

function vertexPart(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  const b64 = data.toString('base64');
  if (IMAGE_MIMES.includes(mimeType) || VIDEO_MIMES.includes(mimeType) || mimeType === PDF_MIME) {
    return {
      inlineData: {
        data: b64,
        mimeType,
      },
    };
  }
  return null;
}

const SYSTEM_PROMPT = `당신은 전문 연주 평가자입니다. 악보와 참조(프로) 연주, 그리고 사용자의 연주를 비교하여 평가합니다.
다음 JSON 형식으로만 답변하세요. 다른 설명은 붙이지 마세요.
{
  "totalScore": 0에서 100 사이 정수,
  "maxScore": 100,
  "summary": {
    "technical": "기술적 평가 요약 (음정, 리듬, 박자, 음색 등)",
    "expression": "표현적 평가 요약 (프레이징, 다이내믹스, 루바토, 해석 등)"
  },
  "sections": [
    {
      "label": "마디 1-4 같은 구간 이름",
      "difference": "참조 연주와의 차이점",
      "suggestion": "구체적인 개선 제안"
    }
  ]
}
sections는 악보/연주 구간별로 3개 이상 10개 이하로 나누어 주세요. 한국어로 작성하세요.`;

function parseResult(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : text;
  try {
    return JSON.parse(raw);
  } catch {
    return {
      totalScore: 70,
      maxScore: 100,
      summary: { technical: text.slice(0, 200), expression: '' },
      sections: [{ label: '전체', difference: '-', suggestion: '응답을 JSON으로 파싱할 수 없어 요약만 표시합니다.' }],
    };
  }
}

async function evaluateWithVertexAI(options) {
  const { VertexAI } = await import('@google-cloud/vertexai');
  const vertexAI = new VertexAI({ project: VERTEX_PROJECT_ID, location: VERTEX_LOCATION });
  const model = vertexAI.getGenerativeModel({ model: GEMINI_MODEL });

  const parts = [];

  const scorePath = path.join(scoreDir, options.scoreId);
  if (fs.existsSync(scorePath)) {
    const ext = path.extname(options.scoreId).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    const p = vertexPart(scorePath, mime);
    if (p) parts.push(p);
  }

  if (options.performanceType === 'upload' && options.performanceId) {
    const perfPath = path.join(perfDir, options.performanceId);
    if (fs.existsSync(perfPath)) {
      const ext = path.extname(options.performanceId).toLowerCase();
      const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mov' ? 'video/quicktime' : 'video/webm';
      const p = vertexPart(perfPath, mime);
      if (p) parts.push(p);
    }
  }

  const refText = options.referenceYoutubeUrl
    ? `참조(프로) 연주 영상 링크: ${options.referenceYoutubeUrl}. 사용자가 이 연주를 참고하고자 합니다.`
    : '';
  const perfText =
    options.performanceType === 'youtube' && options.performanceYoutubeUrl
      ? `본인 연주 영상 링크: ${options.performanceYoutubeUrl}. 위 링크의 연주를 평가해 주세요. (링크 재생이 불가한 경우 악보와 일반적인 기준으로 평가해 주세요.)`
      : options.performanceType === 'upload'
        ? '본인 연주는 첨부된 동영상입니다.'
        : '';

  const userText = [
    '다음은 악보(이미지)와, 필요 시 본인 연주 동영상입니다.',
    refText,
    perfText,
    '악보에 맞춰 기술적·표현적 관점에서 100점 만점으로 평가하고, 구간별 차이점과 개선 제안을 JSON으로만 출력하세요.',
  ]
    .filter(Boolean)
    .join('\n');

  parts.push({ text: userText });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
  });
  const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Vertex AI returned empty response');
  const parsed = parseResult(text);

  return {
    totalScore: Math.min(100, Math.max(0, Number(parsed.totalScore) || 0)),
    maxScore: 100,
    summary: {
      technical: String(parsed.summary?.technical ?? '').slice(0, 1000),
      expression: String(parsed.summary?.expression ?? '').slice(0, 1000),
    },
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.slice(0, 20).map((s) => ({
          label: String(s.label ?? '구간').slice(0, 100),
          difference: String(s.difference ?? '').slice(0, 500),
          suggestion: String(s.suggestion ?? '').slice(0, 500),
        }))
      : [],
  };
}

async function evaluateWithGoogleAI(apiKey, options) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const parts = [];

  const scorePath = path.join(scoreDir, options.scoreId);
  if (fs.existsSync(scorePath)) {
    const ext = path.extname(options.scoreId).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    const part = fileToPart(scorePath, mime);
    if (part) parts.push(part);
  }

  if (options.performanceType === 'upload' && options.performanceId) {
    const perfPath = path.join(perfDir, options.performanceId);
    if (fs.existsSync(perfPath)) {
      const ext = path.extname(options.performanceId).toLowerCase();
      const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mov' ? 'video/quicktime' : 'video/webm';
      const part = fileToPart(perfPath, mime);
      if (part) parts.push(part);
    }
  }

  const refText = options.referenceYoutubeUrl
    ? `참조(프로) 연주 영상 링크: ${options.referenceYoutubeUrl}. 사용자가 이 연주를 참고하고자 합니다.`
    : '';
  const perfText =
    options.performanceType === 'youtube' && options.performanceYoutubeUrl
      ? `본인 연주 영상 링크: ${options.performanceYoutubeUrl}. 위 링크의 연주를 평가해 주세요. (링크 재생이 불가한 경우 악보와 일반적인 기준으로 평가해 주세요.)`
      : options.performanceType === 'upload'
        ? '본인 연주는 첨부된 동영상입니다.'
        : '';

  const userText = [
    '다음은 악보(이미지)와, 필요 시 본인 연주 동영상입니다.',
    refText,
    perfText,
    '악보에 맞춰 기술적·표현적 관점에서 100점 만점으로 평가하고, 구간별 차이점과 개선 제안을 JSON으로만 출력하세요.',
  ]
    .filter(Boolean)
    .join('\n');

  parts.push({ text: userText });

  const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
  const text = result.response.text();
  if (!text) throw new Error('Gemini returned empty response');
  const parsed = parseResult(text);

  return {
    totalScore: Math.min(100, Math.max(0, Number(parsed.totalScore) || 0)),
    maxScore: 100,
    summary: {
      technical: String(parsed.summary?.technical ?? '').slice(0, 1000),
      expression: String(parsed.summary?.expression ?? '').slice(0, 1000),
    },
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.slice(0, 20).map((s) => ({
          label: String(s.label ?? '구간').slice(0, 100),
          difference: String(s.difference ?? '').slice(0, 500),
          suggestion: String(s.suggestion ?? '').slice(0, 500),
        }))
      : [],
  };
}

export async function evaluateWithGemini(apiKey, options) {
  const useVertex = process.env.USE_VERTEX_AI === 'true' || !!process.env.VERTEX_PROJECT_ID;
  if (useVertex) {
    return evaluateWithVertexAI(options);
  }
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('API key required when not using Vertex AI');
  return evaluateWithGoogleAI(key, options);
}
