@echo off
title DecisionTwin AI: Nexus - Stop Servers
color 0C
cls

echo ===============================================================================
echo          DECISIONTWIN AI: NEXUS - SERVER SHUTDOWN
echo ===============================================================================
echo.
echo Stopping all running instances on Port 5000, Port 5173, and Port 8000...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

echo [DONE] All DecisionTwin AI: Nexus background servers have been stopped.
echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
