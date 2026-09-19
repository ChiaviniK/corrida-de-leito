---
name: task-report
description: Gera o documento de relatório obrigatório ao fim de cada task. Registra tokens com/sem Graphify, assertividade do grafo, arquivos alterados, testes e riscos.
---

# Skill: Geração de Relatório de Tarefa

## Quando Invocar
Ao concluir qualquer tarefa técnica ou feature — antes de considerar a demanda pronta.

## Passos
1. Coletar métricas da sessão: consultas feitas ao Graphify, nós retornados, arquivos lidos.
2. Calcular estimativa de tokens economizados.
3. Criar arquivo `docs/tasks/YYYY-MM-DD-[nome-da-feature].md` com o template obrigatório:
   - Resumo da entrega
   - Arquivos alterados e motivação
   - Métricas de contexto (com vs sem Graphify)
   - Resultados de testes e checagem estática
   - Riscos remanescentes e decisões tomadas
