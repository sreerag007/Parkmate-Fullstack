# Start Daphne ASGI server for WebSocket support
# This script should be used instead of 'python manage.py runserver' to enable WebSockets

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Parkmate with Daphne (WebSocket Support)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ️  Server will run on: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "ℹ️  WebSocket endpoint: ws://127.0.0.1:8000/ws/notifications/{user_id}/" -ForegroundColor Yellow
Write-Host "ℹ️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "$PSScriptRoot\parkmate-backend\Parkmate"

# Start Daphne server
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application --verbosity 2
