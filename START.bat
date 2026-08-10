@echo off
echo.
echo ========================================
echo  Starting CV Classification System
echo ========================================
echo.
echo  All services will start automatically:
echo  - Backend (Port 5000)
echo  - Frontend (Port 5174)
echo  - ML Service (Port 5002)
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev
