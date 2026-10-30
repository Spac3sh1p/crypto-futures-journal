@echo off
setlocal EnableExtensions
title Crypto Futures Journal - update and open
rem One-click updater for the local dev setup (Windows):
rem   1. git pull the branch that is currently checked out
rem   2. restart the dev server HIDDEN via scripts\start-hidden-dev.vbs (same launcher the Startup folder uses)
rem   3. open the dashboard in the browser
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
if not exist "%ROOT%\package.json" (
  echo Project folder not found next to this script.
  pause
  exit /b 1
)
cd /d "%ROOT%"
echo Project folder: %CD%
echo.

echo ==========================================================
echo  Step 1/4  Download latest code from GitHub
echo ==========================================================
git rev-parse --abbrev-ref HEAD > "%TEMP%\cfj_branch.txt"
set /p BRANCH=<"%TEMP%\cfj_branch.txt"
echo Current branch: %BRANCH%
git fetch origin %BRANCH%
if errorlevel 1 (
  echo.
  echo !!! git fetch FAILED. GitHub is not reachable right now. Nothing was updated.
  echo.
  pause
  exit /b 1
)
git merge --ff-only origin/%BRANCH%
if errorlevel 1 (
  echo.
  echo !!! Could not fast-forward. Local edits are stashed first (restore later with: git stash pop),
  echo !!! then the branch is reset to the GitHub version.
  git stash push -u -m "before update"
  git reset --hard origin/%BRANCH%
)
echo.
echo Local commit now:
git log -1 --oneline
echo GitHub commit:
git log -1 --oneline origin/%BRANCH%
echo (these two lines must be identical)
echo.

echo ==========================================================
echo  Step 2/4  Stop the old dev server on port 3000
echo ==========================================================
set "PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do if not defined PID set "PID=%%P"
if defined PID (
  echo Stopping process %PID% ...
  taskkill /PID %PID% /T /F >nul 2>&1
  timeout /t 2 /nobreak >nul
) else (
  echo No dev server was running.
)
if exist ".next-dev.pid" del /q ".next-dev.pid"
if exist ".next" (
  echo Clearing build cache ...
  rd /s /q ".next" 2>nul
)
echo.

echo ==========================================================
echo  Step 3/4  Start dev server hidden in the background
echo ==========================================================
if exist "scripts\start-hidden-dev.vbs" (
  echo Using scripts\start-hidden-dev.vbs - no console window, log in persistent-dev.log
  wscript.exe "scripts\start-hidden-dev.vbs"
) else (
  echo Hidden launcher not found, starting a minimized console window instead.
  start "crypto-futures-journal dev" /min cmd /k "npm.cmd run dev"
)
echo Waiting for the server (up to 90 seconds) ...
set /a TRIES=0
:waitloop
timeout /t 3 /nobreak >nul
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 goto ready
set /a TRIES+=1
if %TRIES% lss 30 goto waitloop
echo !!! Server did not start in time. Check persistent-dev.log and persistent-dev-startup.log in the project folder.
pause
exit /b 1

:ready
echo Server is up.
echo.

echo ==========================================================
echo  Step 4/4  Open the dashboard
echo ==========================================================
start "" "http://localhost:3000/dashboard/performance?r=%RANDOM%"
echo.
echo Opened http://localhost:3000/dashboard/performance
echo The server keeps running hidden after this window closes. First load may take 10-30 seconds.
echo If the page looks old, press Ctrl+F5 in the browser.
echo.
pause
