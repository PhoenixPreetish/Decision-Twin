@echo off
title DecisionTwin AI - Database Inspector
color 0A
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
cd /d "%~dp0"
node fetch_db.js
echo.
pause
