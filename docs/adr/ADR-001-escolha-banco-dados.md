# ADR-001: Escolha do Banco de Dados Relacional com Suporte ACID

## Status
Aprovado

## Contexto
O sistema de gestão de leitos requer controle rigoroso de concorrência e integridade transacional na reserva e ocupação de vagas. Condições de corrida onde dois pacientes são alocados no mesmo leito simultaneamente configuram falha clínica crítica.

## Decisão
Adotar banco de dados relacional com conformidade ACID completa (PostgreSQL / MySQL) com controle de concorrência otimista (`versaoConcorrencia`) e isolamento transacional `READ COMMITTED` ou superior.

## Consequências
- **Positivas**: Garantia de integridade referencial, bloqueio de alocação duplicada, facilidade de auditoria e consistência forte.
- **Atenções**: Necessidade de migrations controladas (Flyway, Alembic, Prisma) com plano de reversão.
