# Rule: Prevenção contra Vulnerabilidades de Injeção

## SQL Injection
- Proibido qualquer tipo de concatenação ou interpolação de strings em consultas a banco de dados.
- Utilize exclusivamente prepared statements, ORMs (JPA, SQLAlchemy, EF Core, Prisma) ou query builders parametrizados.

## NoSQL / Document Injection
- Valide e sanitize operadores de consulta recebidos do cliente (ex.: evite passar objetos JSON arbitrários para queries MongoDB).

## Command Injection
- Evite ao máximo invocar subprocessos de sistema operacional utilizando comandos shell.
- Quando for estritamente necessário, passe argumentos como lista estruturada (sem `shell=True`) e valide contra uma allowlist rígida.

## Template / SSRF / Injeção de Expressões
- Nunca avalie ou renderize código, expressões ou templates provenientes de entrada de usuário sem isolamento e sandbox estrito.
- Em requisições HTTP externas disparadas pelo servidor (webhooks, crawlers), valide as URLs de destino contra IPs internos/privados (proteção anti-SSRF).
