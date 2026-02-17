export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      ok: false,
      error: {
        code: err.field === 'file' ? (req.path.includes('performance') ? 'INVALID_VIDEO_FILE' : 'INVALID_SCORE_FILE') : 'INVALID_INPUT',
        message: req.path.includes('performance') ? '파일 크기가 500MB를 초과합니다.' : '파일 크기가 20MB를 초과합니다.',
      },
    });
  }
  const code = err.code || 'INTERNAL_ERROR';
  const status = err.status || 500;
  const message = err.message || '서버 오류가 발생했습니다.';
  res.status(status).json({
    ok: false,
    error: { code, message },
  });
}
