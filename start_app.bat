@echo off

REM Get the IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do set ip=%%a
set ip=%ip:~1%

REM Create a virtual environment (if doesn't exist)
IF NOT EXIST "venv\" (python -m venv venv)

REM Activate the virtual environment
call venv\Scripts\activate

REM Install the requirements
python -m pip install -r requirements.txt

REM Get and Set Environment Variables
for /f "tokens=1* delims==" %%a in (env.txt) do (set "%%a=%%b")

REM Run the app
start "AI Playground" cmd /c "python -m flask --debug run --host=0.0.0.0 --cert=adhoc"

REM Open the app in the default browser
timeout /t 5
start "" https://%ip%:5000