@echo off
REM Cross-platform Python launcher for AI log hooks (Windows cmd.exe).
REM Prefer the repository virtualenv, then try py -3 -> python -> python3.
REM Exits 0 silently if no Python is found - hooks must never block the AI tool.

"%~dp0..\.venv\Scripts\python.exe" -c "import sys" >nul 2>nul
if %ERRORLEVEL%==0 (
  "%~dp0..\.venv\Scripts\python.exe" %*
  exit /b %ERRORLEVEL%
)

py -3 -c "import sys" >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 %*
  exit /b %ERRORLEVEL%
)

python -c "import sys" >nul 2>nul
if %ERRORLEVEL%==0 (
  python %*
  exit /b %ERRORLEVEL%
)

python3 -c "import sys" >nul 2>nul
if %ERRORLEVEL%==0 (
  python3 %*
  exit /b %ERRORLEVEL%
)

exit /b 0
