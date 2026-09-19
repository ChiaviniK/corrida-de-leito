# Sistema de Gestão de Leitos — quality.md

## Padrões de Qualidade de Código
- **Cobertura Mínima de Testes**: 85% para camada de domínio e regras de negócio (`Use Cases`), 80% global.
- **Complexidade Ciclomática**: Máximo de 10 por função ou método.
- **Tamanho de Funções**: Preferencialmente até 30 linhas de código útil.
- **Linter & Formatação**: Zero warnings tolerados no pipeline de CI/CD.

## Pirâmide de Testes Obrigatória
1. **Testes Unitários**:
   - Transições de estado da máquina de leitos (rejeitar transições ilegais).
   - Invariantes de concorrência e cálculo de prioridade na regulação de vagas.
2. **Testes de Integração**:
   - Operações de banco com concorrência real simulada (threads paralelas tentando alocar o mesmo leito).
   - Contratos HTTP retornando os status codes e schemas esperados.
3. **Testes de Acessibilidade**:
   - Auditoria com ferramentas estáticas (`axe-core`) e validação de contraste e teclado nas telas de enfermagem.

## Critério de Aceite para Pull Requests
- [ ] Nenhum segredo commitado.
- [ ] Todos os testes passando sem erros.
- [ ] Lint e verificação de tipos aprovados.
- [ ] Relatório de tarefa em `docs/tasks/` gerado.
