---
name: dependency-audit
description: Auditoria e inspeção de dependências externas contra vulnerabilidades conhecidas e problemas de licença.
---

# Skill: Auditoria de Dependências de Terceiros

## Passos
1. Execute scanners de segurança dependendo do ecossistema:
   - Node: `npm audit` / `pnpm audit`
   - Python: `pip-audit` / `safety check`
   - Java: `mvn dependency-check:check`
   - .NET: `dotnet list package --vulnerable`
2. Valide se há pacotes obsoletos ou com CVEs críticos.
3. Se houver vulnerabilidades, avalie se há versão corrigida compatível e atualize os lockfiles.
