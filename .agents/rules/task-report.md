# Rule: Relatório Obrigatório de Conclusão de Tarefa (Task Report)

Toda tarefa concluída deve gerar um relatório formal em `docs/tasks/YYYY-MM-DD-[feature].md` antes de ser considerada concluída.

## Conteúdo Obrigatório do Relatório
1. **Resumo da Entrega**: O que foi implementado e problema resolvido.
2. **Arquivos Afetados**: Lista de arquivos criados, alterados ou removidos com justificativa.
3. **Métricas de Contexto e Graphify**:
   - Consultas realizadas ao Graphify (`/graphify query`, `path`, `explain`).
   - Quantidade de nós acessados vs arquivos lidos.
   - Estimativa de tokens economizados em comparação à leitura completa do projeto.
4. **Verificação e Testes**:
   - Resultado da execução de testes unitários e de integração.
   - Resultado do linter e checagem de tipos.
   - Validação do build.
5. **Auditoria de Segurança**:
   - Verificação de que nenhum segredo foi commitado.
   - Riscos remanescentes e próximos passos.
