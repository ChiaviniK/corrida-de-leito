# Rule: Diretrizes de Segurança para DevOps e Infraestrutura

## Pipelines de CI/CD
- O pipeline de integração contínua deve executar automaticamente:
  1. Análise estática e linter.
  2. Suíte de testes automatizados com bloqueio em caso de falha.
  3. Checagem de vulnerabilidades em dependências (Snyk, Trivy, npm audit, pip-audit).
  4. Build dos artefatos em ambiente limpo.
- Segredos de CI/CD devem ser injetados exclusivamente pelas variáveis seguras da plataforma e nunca impressos em logs de execução.

## Imagens de Container (Docker)
- Utilize imagens base mínimas e oficiais (ex.: Alpine ou Distroless).
- Execute sempre a aplicação sob um usuário sem privilégios de root (`USER appuser`).
- Utilize multi-stage build para que ferramentas de compilação não fiquem na imagem final de produção.
- NUNCA copie diretórios `.git`, arquivos `.env`, certificados ou chaves SSH para dentro das imagens.
