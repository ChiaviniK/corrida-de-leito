# Rule: Segurança de Bibliotecas e Dependências

## Antes de Adicionar Qualquer Biblioteca
- Verifique se a funcionalidade desejada já existe nativamente no runtime ou em pacotes já instalados.
- Avalie o volume de downloads, manutenção ativa, frequência de atualizações, licença comercial e reputação do pacote.
- Prefira bibliotecas focadas, enxutas e estáveis; evite pacotes com dependências transitivas massivas.
- Proibido usar dependências sem testes, abandonadas ou com vulnerabilidades críticas conhecidas.

## Versionamento e Lockfiles
- Utilize sempre arquivo de lock versionado (`package-lock.json`, `pnpm-lock.yaml`, `uv.lock`, `poetry.lock` ou equivalente).
- Proibido utilizar versões flutuantes ou instáveis (`*`, `latest`, snapshots).
- Ao atualizar dependências, execute obrigatoriamente a suíte de testes e o scanner de segurança.

## Segurança de Supply Chain
- Proibido instalar pacotes de registros não oficiais ou desconhecidos.
- Valide o nome do pacote contra riscos de typosquatting.
- Desabilite ou audite rigorosamente scripts de post-install.
