@echo off
REM ============================================================
REM  OfficeStock - Demarrage local (double-cliquez ce fichier)
REM  Ouvre l'API + le site, puis le navigateur sur l'application.
REM  Lien : http://localhost:5173
REM ============================================================

cd /d "%~dp0"

echo Demarrage de l'API OfficeStock (port 4000)...
start "OfficeStock API" cmd /k "cd /d "%~dp0backend" && npm run start"

echo Demarrage du site OfficeStock (port 5173)...
start "OfficeStock Web" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Ouverture du navigateur dans quelques secondes...
timeout /t 10 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ============================================================
echo  OfficeStock est lance.
echo  Lien : http://localhost:5173
echo  Admin  : anas@strapexmaroc.com   / admin123
echo  Hassan : hassan@strapexmaroc.com / hassan123
echo.
echo  Pour ARRETER : fermez les deux fenetres "OfficeStock API"
echo  et "OfficeStock Web".
echo ============================================================
echo.
pause
