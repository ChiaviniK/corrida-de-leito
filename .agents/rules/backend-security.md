# Rule: Diretrizes de Segurança para APIs e Backend

## Endpoints e Respostas HTTP
- Todo endpoint deve declarar explicitamente: Método HTTP, Rota, Esquema de Autenticação/Autorização, DTO de Entrada e DTO de Saída.
- NUNCA exponha rastros de pilha (stack traces), nomes de tabelas ou detalhes internos da infraestrutura em mensagens de erro HTTP (use padrão RFC 7807 Problem Details).
- Aplique rate limiting em rotas sensíveis: autenticação, esqueci a senha, envio de e-mails, buscas textuais pesadas.

## Resiliência em Integrações Externas
- Configure timeouts curtos e explícitos em todas as chamadas HTTP a serviços externos.
- Utilize políticas de retry com exponential backoff e jitter para lidar com instabilidades transitórias.
- Utilize Circuit Breaker para evitar falhas em cascata em serviços dependentes.
- Valide rigorosamente assinaturas criptográficas em webhooks recebidos.

## Consultas e Paginação
- Toda listagem de dados deve possuir paginação obrigatória (número de página / cursor e tamanho máximo de página).
- Aplique projeções e evite retornar entidades de banco inteiras para o cliente; exponha apenas campos autorizados via DTOs.
