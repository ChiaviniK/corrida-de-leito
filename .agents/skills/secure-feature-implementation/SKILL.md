---
name: secure-feature-implementation
description: Fluxo guiado para implementar novas features cobrindo backend, frontend, persistência e validações com segurança em profundidade.
---

# Skill: Implementação Segura de Funcionalidades

## Passos do Fluxo
1. **Contexto**: Ler especificações em `docs/specs/` e consultar o grafo via Graphify.
2. **Dados Sensíveis**: Mapear se a feature lida com dados pessoais (LGPD/PII) ou credenciais.
3. **Contratos**: Definir contratos de entrada e saída (DTOs e Schemas) com validações explícitas.
4. **Autorização**: Definir matriz de permissões (quem pode executar a operação).
5. **Backend**: Implementar use case, repository e controller, com tratamento padronizado de erro e logging seguro.
6. **Frontend**: Implementar interface, componentes acessíveis e feedback de validação.
7. **Testes**: Criar testes unitários e de integração cobrindo casos normais e extremos.
8. **Revisão**: Acionar subagente `security-reviewer` e `code-reviewer`.
9. **Finalização**: Atualizar especificações em `docs/specs/` e emitir relatório de tarefa.
