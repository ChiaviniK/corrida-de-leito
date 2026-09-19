---
name: db-migration-safe
description: Guia de boas práticas e checklist para criação e aplicação segura de migrações de banco de dados.
---

# Skill: Migrações Seguras de Banco de Dados

## Regras Obrigatórias
1. **Rollback**: Toda migration de schema deve vir acompanhada do respectivo script de reversão funcional.
2. **Não Bloqueante**: Evite locks exclusivos prolongados em tabelas de grande volume.
3. **Colunas Not Null**: Adicionar colunas `NOT NULL` exige estratégia de default ou preenchimento prévio em tabela populada.
4. **Estratégia Expand and Contract**: Para renomear campos ou mudar tipos, primeiro crie o novo campo, migre dados, redirecione a aplicação e só depois exclua o campo antigo.
5. **Ambientes**: Nunca execute migrações em produção sem aprovação humana e backup confirmado.
