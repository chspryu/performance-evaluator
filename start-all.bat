@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo [1/2] Backend...
start "연주평가기-백엔드" cmd /k "cd /d %~dp0backend && (if not exist node_modules npm install) && (if not exist .env copy .env.example .env) && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Frontend...
start "연주평가기-프론트" cmd /k "cd /d %~dp0frontend && (if not exist node_modules npm install) && npm run dev"

echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Close the two command windows to stop the servers.
pause
