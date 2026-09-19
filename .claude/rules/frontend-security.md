# Rule: Diretrizes de Segurança para Frontend

## Prevenção a XSS (Cross-Site Scripting)
- NUNCA utilize `dangerouslySetInnerHTML` (React) ou `v-html` (Vue) sem sanitização explícita via bibliotecas consolidadas (ex.: DOMPurify).
- Não renderize conteúdo controlado pelo usuário diretamente dentro de atributos HTML críticos como `href="javascript:..."` ou manipuladores de eventos.

## Armazenamento e Tokens
- Prefira cookies seguros com as flags `HttpOnly`, `Secure` e `SameSite=Lax/Strict` para armazenar tokens de sessão.
- Evite persistir dados de identificação pessoal (PII) ou tokens confidenciais em `localStorage` ou `sessionStorage`.

## Proteção contra CSRF
- Em aplicações baseadas em cookies de sessão, implemente proteção com tokens anti-CSRF em todas as requisições de mutação (POST, PUT, DELETE, PATCH).

## Isolamento de Dependências
- NUNCA importe pacotes de backend ou bibliotecas de runtime de servidor em componentes do frontend.
- Monitore o tamanho do bundle e audite periodicamente pacotes de terceiros.
