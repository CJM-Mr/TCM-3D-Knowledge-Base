@echo off
title 本草维度 · 中药与方剂三维知识网络
cd /d "%~dp0"
if exist "三维知识网络.exe" (
    echo 正在启动本草维度...
    "三维知识网络.exe"
) else (
    echo 未找到 三维知识网络.exe，改用源码启动...
    cd backend
    python app.py
)
pause
