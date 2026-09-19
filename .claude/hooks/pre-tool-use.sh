#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS='(rm -rf|chmod 777|curl .*\| bash|wget .*\| sh|git push --force|docker system prune -a|DROP DATABASE|TRUNCATE|DELETE FROM [a-zA-Z_]+;|--no-verify)'

if echo "$CMD" | grep -Eiq "$DANGEROUS"; then
  echo '{"decision":"block","reason":"Comando perigoso bloqueado pelo hook de segurança."}' >&2
  exit 2
fi

PRODUCTION='(prod|production|prd)'
MIGRATION='(migration|migrate|alembic upgrade|flyway:migrate|database update|prisma migrate deploy)'

if echo "$CMD" | grep -Eiq "$PRODUCTION" && echo "$CMD" | grep -Eiq "$MIGRATION"; then
  echo '{"decision":"block","reason":"Migration em produção bloqueada. Use runbook e aprovação humana."}' >&2
  exit 2
fi

exit 0
