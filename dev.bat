@echo off
chcp 65001 >nul
title Pitsas Bank Development Mode

echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                                ║
echo ║                      🛠️  DEVELOPMENT MODE  🛠️                                 ║
echo ║                                                                                ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Εκκίνηση σε Development Mode...
echo    • Developer Tools ενεργοποιημένα
echo    • Hot reload
echo    • Debug mode
echo.

REM Αλλαγή στον φάκελο του προγράμματος
cd /d "%~dp0"

REM Set development environment
set NODE_ENV=development

echo 🚀 Εκκίνηση...
echo.

npm run dev

echo.
echo Development session τερματίστηκε.
pause
