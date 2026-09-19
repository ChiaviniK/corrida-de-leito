# Sistema de Gestão de Leitos — security.md

## Modelo de Ameaças e Controles
- **IDOR / BOLA**: Impedir que usuários visualizem ou alterem leitos/pacientes de outras unidades sem permissão. Todas as queries devem filtrar por unidade/tenant autorizado.
- **Acesso Não Autorizado**: Autenticação via JWT com tempo de expiração curto (15m) e rotação de refresh token em cookies `HttpOnly`, `Secure` e `SameSite=Strict`.
- **Concorrência Conflitante**: Uso de Optimistic Locking na entidade `Leito` para evitar condições de corrida (race conditions) em que dois operadores alocam a mesma vaga simultaneamente.
- **Injeção de Dados**: Validação integral de payloads com DTOs tipados e uso exclusivo de queries parametrizadas (ORM).

## Matriz de Perfis (RBAC)
| Perfil | Ver Leitos | Reservar/Alocar | Liberar Limpeza | Solicitar Vaga | Bloquear Leito |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Regulador | Sim | Sim | Não | Sim | Sim |
| Enfermeiro | Sim | Sim (da sua ala) | Sim | Não | Não |
| Higienização | Sim | Não | Sim | Não | Não |
| Médico | Sim | Não | Não | Sim | Não |
| Administrador| Sim | Sim | Sim | Sim | Sim |

## Diretrizes de Auditoria e Logs
- Toda alteração de status em leito registra: `usuarioId`, `leitoId`, `statusAnterior`, `novoStatus`, `ipOrigem`, `timestamp`.
- Logs nunca devem incluir nomes completos de pacientes ou CPFs nos campos de mensagem padrão.
