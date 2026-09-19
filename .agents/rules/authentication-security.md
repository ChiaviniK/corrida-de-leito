# Rule: Autenticação Segura

## Login e Autenticação
- Em falhas de autenticação, utilize mensagens genéricas (ex.: "Credenciais inválidas"), sem revelar se o usuário existe ou se a senha está incorreta.
- Implemente rate limiting e proteção progressiva contra ataques de força bruta no endpoint de autenticação.
- Habilite autenticação multifator (MFA) para operações e usuários com privilégios administrativos.

## Gestão de Senhas
- Nunca armazene senhas em texto puro.
- Aplique políticas mínimas de complexidade e tamanho de senha alinhadas com recomendações NIST.
- O fluxo de recuperação de senha deve gerar tokens criptográficos descartáveis, únicos e com expiração curta (máximo 15 a 30 minutos).

## Sessões e Tokens (JWT / Cookies)
- Tokens de acesso devem ter tempo de vida curto (ex.: 15 a 60 minutos).
- Refresh tokens devem ser revogáveis, armazenados de forma segura e com suporte a rotação.
- Cookies de autenticação devem possuir as flags: `HttpOnly`, `Secure` e `SameSite=Lax` ou `Strict`.
- Invalidar completamente a sessão no servidor após o logout.
