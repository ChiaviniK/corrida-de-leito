# Sistema de Gestão de Leitos — domain.md

## Linguagem Ubíqua
- **Leito**: Unidade de acomodação hospitalar individualizada (código, ala, quarto, tipo, status).
- **Ala / Unidade**: Setor hospitalar (ex.: UTI Geral, Bloco Cirúrgico, Maternidade, Pediatria).
- **Paciente**: Indivíduo admitido ou em triagem para internação.
- **Solicitação de Vaga**: Requisição médica indicando diagnóstico, necessidade de isolamento e gravidade clínica.
- **Regulação**: Ação médica de avaliar criticidade e direcionar paciente para o leito mais apropriado.
- **Higienização**: Procedimento de limpeza terminal obrigatório entre a desocupação e a disponibilização do leito.

## Entidades e Invariantes

### Entidade: Leito
- **Atributos**: `id`, `codigoIdentificador`, `unidadeId`, `tipoLeito` (UTI, CLINICO, CIRURGICO, ISOLAMENTO), `status` (LIVRE, RESERVADO, OCUPADO, AGUARDANDO_LIMPEZA, EM_HIGIENIZACAO, BLOQUEADO), `versaoConcorrencia`, `createdAt`, `updatedAt`.
- **Invariantes**:
  - Um leito `OCUPADO` não pode ser alocado para outro paciente.
  - Apenas leitos com status `LIVRE` podem transitar para `RESERVADO` ou `OCUPADO`.
  - Ao desocupar (`OCUPADO` -> `AGUARDANDO_LIMPEZA`), o leito deve obrigatoriamente passar por higienização antes de voltar a ser `LIVRE`.
  - Bloqueio por manutenção só pode ocorrer se o leito não estiver `OCUPADO`.

### Entidade: SolicitacaoVaga
- **Atributos**: `id`, `pacienteId`, `medicoSolicitanteId`, `prioridadeClinica` (EMERGENCIA, URGENCIA, ELETIVO), `tipoLeitoRequerido`, `status` (PENDENTE, ATENDIDA, CANCELADA), `dataSolicitacao`.

## Políticas de Dados e Privacidade
- Dados clínicos e pessoais de pacientes são classificados como dados sensíveis (LGPD).
- Minimização em telas operacionais: exibir apenas iniciais ou prontuário em dashboards públicos da unidade.
- Trilha de auditoria obrigatória para qualquer alteração de status de leito ou visualização de prontuário.
