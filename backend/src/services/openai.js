import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const scoreDir = path.join(uploadDir, 'scores');
const perfDir = path.join(uploadDir, 'performances');

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const IMAGE_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

const SYSTEM_PROMPT = `당신은 전문 연주 평가자입니다. 악보와 참조(프로) 연주, 그리고 사용자의 연주 정보를 바탕으로 평가합니다.
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

export async function evaluateWithOpenAI(apiKey, options) {
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  const content = [];

  const scorePath = path.join(scoreDir, options.scoreId);
  if (fs.existsSync(scorePath)) {
    const ext = path.extname(options.scoreId).toLowerCase();
    if (IMAGE_EXT.includes(ext)) {
      const data = fs.readFileSync(scorePath);
      const b64 = data.toString('base64');
      const mime = IMAGE_MIME[ext] || 'image/png';
      content.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${b64}` },
      });
    }
  }

  const refText = options.referenceYoutubeUrl
    ? `참조(프로) 연주 영상 링크: ${options.referenceYoutubeUrl}. 사용자가 이 연주를 참고하고자 합니다.`
    : '';
  const perfText =
    options.performanceType === 'youtube' && options.performanceYoutubeUrl
      ? `본인 연주 영상 링크: ${options.performanceYoutubeUrl}. 위 링크의 연주를 평가해 주세요. (영상은 직접 재생되지 않으므로, 악보와 링크 설명을 바탕으로 평가해 주세요.)`
      : options.performanceType === 'upload'
        ? '본인 연주는 동영상 파일로 제출되었습니다. (ChatGPT는 동영상을 직접 재생하지 않으므로, 악보와 참조 연주를 기준으로 일반적인 연주 평가와 개선 제안을 해 주세요.)'
        : '';

  const userText = [
    '다음은 악보 이미지와, 참조 연주·본인 연주 정보입니다.',
    refText,
    perfText,
    '악보에 맞춰 기술적·표현적 관점에서 100점 만점으로 평가하고, 구간별 차이점과 개선 제안을 JSON으로만 출력하세요.',
  ]
    .filter(Boolean)
    .join('\n');

  content.push({ type: 'text', text: userText });

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content },
    ],
    max_tokens: 4096,
  });

  const text = completion.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenAI returned empty response');
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
