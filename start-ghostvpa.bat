@echo off
echo ========================================================
echo   Starting Ghost-VPA Simulation Workbench
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Ghost-VPA FastAPI Backend Engine (Port 8000)...
start "Ghost-VPA Backend" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Ghost-VPA React/D3 Frontend (Port 5173)...
start "Ghost-VPA Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Ghost-VPA platform is launching!
echo   Frontend:  http://localhost:5173
echo   API Docs:  http://localhost:8000/docs
echo   Invariants: Zero Live Rail Connection, Zero Real Funds
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
