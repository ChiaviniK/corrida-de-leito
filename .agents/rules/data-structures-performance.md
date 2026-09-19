# Rule: Estruturas de Dados, Performance e Complexidade Computacional

## Complexidade Big-O e Eficiência
- Avalie a complexidade de tempo e espaço de operações críticas. Evite algoritmos \(O(n^2)\) ou piores em caminhos de execução frequentes.
- Substitua buscas sequenciais em listas \(O(n)\) por tabelas hash / sets / maps \(O(1)\) ao verificar existência ou associar chaves.
- Elimine loops aninhados desnecessários.

## Banco de Dados e Consultas
- NUNCA execute consultas SQL dentro de iterações/loops (prevenção ao problema N+1). Utilize batch fetching, `IN (...)` ou `JOIN`.
- Crie índices adequados para colunas utilizadas frequentemente em cláusulas `WHERE`, `ORDER BY` ou chaves estrangeiras.
- Toda consulta que retorna coleções deve ser estritamente paginada no banco.

## Filas e Processamento Assíncrono
- Mova processamentos demorados (envio de e-mails, processamento de imagens/PDFs, relatórios) para workers assíncronos e filas.
- Garanta idempotência no processamento de mensagens em filas para permitir retentativas seguras.

## Cache e Memória
- Aplique cache (Redis / in-memory) com tempo de expiração explícito (TTL) e estratégia clara de invalidação.
- Em estruturas hierárquicas (árvores e grafos), imponha limites máximos de profundidade e controle contra ciclos.
