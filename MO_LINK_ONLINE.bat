@echo off
chcp 65001 > nul
title VIET THIEN COFFEE GROUP - LINK ONLINE
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\mo_link_online.ps1"
