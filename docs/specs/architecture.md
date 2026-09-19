# Sistema de Gestão de Leitos — architecture.md

## Visão Arquitetural
Monólito Modular ou Arquitetura em Camadas (Clean Architecture) com desacoplamento rigoroso entre domínio, regras de negócio e infraestrutura.

## Estrutura do Workspace
- `apps/api`: Backend da aplicação (Controllers, Middlewares, Dependency Injection, Rotas).
- `apps/web`: Frontend da aplicação (Painéis, Dashboard, Formulários acessíveis, State management).
- `packages/shared`: Modelos de domínio, tipos, contratos de API, DTOs e validações compartilhadas.
- `packages/ui`: Biblioteca de componentes visuais acessíveis e design system.
- Banco de Dados: Relacional com suporte ACID (PostgreSQL / MySQL) para garantir integridade estrita nas alocações de leito.
- Cache e Mensageria: Redis para pub/sub de atualizações em tempo real e cache de disponibilidade.

## Camadas da Aplicação
1. **Domain Layer**: Entidades (`Leito`, `SolicitacaoVaga`, `Paciente`), Value Objects, Invariantes e Eventos de Domínio.
2. **Application / Use Cases**: Casos de uso (`AlocarLeitoUseCase`, `SolicitarVagaUseCase`, `LiberarParaHigienizacaoUseCase`).
3. **Interface / Adapters**: Controllers HTTP, DTOs, Serializadores e Consumers de Fila.
4. **Infrastructure Layer**: Implementação de Repositories via ORM, clientes de mensageria, serviços de e-mail/notificação e logs estruturados.

## Padrões Adotados
- Separação estrita de comando e consulta onde apropriado.
- Idempotência em transições de status de leitos.
- Concorrência otimista (optimistic locking) com versionamento de registro para evitar alocação dupla do mesmo leito.
- Tratamento unificado de erros segundo RFC 7807 (Problem Details).
- Rastreamento com `correlationId` em todos os logs e requisições.

## Registro de Decisões de Arquitetura (ADRs)
- `docs/adr/ADR-001-escolha-banco-dados.md`: Uso de banco relacional com transações ACID.
- `docs/adr/ADR-002-controle-concorrencia.md`: Concorrência otimista na reserva de leitos.
- `docs/adr/ADR-003-autenticacao-jwt-rbac.md`: JWT em cookies seguros com controle baseado em perfis.
