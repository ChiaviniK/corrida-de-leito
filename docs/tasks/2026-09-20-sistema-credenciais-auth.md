# Relatório de Tarefa: Sistema de Credenciais e Autenticação Restrita

- **Data:** 20/09/2026
- **Funcionalidade:** Sistema de autenticação fechado com credenciais gerenciadas exclusivamente via assistente/administração, sem cadastro público, com gatekeeping total na UI e primeiro usuário `augusto` provisionado.
- **Autor:** Antigravity / Gemini CLI

## 1. Contexto e Objetivos
Implementar autenticação restrita para a aplicação "Corrida de Leito & Plantão Hospitalar":
- Apenas o administrador cadastra usuários através do assistente (sem botão de cadastro ou auto-registro público).
- Bloqueio completo de acesso: visitantes não autenticados veem apenas a tela de login médico e não têm acesso à visualização ou edição de leitos e prontuários.
- Primeiro usuário administrativo provisionado:
  - **Usuário:** `augusto`
  - **Senha:** `Agusto123`
  - **Perfil:** `ADMIN`

## 2. Alterações Realizadas

### Backend (`apps/api/`):
- `auth.py` [NOVO]:
  - Funções criptográficas utilizando a biblioteca padrão do Python (`hashlib`, `hmac`, `secrets`):
    - `hash_password(password)`: PBKDF2-HMAC-SHA256 com 100.000 iterações e salt aleatório de 16 bytes.
    - `verify_password(password, stored_hash)`: verificação com tempo constante via `hmac.compare_digest`.
    - `create_access_token(payload, expires_delta)`: emissão de tokens de sessão assinados com HMAC-SHA256 (validade de 24 horas).
    - `verify_access_token(token)`: validação de assinatura e expiração do token.
- `models.py`:
  - Modelo `Usuario` adicionado com campos: `id`, `username`, `nome`, `password_hash`, `role`, `ativo`, `created_at`.
- `manage_users.py` [NOVO]:
  - Utilitário administrativo CLI para gerenciar e criar usuários com segurança:
    - `python -m apps.api.manage_users add <username> <senha> [nome] [role]`
    - `python -m apps.api.manage_users list`
    - `python -m apps.api.manage_users deactivate <username>`
- `main.py`:
  - `_ensure_default_user()`: no startup, se a tabela estiver vazia, cria e provisiona com segurança o usuário `augusto` / `Agusto123`.
  - `POST /api/auth/login`: validação de credenciais, mensagem de erro genérica contra enumeração de contas, e emissão de token de sessão.
  - `GET /api/auth/me`: validação de token Bearer e retorno do perfil autenticado.
  - `POST /api/auth/logout`: encerramento de sessão.

### Frontend Web (`apps/web/`):
- `src/App.jsx`:
  - Gatekeeper de autenticação: se não houver usuário autenticado, exibe tela de login elegante e responsiva com alternador de modo noturno e ícones médicos.
  - Verificação de sessão existente via `GET /api/auth/me` no startup.
  - Header da aplicação atualizado com:
    - Badge do usuário autenticado exibindo nome, inicial e tag de permissão (`ADMIN` / `EQUIPE`).
    - Botão "Sair" (`LogOut`) para logout seguro e limpeza de credenciais no cliente.
    - Assinatura automática dos registros clínicos com o nome do usuário logado (`Augusto`).

### Testes Automatizados (`tests/test_api.py`):
- `test_09_auth_login_fail`: valida bloqueio com credenciais incorretas (HTTP 401).
- `test_10_auth_login_success`: valida login bem-sucedido de `augusto` e recebimento do token.
- `test_11_auth_me_endpoint`: valida autorização com header Bearer e integridade do perfil retornado.

## 3. Testes e Validação
- **Testes Automatizados:** 11/11 testes passando (`python -m unittest discover tests` - `OK`).
- **Build Frontend:** `npm run build` gerou o bundle de produção em `apps/web/dist` sem falhas.
- **Grafo de Conhecimento:** Atualizado com `python -m graphify update . --force` (**686 nós**, **872 arestas**, **113 comunidades**).

## 4. Conclusão
O sistema hospitalar de corrida de leito agora opera sob controle de acesso estrito. Somente usuários cadastrados pela administração conseguem acessar e registrar condutas clínicas.
