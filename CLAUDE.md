# [NOME_DO_PROJETO] — CLAUDE.md

## Idioma de trabalho

- Responder e documentar preferencialmente em português do Brasil.
- Código, nomes de variáveis e commits podem seguir padrão técnico em inglês ou padrão do time.

## Antes de qualquer tarefa

1. Leia `/docs/specs/main.md`.
2. Leia `/docs/specs/architecture.md`.
3. Leia `/docs/specs/domain.md`.
4. Leia `/docs/specs/security.md`.
5. Leia `/docs/specs/quality.md`.
6. Identifique regras aplicáveis em `.claude/rules/` (ou `.agents/rules/`).

## Stack do projeto

- Backend: [Spring Boot 3 / FastAPI / ASP.NET Core / NestJS]
- Frontend: [React / Next.js]
- Banco de Dados: [MySQL / PostgreSQL / SQL Server]
- ORM / Migrations: [JPA+Flyway / SQLAlchemy+Alembic / EF Core / Prisma]
- Testes: [JUnit / pytest / xUnit / Jest / Vitest / Playwright]

## Workflow obrigatório (RPI)

1. **RESEARCH**: ler contexto, consultar grafo e não editar código.
2. **PLAN**: criar plano claro com arquivos impactados e riscos.
3. **IMPLEMENT**: codar em blocos pequenos com testes.
4. **VERIFY**: rodar lint, testes e build.
5. **REVIEW**: revisar segurança, qualidade, acessibilidade e regressão.
6. **REPORT**: gerar relatório em `docs/tasks/YYYY-MM-DD-[feature].md`.

## Regras ativas

- @.claude/rules/agent-security.md
- @.claude/rules/dependency-security.md
- @.claude/rules/information-security.md
- @.claude/rules/authentication-security.md
- @.claude/rules/authorization-security.md
- @.claude/rules/input-validation.md
- @.claude/rules/no-injection.md
- @.claude/rules/backend-security.md
- @.claude/rules/frontend-security.md
- @.claude/rules/database-security.md
- @.claude/rules/devops-security.md
- @.claude/rules/clean-code.md
- @.claude/rules/solid.md
- @.claude/rules/reuse.md
- @.claude/rules/data-structures-performance.md
- @.claude/rules/task-report.md

## Regras invioláveis

- Nunca ler, imprimir ou versionar segredos (`.env`, chaves privadas, certificados).
- Nunca remover autenticação ou autorização para resolver bug.
- Nunca concatenar entrada do usuário em SQL, shell, template ou query.
- Nunca rodar migration em produção sem runbook e aprovação humana.
- Nunca expor stack trace, token, senha ou dado sensível em resposta ou log.
- Nunca adicionar dependência sem justificativa de segurança e manutenção.
- Nunca ignorar teste quebrado sem registrar motivo.
- Nunca usar dados reais em ambiente local sem anonimização.

## Graphify (grafo de conhecimento)

- Se `graphify-out/graph.json` existir, consulte o grafo antes de ler arquivos individualmente (`/graphify query "[contexto]"`).
- Após mudanças no código, execute `/graphify . --update` para manter o grafo atualizado.
- Para mapear todo o projeto pela primeira vez: `/graphify .`

## Critério de pronto (Definition of Done)

- Código compila e passa no build.
- Testes unitários e de integração passam.
- Linter e formatação passam sem erros.
- Não há segredos expostos.
- Não há regressão evidente.
- Documentação e relatório de task foram atualizados.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
