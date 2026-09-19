# Relatório de Tarefa: Corrida de Leito & Plantão Hospitalar (v2.0 Pro)

- **Data:** 19/09/2026
- **Funcionalidades:** Classificação de Risco/Criticidade (1 toque), Modo Noturno (Plantão), PWA instalável no celular, identificação automática de sinais vitais nas anotações, edição rápida de leito/paciente e ordenação inteligente de corredor.
- **Autor:** Antigravity / Gemini CLI

## 1. Contexto e Objetivos
Consolidar a experiência completa da aplicação para uso real na beira do leito hospitalar, trazendo inteligência visual de sinais vitais, classificação de risco por cores, facilidade de uso noturno com pouca iluminação e capacidade de funcionamento como app nativo em smartphones.

## 2. Alterações Realizadas

### Backend (`apps/api/`):
- `models.py`:
  - `SimpleLeito`: adicionada coluna `criticidade = Column(String(20), default="ESTAVEL")`.
- `main.py`:
  - `_ensure_sqlite_columns()`: migração incremental da coluna `criticidade`.
  - `GET /api/simple/leitos`: retorno do campo `criticidade`.
  - `POST /api/simple/leitos`: aceita `criticidade` na criação.
  - `PUT /api/simple/leitos/{id}`: edição de acomodação (`leito`) e nome do `paciente`.
  - `PATCH /api/simple/leitos/{id}/criticidade`: atualização rápida de risco em 1 toque.
  - `GET /api/simple/leitos/{id}/download`: inclui campo `Criticidade / Risco` no prontuário.

### Frontend Web (`apps/web/`):
- `public/manifest.json` & `public/pwa-icon.svg`: configuração completa de PWA com tema `#0284c7` e display `standalone`.
- `index.html`: tags Apple Mobile Web App, tema e vinculação do manifesto.
- `src/App.jsx`:
  - Alternador de **Modo Noturno (Dark Mode)** via botão ☀️/🌙 persistido no navegador.
  - Seletor de **Criticidade com 1 toque** (`🟢 Estável`, `🟡 Atenção`, `🔴 Crítico`) com bordas temáticas dinâmicas nos cards.
  - Botão **Instalar App 📲** quando o navegador dispara o prompt PWA.
  - Parser de **Sinais Vitais** (`extrairSinaisVitais`) que gera badges coloridos para PA, FC, SatO₂, Tax e Glicemia, com destaque de alerta ⚠️ se alterados.
  - Modal de **Edição Rápida (Lápis ✏️)** para corrigir identificação e nome do paciente.
  - Seletor de **Ordenação Inteligente** (Corredor numérico, Criticidade, Não visitados hoje, Recentes).

## 3. Testes e Validação
- **Testes Automatizados:** 8/8 testes passando (`python -m unittest discover tests` - `OK`).
- **Build Frontend:** `npm run build` gerou a distribuição de produção sem erros em `apps/web/dist`.
- **Grafo de Conhecimento:** Atualizado com `python -m graphify update . --force` (**634 nós**, **778 arestas** e **108 comunidades**).

## 4. Conclusão
A aplicação atende com excelência ao objetivo de ser simples, rápida e extremamente funcional para médicos, enfermeiros e equipes multiprofissionais realizarem a corrida de leito e a passagem de plantão.
