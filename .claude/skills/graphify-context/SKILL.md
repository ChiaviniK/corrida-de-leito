---
name: graphify-context
description: Use para obter contexto preciso do codebase com custo mínimo de tokens. Consulta o grafo de conhecimento antes de ler arquivos individualmente.
---

# Skill: Consulta de Contexto via Graphify

## Quando Usar
- Início de qualquer sessão de trabalho agêntico.
- Fase RESEARCH antes de implementar qualquer funcionalidade.
- Análise de impacto de uma mudança em outros módulos.
- Onboarding em partes desconhecidas do código.

## Passos de Execução
1. Verificar se `graphify-out/graph.json` existe. Se não existir, executar `/graphify .` para indexar o projeto.
2. `/graphify query "[contexto da tarefa]"` — Executa busca em largura (BFS) para contexto amplo.
3. `/graphify path "ComponenteA" "ComponenteB"` — Mapeia cadeia de dependências entre dois conceitos.
4. `/graphify explain "NomeDoModulo"` — Gera explicação focada de um nó específico.
5. Ler apenas os arquivos e nós diretamente apontados pelo subgrafo gerado.

## Após Implementação
Execute `/graphify . --update --no-viz` para sincronizar o grafo com as novas alterações de código sem custo de LLM.
