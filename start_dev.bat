@echo off
echo =======================================================
echo    Iniciando Corrida de Leito & Passagem de Plantao
echo =======================================================
echo.
echo 1. Iniciando API Backend (FastAPI na porta 8000)...
start "API Backend - FastAPI" cmd /k "python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload"

echo 2. Iniciando Frontend Web (Vite na porta 3000)...
cd apps\web
start "Frontend Web - Vite" cmd /k "npm run dev"

echo.
echo =======================================================
echo  Aplicacao iniciada com sucesso!
echo  Acesse no seu navegador: http://localhost:3000
echo  Para acessar pelo celular na mesma rede Wi-Fi:
echo  Verifique seu IP com 'ipconfig' (ex: http://192.168.1.X:3000)
echo =======================================================
