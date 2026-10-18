@echo off
title DecisionTwin AI - Seed Demo Database
color 0E
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
cd /d "%~dp0"
node seed_demo.js
echo.
pause
