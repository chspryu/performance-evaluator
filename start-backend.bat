@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if not exist "node_modules" (
  echo Installing backend dependencies...
  call npm install
)
if not exist ".env" copy .env.example .env
echo Starting backend at http://localhost:3000
call npm run dev
