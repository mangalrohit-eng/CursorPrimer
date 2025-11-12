@echo off
echo ========================================
echo   Presentation Coach Agent - Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
pip show langgraph >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
) else (
    echo Dependencies already installed ✓
)

echo.
echo [2/3] Checking environment configuration...
if not exist .env (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your OPENAI_API_KEY
    echo.
    pause
)

echo.
echo [3/3] Starting LangGraph Agent Backend...
echo.
echo ========================================
echo   Agent is running on port 8000
echo   Open index.html in your browser
echo   Click "Start Coaching" to begin
echo ========================================
echo.

python presentation_coach_agent.py

