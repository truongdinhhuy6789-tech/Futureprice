@echo off
chcp 65001 > nul
title VIET THIEN COFFEE GROUP - KHOI DONG HE THONG
echo =======================================================
echo    VIET THIEN COFFEE GROUP
echo    HE THONG QUAN TRI VI THE HANG THUC ^& PHONG HO SAN
echo =======================================================
echo.
node -v > nul 2>&1
if errorlevel 1 (
    echo [LOI] Chua cai Node.js. Tai tai https://nodejs.org roi chay lai.
    pause
    exit /b
)

netstat -aon | find ":3456" | find "LISTENING" > nul
if not errorlevel 1 (
    echo He thong dang chay san - mo trinh duyet...
    start "" http://localhost:3456
    exit /b
)

echo [1/2] Dang khoi dong server (cua so thu nho "VIET THIEN - SERVER")...
cd /d "%~dp0app"
start "VIET THIEN - SERVER (dong cua so nay = tat he thong)" /MIN node server.js
timeout /t 2 /nobreak > nul

echo [2/2] Mo giao dien quan tri...
start "" http://localhost:3456
echo.
echo  San sang: http://localhost:3456
echo  Tat he thong: chay DUNG_HE_THONG.bat
timeout /t 4 > nul
