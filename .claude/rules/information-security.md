# Rule: Segurança da Informação e Privacidade

## Classificação e Minimização de Dados
- Classifique os dados tratados: públicos, internos, confidenciais ou sensíveis (PII).
- Colete e retenha estritamente os dados necessários para o cumprimento da funcionalidade (princípio da minimização).
- Aplique pseudonimização ou mascaramento em dados pessoais quando exibidos ou processados em ambientes secundários.

## Logs Seguros
- PROIBIDO logar senhas, tokens de autorização, chaves de API, números de cartão, dados de documentos pessoais ou payloads confidenciais.
- Use `correlationId` ou `requestId` em todos os registros de log para rastreamento ponta a ponta sem expor o titular.

## Criptografia e Armazenamento
- HTTPS/TLS obrigatório em trânsito.
- Senhas devem ser armazenadas utilizando algoritmos de hashing modernos com salt automático (Argon2id, bcrypt ou PBKDF2).
- NUNCA desenvolva soluções criptográficas proprietárias; utilize bibliotecas auditadas pelo setor.
