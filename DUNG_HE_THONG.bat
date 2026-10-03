@echo off
chcp 65001 > nul
title VIET THIEN COFFEE GROUP - DUNG HE THONG
echo Dang dung he thong quan tri vi the (cong 3456)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3456" ^| find "LISTENING"') do (
    echo  - Dung tien trinh PID %%a
    taskkill /F /PID %%a > nul 2>&1
)
echo  - Tat link online (neu dang mo)
powershell -NoProfile -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '%~dp0tools\*' } | Stop-Process -Force"
echo Da dung xong.
timeout /t 3 > nul
