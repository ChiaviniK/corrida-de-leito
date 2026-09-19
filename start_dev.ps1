Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Iniciando Corrida de Leito & Passagem de Plantão" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

Write-Host "1. Iniciando API Backend (FastAPI na porta 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "2. Iniciando Frontend Web (Vite na porta 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location apps/web; npm run dev"

Write-Host "`nAplicação iniciada com sucesso!" -ForegroundColor Yellow
Write-Host "• Acesso no computador: http://localhost:3000" -ForegroundColor White
Write-Host "• Acesso no smartphone (mesma rede Wi-Fi): http://[SEU-IP]:3000" -ForegroundColor White
