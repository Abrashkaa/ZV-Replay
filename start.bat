@echo off
title ZV Replay Viewer
echo.
echo  Запуск ZV Replay Viewer...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ОШИБКА] Node.js не найден!
    echo  Скачайте и установите с https://nodejs.org/
    echo.
    pause & exit /b 1
)

if not exist node_modules (
    echo  Установка зависимостей...
    npm install
    echo.
)

echo  Сервер запускается на http://localhost:3000
echo  Hot reload включён - изменения файлов обновляют браузер автоматически.
echo  Новые реплеи появляются в списке автоматически.
echo.
timeout /t 1 /nobreak >nul
start http://localhost:3000
node server.js
pause
