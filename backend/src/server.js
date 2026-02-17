import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import { v4 as uuidv4 } from 'uuid';
import { settingsRouter } from './routes/settings.js';
import { uploadRouter } from './routes/upload.js';
import { validateRouter } from './routes/validate.js';
import { evaluateRouter } from './routes/evaluate.js';
import { historyRouter } from './routes/history.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT || 3000;

// CORS: 배포 시 같은 서버에서 프론트 서빙하면 같은 도메인이므로 FRONTEND_ORIGIN 생략 가능
const corsOrigin = process.env.FRONTEND_ORIGIN || (isProduction ? true : 'http://localhost:5173');
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(session({
  name: 'pe_session',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: process.env.SESSION_SAME_SITE || 'lax',
}));

app.use((req, res, next) => {
  if (!req.session.sid) req.session.sid = uuidv4();
  next();
});

app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/validate', validateRouter);
app.use('/api/v1/evaluate', evaluateRouter);
app.use('/api/v1/history', historyRouter);

// API 경로인데 매칭된 라우트 없음 → JSON 404
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'API 경로를 찾을 수 없습니다.' } });
  }
  next();
});

// 프로덕션: 프론트 빌드 폴더를 정적 서빙 (다른 PC에서 접속 시 같은 URL로 사용)
if (isProduction) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
