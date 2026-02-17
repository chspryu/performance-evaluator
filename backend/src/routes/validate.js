import { Router } from 'express';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const validateRouter = Router();

validateRouter.post('/youtube', async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_YOUTUBE_URL', message: 'YouTube URL을 입력해 주세요.' },
      });
    }
    const match = url.trim().match(YOUTUBE_REGEX);
    if (!match) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_YOUTUBE_URL', message: 'YouTube URL 형식이 올바르지 않습니다.' },
      });
    }
    const videoId = match[4];
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (!oembedRes.ok) {
        return res.json({
          ok: true,
          data: { valid: false, reason: '비공개 또는 삭제된 영상입니다.' },
        });
      }
      const data = await oembedRes.json();
      res.json({
        ok: true,
        data: {
          valid: true,
          videoId,
          title: data.title || '',
        },
      });
    } catch {
      res.json({
        ok: true,
        data: { valid: true, videoId, title: '' },
      });
    }
  } catch (e) {
    next(e);
  }
});
