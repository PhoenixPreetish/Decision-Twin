@echo off
title DecisionTwin AI: Nexus - Master Launcher
color 0B

echo ============================================================================
echo    DECISIONTWIN AI: NEXUS - COGNITIVE DECISION INTELLIGENCE PLATFORM
echo ============================================================================
echo.

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
cd /d "%PROJECT_DIR%"

REM Ensure Node.js and npm are in PATH even if launched from Windows Explorer
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python311"

REM Check Node.js availability
where node >nul 2>&1
if errorlevel 1 goto :NO_NODE

echo [0/4] Preparing environment and freeing ports 5000, 5173, 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

if exist "%PROJECT_DIR%\server\node_modules" goto :CHECK_CLIENT_DEPS
echo       Installing Backend dependencies...
cd /d "%PROJECT_DIR%\server"
call npm install
cd /d "%PROJECT_DIR%"

:CHECK_CLIENT_DEPS
if exist "%PROJECT_DIR%\client\node_modules" goto :CHECK_ENV
echo       Installing Frontend dependencies...
cd /d "%PROJECT_DIR%\client"
call npm install
cd /d "%PROJECT_DIR%"

:CHECK_ENV
if exist "%PROJECT_DIR%\server\.env" goto :CHECK_PYTHON
if not exist "%PROJECT_DIR%\server\.env.example" goto :CHECK_PYTHON
echo       Creating server\.env from .env.example...
copy /Y "%PROJECT_DIR%\server\.env.example" "%PROJECT_DIR%\server\.env" >nul

:CHECK_PYTHON
if not exist "%PROJECT_DIR%\ml_service\main.py" goto :SKIP_PYTHON
where python >nul 2>&1
if errorlevel 1 goto :SKIP_PYTHON
echo [1/4] Starting Python FastAPI ML Microservice on Port 8000...
start "DecisionTwin ML Service - Port 8000" /D "%PROJECT_DIR%\ml_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
goto :START_BACKEND

:SKIP_PYTHON
echo [1/4] Python ML Service optional - using built-in Node.js Nexus Engine fallback.

:START_BACKEND
echo [2/4] Starting Node.js Express + Nexus Engine Backend on Port 5000...
start "DecisionTwin Backend - Port 5000" /D "%PROJECT_DIR%\server" cmd /k "npm start"

echo [3/4] Starting React + Vite Frontend UI on Port 5173...
start "DecisionTwin Frontend - Port 5173" /D "%PROJECT_DIR%\client" cmd /k "npm run dev"

echo [4/4] Waiting for services to initialize before opening browser...
ping 127.0.0.1 -n 6 >nul

echo       Opening http://localhost:5173 in your default browser...
start "" "http://localhost:5173"

echo.
echo ============================================================================
echo    ALL SERVICES STARTED SUCCESSFULLY!
echo ============================================================================
echo    * Frontend UI:        http://localhost:5173
echo    * Backend API:        http://localhost:5000/api/health
echo    * ML Microservice:    http://localhost:8000/health
echo ============================================================================
echo    To stop all running services, run DecisionTwin-Stop.bat
echo.
pause
exit /b 0

:NO_NODE
echo [ERROR] Node.js was not found in your system PATH.
echo Please install Node.js from https://nodejs.org/ and try again.
pause
exit /b 1