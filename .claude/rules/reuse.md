# Rule: Diretrizes de Reaproveitamento de Código e Componentes

## Quando Reaproveitar
- Regras de negócio puras e invariantes de domínio que se repetem.
- Componentes visuais atômicos de interface (botões, inputs, modais, cards, badges) que pertencem ao design system compartilhado.
- Utilitários matemáticos, formatadores de dados e validadores genéricos.
- Contratos de API, tipos e DTOs compartilhados entre cliente e servidor (em monorepos).

## Quando NÃO Reaproveitar (Evitar Acoplamento Prematuro)
- Quando duas partes do código se parecem apenas superficialmente, mas mudam por razões de negócio totalmente distintas.
- Quando o reaproveitamento exigir adicionar múltiplos parâmetros condicionais (`if (isSpecialCase)`) a uma função outrora simples.
- Quando criar uma dependência cruzada entre módulos que deveriam ser autônomos e desacoplados.

## Frontend
- Isole componentes visuais reutilizáveis em pacotes ou pastas dedicadas (`components/ui/`).
- Mantenha componentes de UI desacoplados de chamadas de API diretas.
