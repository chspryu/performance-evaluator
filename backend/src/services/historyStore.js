import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../../data/history.json');

function ensureDataDir() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({ sessions: {} }), 'utf8');
}

function read() {
  ensureDataDir();
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return { sessions: {} };
  }
}

function write(data) {
  ensureDataDir();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

export function addEvaluation(sessionId, { result, referenceYoutubeUrl, performanceType, performanceSummary }) {
  const data = read();
  if (!data.sessions[sessionId]) data.sessions[sessionId] = { evaluations: [] };
  const id = `eval_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const evaluation = {
    id,
    createdAt: new Date().toISOString(),
    result,
    referenceYoutubeUrl: referenceYoutubeUrl || '',
    performanceType: performanceType || 'upload',
    performanceSummary: performanceSummary || '',
  };
  data.sessions[sessionId].evaluations.unshift(evaluation);
  write(data);
  return id;
}

export function listEvaluations(sessionId, { limit = 50, offset = 0 } = {}) {
  const data = read();
  const list = (data.sessions[sessionId]?.evaluations || []).slice(offset, offset + limit);
  const total = data.sessions[sessionId]?.evaluations?.length ?? 0;
  return {
    items: list.map(({ id, createdAt, result, referenceYoutubeUrl, performanceType, performanceSummary }) => ({
      id,
      createdAt,
      totalScore: result?.totalScore ?? 0,
      maxScore: result?.maxScore ?? 100,
      referenceYoutubeUrl,
      performanceType,
      performanceSummary,
    })),
    total,
  };
}

export function getEvaluation(sessionId, evaluationId) {
  const data = read();
  const list = data.sessions[sessionId]?.evaluations || [];
  return list.find((e) => e.id === evaluationId) || null;
}

export function deleteEvaluation(sessionId, evaluationId) {
  const data = read();
  if (!data.sessions[sessionId]) return false;
  const before = data.sessions[sessionId].evaluations.length;
  data.sessions[sessionId].evaluations = data.sessions[sessionId].evaluations.filter((e) => e.id !== evaluationId);
  if (data.sessions[sessionId].evaluations.length === before) return false;
  write(data);
  return true;
}
