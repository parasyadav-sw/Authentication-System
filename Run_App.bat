@echo off
title Secure Authentication System Launcher
cd /d "%~dp0"
echo ===================================================
echo  Starting Secure Authentication Server...
echo ===================================================
echo.
:: Wait a split second and open browser
start http://localhost:3000
:: Run the node application
npm start
pause
