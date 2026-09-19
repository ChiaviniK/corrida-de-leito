# Relatório de Tarefa: Melhorias de Usabilidade na Corrida de Leito

- **Data:** 19/09/2026
- **Funcionalidade:** Chips clínicos de 1 toque, gestão de alta hospitalar, identificação do profissional autor, feedback háptico e exportação WhatsApp.
- **Autor:** Antigravity / Gemini CLI

## 1. Contexto e Objetivos
A partir do feedback do usuário, a aplicação simplificada de Corrida de Leito foi enriquecida com recursos que reduzem o esforço de digitação durante as visitas hospitalares, preservam o histórico de pacientes que receberam alta e facilitam a comunicação com o restante da equipe via WhatsApp.

## 2. Alterações Realizadas

### Backend (`apps/api/`):
- `models.py`:
  - `SimpleLeito`: adicionada coluna `status` (valores: `ATIVO` e `ALTA`).
  - `SimpleRegistro`: adicionada coluna `autor` (identificação do profissional).
- `main.py`:
  - `_ensure_sqlite_columns()`: migração incremental segura para bancos SQLite pré-existentes.
  - `GET /api/simple/leitos`: suporte a query param `status_filtro`.
  - `POST /api/simple/leitos/{id}/alta`: transição de paciente para status ALTA.
  - `POST /api/simple/leitos/{id}/reativar`: transição de paciente de volta para status ATIVO.
  - `GET /api/simple/leitos/{id}/download`: prontuário TXT enriquecido com status e carimbo de autor.

### Frontend (`apps/web/`):
- `src/App.jsx`:
  - Seletor de identificação do profissional no topo (`autor`), persistido em `localStorage`.
  - Abas de navegação separadas entre **Leitos Ativos** e **Histórico de Altas** com contadores numéricos.
  - **Chips clínicos rápidos** de 1 toque (`+ Sinais estáveis`, `+ Acesso OK`, `+ Diurese límpida`, etc.) que anexam condutas padronizadas à caixa de texto sem apagar o que já foi digitado ou ditado.
  - **Botão "Dar Alta"** com confirmação que arquiva o leito sem perder nenhum registro.
  - **Botão "Reativar"** na aba de altas para reinternações.
  - **Feedback háptico** via `navigator.vibrate` acionado no microfone e ações de toque.
  - **Exportação WhatsApp**:
    - Individual (resumo formatado com emojis do leito específico).
    - Geral (**Boletim de Plantão WhatsApp** com todos os leitos ativos em um único clique).
  - Geração de PDF e TXT atualizada com nome do profissional autor.

## 3. Testes e Validação
- **Testes Unitários e Integração:** `python -m unittest discover tests` (6 testes passando, incluindo ciclo de vida completo de leitos simples e servimento estático).
- **Build Frontend:** `npm run build` executado com sucesso (zero erros).
- **Grafo de Conhecimento:** Atualizado com `python -m graphify update . --force` (608 nós, 726 arestas, 106 comunidades).

## 4. Riscos e Mitigações
- **Navegador sem suporte a SpeechRecognition:** Mensagem orientando o uso do Chrome ou Edge, com digitação e chips funcionando 100% como alternativa.
- **Dispositivo sem motor de vibração:** Chamada protegida por verificação de `navigator.vibrate`, silenciosamente ignorada no desktop.
