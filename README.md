# 🏥 Corrida de Leito & Passagem de Plantão Hospitalar (v2.0 Pro)

> Aplicação web responsiva, ágil e focada na prática hospitalar diária para equipes multiprofissionais realizarem a **corrida de leito** e a **passagem de plantão**, com anotações por voz (transcrição em tempo real pt-BR), chips clínicos rápidos de 1 toque, classificação de risco, pílulas inteligentes de sinais vitais, exportação WhatsApp e geração de prontuário em PDF/TXT.

---

## ✨ Funcionalidades Principais

- 🛏️ **Gestão Ágil de Leitos & Pacientes**: Cadastro direto de leitos e pacientes em segundos.
- 🎤 **Transcrição de Voz em Tempo Real (pt-BR)**: Dite a evolução do paciente na beira do leito usando a Web Speech API nativa (zero custo e sem necessidade de chaves de API externas).
- 🩺 **Chips Clínicos Rápidos de 1 Toque**: Insira com 1 toque condutas frequentes (*Sinais estáveis*, *Acesso OK*, *Diurese límpida*, *Pele íntegra*, *Dieta tolerada*, etc.).
- 🎯 **Classificação de Risco / Criticidade**: Marque instantaneamente o paciente como `🟢 Estável`, `🟡 Atenção` ou `🔴 Crítico` com bordas visuais coloridas no card.
- 📊 **Detecção Automática de Sinais Vitais**: O sistema extrai automaticamente do texto ditado/digitado os parâmetros de PA, FC, SatO₂, Tax e Glicemia, destacando pílulas de alerta ⚠️ caso estejam alterados.
- 🌙 **Modo Noturno (Plantão)**: Alterne com 1 clique (☀️/🌙) para visitas noturnas e UTIs com as luzes apagadas sem ofuscar a visão nem acordar o paciente.
- 📲 **Instalação como App no Celular (PWA)**: Pode ser instalado na tela de início do smartphone (Android / iOS) e executado em tela cheia como um app nativo.
- 🚪 **Gestão de Altas com Histórico**: Arquive pacientes que receberam alta sem poluir a lista de leitos ativos e sem perder o histórico.
- 💬 **Exportação para WhatsApp**:
  - Resumo individual formatado com emojis para o leito.
  - **Boletim Geral de Plantão** compilando todos os leitos ativos em um único texto para passar o plantão no grupo da equipe.
- 📄 **Exportação de Prontuário em PDF e TXT**: Documento formatado contendo todos os registros cronológicos e o profissional responsável.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+

### 1. Inicialização Rápida (Windows)
Dê um duplo clique em `start_dev.bat` ou execute no PowerShell:
```powershell
.\start_dev.ps1
```

### 2. Ou Inicialização Manual
```powershell
# 1. Compilar o frontend
cd apps/web
npm install
npm run build
cd ../..

# 2. Instalar dependências Python e iniciar
pip install -r requirements.txt
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```
Acesse no navegador: [http://localhost:8000](http://localhost:8000).

---

## 🌐 Deploy Online (Nuvem Gratuita)

Esta aplicação foi preparada para deploy imediato via Docker:

### Opção A: Render.com
1. Crie uma conta no [Render.com](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte este repositório do GitHub.
4. O Render detectará automaticamente o `Dockerfile` ou as instruções de build.
5. Em poucos minutos, sua aplicação estará online com link HTTPS público!

### Opção B: Railway / Fly.io / Koyeb
Basta conectar o repositório do GitHub na plataforma escolhida; o `Dockerfile` multi-estágio compila o frontend e serve a API automaticamente.

---

## 🛠️ Tecnologias Utilizadas
- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic, Uvicorn, HTTPX.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, jsPDF.
- **PWA:** Web App Manifest, Service Worker ready, Standalone mode.
- **Engenharia de Software:** Arquitetura Agêntica Multi-Stack, Graphify Knowledge Graph.
