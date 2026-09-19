param(
    [string]$Command
)

$DangerousPatterns = @(
    "rm\s+-rf",
    "chmod\s+777",
    "curl.*\|\s*bash",
    "wget.*\|\s*sh",
    "git\s+push.*--force",
    "docker\s+system\s+prune\s+-a",
    "DROP\s+DATABASE",
    "TRUNCATE",
    "DELETE\s+FROM\s+[a-zA-Z_]+\s*;",
    "--no-verify"
)

foreach ($pattern in $DangerousPatterns) {
    if ($Command -match $pattern) {
        Write-Error '{"decision":"block","reason":"Comando perigoso bloqueado pelo hook de segurança no Windows PowerShell."}'
        exit 2
    }
}

if ($Command -match "(prod|production|prd)" -and $Command -match "(migration|migrate|alembic upgrade|flyway:migrate|database update|prisma migrate deploy)") {
    Write-Error '{"decision":"block","reason":"Migration em produção bloqueada. Use runbook e aprovação humana."}'
    exit 2
}

exit 0
