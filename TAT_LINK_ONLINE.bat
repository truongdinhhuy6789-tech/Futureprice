@echo off
chcp 65001 > nul
title VIET THIEN COFFEE GROUP - TAT LINK ONLINE
echo Dang tat link online (bo giu link + duong ham Cloudflare)...
powershell -NoProfile -Command "$p = '%~dp0app\data\link_keeper.pid'; if (Test-Path $p) { Stop-Process -Id ([int](Get-Content $p -Raw)) -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '%~dp0tools\*' } | Stop-Process -Force"
echo Da tat link. He thong tren may van chay binh thuong.
timeout /t 3 > nul
