# Diretrizes do Projeto — Antigravity / Gemini CLI

Este projeto segue o **Guia Universal de Desenvolvimento Agêntico Full-Stack Multi-Stack**.

## Workflow Obrigatório
1. **RESEARCH**: Antes de alterar código, entenda o contexto lendo `docs/specs/` e consultando o grafo de conhecimento `graphify-out/graph.json` via `/graphify query "[pergunta]"`.
2. **PLAN**: Crie um plano técnico claro em `docs/plans/` ou via artifact de planejamento.
3. **IMPLEMENT**: Altere código em blocos pequenos, orientados a testes e validação estrita.
4. **VERIFY**: Execute os testes, linter e build do projeto.
5. **REVIEW**: Acione os subagentes especializados (`security-reviewer`, `code-reviewer`, etc.).
6. **REPORT**: Registre o relatório em `docs/tasks/YYYY-MM-DD-[feature].md`.

## Regras Ativas
- As regras de segurança, qualidade, SOLID e arquitetura estão centralizadas em `.claude/rules/` e `.agents/rules/`.
- Nunca exponha ou leia segredos (`.env`, chaves privadas, tokens).
- Nunca execute comandos destrutivos sem verificação.
- Mantenha o grafo de conhecimento atualizado com `/graphify . --update`.
