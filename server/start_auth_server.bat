@echo off
echo Starting authentication server...

REM Change to server directory
cd /d "%~dp0"

REM Check if virtual environment exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Start the server
echo Starting server on port 8001...
python auth_server.py

pause
