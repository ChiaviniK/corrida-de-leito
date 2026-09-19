# Rule: Autorização Segura e Controle de Acesso

## Validação no Backend
- Todo endpoint privado deve validar a identidade do chamador e as permissões requeridas (RBAC / ABAC).
- NUNCA delegue a responsabilidade de autorização exclusivamente ao frontend.
- O controle de acesso visual (ocultar botões na tela) é apenas usabilidade; o backend deve sempre recusar requisições não autorizadas com HTTP 403 Forbidden.

## Prevenção contra IDOR / BOLA
- Proibido carregar entidades ou recursos diretamente pelo ID informado na requisição sem verificar se pertencem ao usuário autenticado ou ao seu tenant.
- Consultas a banco de dados devem sempre incluir filtros de escopo: `WHERE id = :id AND tenant_id = :tenantId`.
- Evite identificadores puramente sequenciais para entidades públicas; utilize UUIDs ou CUIDs quando apropriado.

## Trilha de Auditoria
- Operações que alteram papéis de acesso, dados sensíveis ou privilégios administrativos devem emitir eventos de log de auditoria estruturados.
