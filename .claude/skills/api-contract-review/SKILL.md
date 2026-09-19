---
name: api-contract-review
description: Revisão e validação de contratos de API HTTP/REST contra padrões do projeto e RFC 7807.
---

# Skill: Revisão de Contratos de API

## Checklist de Contrato
1. **Padrão de URL**: Substantivos no plural (`/api/v1/leitos`, `/api/v1/pacientes`).
2. **Métodos HTTP**: Semântica estrita (`GET` para leitura, `POST` para criação, `PUT` para substituição total, `PATCH` para atualização parcial, `DELETE` para exclusão).
3. **Códigos de Status**:
   - `200 OK`: Sucesso com corpo.
   - `201 Created`: Criação com header `Location`.
   - `204 No Content`: Sucesso sem corpo (ex.: delete).
   - `400 Bad Request`: Erro de validação de entrada.
   - `401 Unauthorized`: Chamador não autenticado.
   - `403 Forbidden`: Chamador autenticado sem permissão para o recurso.
   - `404 Not Found`: Recurso não localizado.
   - `409 Conflict`: Violação de regra de negócio ou unicidade.
   - `422 Unprocessable Entity`: Erro semântico na validação.
   - `500 Internal Server Error`: Erro inesperado do servidor.
4. **Formato de Erro**: Implementar Problem Details (RFC 7807) padronizado.
