import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const maxScoreMb = Number(process.env.MAX_SCORE_SIZE_MB) || 20;
const maxVideoMb = Number(process.env.MAX_VIDEO_SIZE_MB) || 500;

const scoreDir = path.join(uploadDir, 'scores');
const perfDir = path.join(uploadDir, 'performances');
[scoreDir, perfDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const scoreStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, scoreDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.bin'}`),
});
const scoreUpload = multer({
  storage: scoreStorage,
  limits: { fileSize: maxScoreMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|png|jpg|jpeg|webp)$/i.test(file.originalname);
    if (!allowed) return cb(new Error('INVALID_SCORE_FILE'));
    cb(null, true);
  },
});

const perfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, perfDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.bin'}`),
});
const perfUpload = multer({
  storage: perfStorage,
  limits: { fileSize: maxVideoMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|webm|avi|mkv)$/i.test(file.originalname);
    if (!allowed) return cb(new Error('INVALID_VIDEO_FILE'));
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post('/score', scoreUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_SCORE_FILE', message: '악보 파일을 선택해 주세요.' },
      });
    }
    const scoreId = path.basename(req.file.filename, path.extname(req.file.filename));
    res.json({
      ok: true,
      data: {
        scoreId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        pageCount: 1,
        mimeType: req.file.mimetype,
      },
    });
  } catch (e) {
    if (e.message === 'INVALID_SCORE_FILE') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_SCORE_FILE', message: '지원하지 않는 파일 형식이거나 20MB를 초과합니다.' },
      });
    }
    next(e);
  }
});

uploadRouter.post('/performance', perfUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_VIDEO_FILE', message: '동영상 파일을 선택해 주세요.' },
      });
    }
    res.json({
      ok: true,
      data: {
        performanceId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (e) {
    if (e.message === 'INVALID_VIDEO_FILE') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_VIDEO_FILE', message: '지원하지 않는 동영상 형식이거나 500MB를 초과합니다.' },
      });
    }
    next(e);
  }
});
