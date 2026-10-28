@echo off
title UPLC : Unified Pharmacy Learning Center (LAN Server)
cd /d "%~dp0"

echo ======================================================================
echo    UPLC : UNIFIED PHARMACY LEARNING CENTER LAUNCHER
echo ======================================================================
echo.

REM 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan di sistem Windows Anda!
    echo Harap install Python 3.10+ dan pastikan opsi Add Python to PATH dicentang.
    echo.
    pause
    exit /b 1
)

REM 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem Windows Anda!
    echo Harap install Node.js dari https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 3. Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm tidak ditemukan di sistem Windows Anda!
    echo Harap pastikan Node.js terinstall dengan benar bersama npm.
    echo.
    pause
    exit /b 1
)

REM 4. Verify Python virtual environment
if not exist "backend\venv\Scripts\python.exe" (
    echo [*] Menyiapkan virtual environment Python backend...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM 5. Verify Frontend dependencies
if not exist "frontend\node_modules" (
    echo [*] Menginstall dependensi frontend npm...
    cd frontend
    call npm install
    cd ..
)

REM 6. Verify Backend .env
if not exist "backend\.env" (
    echo [*] Menyiapkan backend\.env...
    copy backend\.env.example backend\.env >nul
)

REM 7. Run database migration and admin initialization
echo [*] Memeriksa dan menjalankan migrasi database PostgreSQL...
cd backend
venv\Scripts\alembic.exe upgrade head
venv\Scripts\python.exe init_admin.py
cd ..

REM 8. Launch Python Supervisor to run both services
echo.
echo [*] Memulai service Backend FastAPI dan Frontend Next.js...
echo.
backend\venv\Scripts\python.exe supervisor.py

echo.
echo [!] Aplikasi telah dihentikan.
pause
