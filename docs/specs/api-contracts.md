# Sistema de Gestão de Leitos — api-contracts.md

## Padrão Geral dos Endpoints
- Base URL: `/api/v1`
- Content-Type: `application/json; charset=utf-8`
- Padrão de Erro: RFC 7807 (Problem Details)

```json
{
  "type": "https://api.hospital.com/errors/conflito-alocacao",
  "title": "Conflito na alocação de leito",
  "status": 409,
  "detail": "O leito informado já foi alocado por outro operador.",
  "instance": "/api/v1/leitos/102/alocar",
  "correlationId": "8f3b2a1c-99d2-4a7b-8c11-1234567890ab"
}
```

## Endpoints Principais

### 1. Listagem de Leitos
- **GET** `/api/v1/leitos`
- **Query Params**: `unidadeId`, `tipo`, `status`, `page` (default 1), `limit` (default 20, max 100)
- **Response 200 OK**: Lista paginada de leitos com total de registros e metadados de paginação.

### 2. Detalhes de um Leito
- **GET** `/api/v1/leitos/{id}`
- **Response 200 OK**: Detalhes completos do leito e histórico recente de transições.
- **Response 404 Not Found**: Leito não encontrado.

### 3. Alocação / Reserva de Leito
- **POST** `/api/v1/leitos/{id}/alocar`
- **Headers**: `If-Match: "{versaoConcorrencia}"`
- **Payload**:
  ```json
  {
    "pacienteId": "uuid-do-paciente",
    "solicitacaoVagaId": "uuid-da-solicitacao",
    "observacoes": "Necessidade de oxigenioterapia contínua"
  }
  ```
- **Response 200 OK**: Dados atualizados do leito com novo status `OCUPADO`.
- **Response 409 Conflict**: Leito já reservado ou versão de concorrência incompatível.

### 4. Solicitação de Liberação para Limpeza
- **POST** `/api/v1/leitos/{id}/desocupar`
- **Response 200 OK**: Status alterado para `AGUARDANDO_LIMPEZA`. Notificação enviada para a equipe de higienização.

### 5. Conclusão de Higienização
- **POST** `/api/v1/leitos/{id}/liberar`
- **Payload**:
  ```json
  {
    "tipoLimpeza": "TERMINAL",
    "higienizadorId": "uuid-do-responsavel"
  }
  ```
- **Response 200 OK**: Status alterado para `LIVRE`.
