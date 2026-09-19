# Rule: Validação de Entrada, Sanitização e Encoding

## Validação no Backend
- Todo dado recebido externamente (HTTP body, query params, headers, webhooks, filas) deve ser validado por DTOs ou Schemas rígidos (Zod, Pydantic, Bean Validation, FluentValidation).
- Rejeite campos desconhecidos ou extras (strip unknown / reject unexpected keys).
- Imponha restrições rigorosas de tipo, formato, comprimento mínimo/máximo e regex específico.

## Validação no Frontend
- Formulários devem fornecer validação imediata e mensagens de erro amigáveis para orientar o usuário.
- A validação frontend serve apenas para experiência do usuário (UX) e não substitui a validação de segurança no backend.

## Sanitização e Encoding
- Escape dados antes de exibi-los em interfaces web para neutralizar ataques XSS.
- Para arquivos recebidos via upload: valide o MIME type real pelo magic number (não confie apenas na extensão), defina tamanho máximo e renomeie o arquivo com nome gerado pelo sistema.
