# Rule: Diretrizes de Segurança e Integridade para Banco de Dados

## Consultas e Acesso aos Dados
- Toda instrução SQL deve ser parametrizada; proíba concatenação dinâmica de strings.
- Sempre restrinja o escopo da consulta pelo `tenant_id` ou identificador do usuário em ambientes multitenant.

## Migrações de Esquema (Migrations)
- Toda migration deve possuir uma estratégia e script de rollback correspondente.
- Mudanças estruturais destrutivas (renomear colunas, remover tabelas) devem seguir a abordagem em duas fases (Expand and Contract).
- Ao adicionar colunas `NOT NULL` a tabelas populosas, forneça um valor default seguro ou execute preenchimento gradual (backfill).
- NUNCA execute migrações em ambientes produtivos sem aprovação formal e janela de manutenção planejada.

## Princípio do Menor Privilégio
- O usuário do banco utilizado pela aplicação em tempo de execução deve ter apenas privilégios DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- Privilégios de DDL (`CREATE`, `ALTER`, `DROP`) devem ser restritos à ferramenta de migração (Flyway, Alembic, Prisma, EF Migrations).
