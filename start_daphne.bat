@echo off
REM Start Daphne ASGI server for WebSocket support
REM This script should be used instead of 'python manage.py runserver' to enable WebSockets

echo ============================================================
echo 🚀 Starting Parkmate with Daphne (WebSocket Support)
echo ============================================================
echo.
echo ℹ️  Server will run on: http://127.0.0.1:8000
echo ℹ️  WebSocket endpoint: ws://127.0.0.1:8000/ws/notifications/{user_id}/
echo ℹ️  Press Ctrl+C to stop the server
echo.
echo ============================================================

cd /d "%~dp0parkmate-backend\Parkmate"

REM Start Daphne server
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application --verbosity 2

pause
