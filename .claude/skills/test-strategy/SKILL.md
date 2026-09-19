---
name: test-strategy
description: Elaboração de plano de testes automatizados e análise de cobertura de código.
---

# Skill: Estratégia de Testes

## Passos
1. **Definição da Pirâmide**:
   - 70% Testes Unitários: Regras de negócio puras, funções utilitárias e componentes isolados.
   - 20% Testes de Integração: Use cases, endpoints de API e comunicação com banco de dados em container de teste.
   - 10% Testes E2E: Fluxos de ponta a ponta que atravessam a aplicação.
2. **Identificação de Cenários Extremos**:
   - Entradas limítrofes (valores negativos, zero, strings com caracteres especiais).
   - Simulação de erros de rede e indisponibilidade de serviços externos (mocks/stubs).
   - Validação de idempotência e concorrência.
3. **Métricas**: Garantir que a cobertura mínima estabelecida em `docs/specs/quality.md` seja satisfeita.
