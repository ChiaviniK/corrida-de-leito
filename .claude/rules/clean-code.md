# Rule: Regras Universais de Clean Code

## Clareza e Expressividade
- Nomes de variáveis, funções e classes devem revelar intenção de negócio de maneira inequívoca.
- Evite nomes genéricos (`data`, `temp`, `manager`, `helper`, `process`).
- Código limpo lê como prosa; comentários devem explicar o "porquê" de decisões complexas, nunca o "o que" o código está fazendo.

## Tamanho e Complexidade
- Funções devem ser pequenas e fazer apenas uma coisa (Single Responsibility).
- Mantenha funções preferencialmente com menos de 25-30 linhas.
- Reduza aninhamento de blocos lógicos; utilize cláusulas de guarda (early return) para evitar if/else profundamente aninhados.

## Tratamento de Erros
- NUNCA silencie exceções com blocos `catch` vazios.
- Trate erros no nível adequado ou encapsule em exceções de domínio expressivas.
- Não utilize códigos de erro mágicos numéricos; utilize tipos ou enums bem definidos.

## Simplicidade e Duplicação (DRY com Parcimônia)
- Evite abstrações prematuras. Três repetições similares justificam uma abstração (Rule of Three), não uma repetição isolada.
- Prefira código simples e direto em vez de soluções excessivamente sofisticadas (KISS - Keep It Simple, Stupid).
