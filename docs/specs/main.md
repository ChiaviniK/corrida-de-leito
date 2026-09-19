# Sistema de Gestão de Leitos — main.md

## Visão
Sistema universal e resiliente para monitoramento, regulação e alocação em tempo real de leitos hospitalares (clínicos, cirúrgicos, UTI e isolamento), garantindo agilidade na transferência de pacientes, rastreabilidade e interoperabilidade.

## Problema
Gargalos no processo de internação hospitalar causados por falta de visibilidade em tempo real da ocupação de leitos, processos manuais de regulação, demora na liberação de leitos após alta/higienização e riscos de alocação inadequada de pacientes com isolamento ou suporte crítico.

## Usuários Principais
- **Central de Regulação de Vagas**: Regula e autoriza transferências e reservas de leitos com base em critérios clínicos.
- **Equipe de Enfermagem / Recepção**: Atualiza o status físico e clínico dos leitos (ocupado, desocupado, aguardando limpeza).
- **Equipe de Higienização e Manutenção**: Recebe chamados de preparo do leito e sinaliza liberação para nova admissão.
- **Corpo Clínico (Médicos/Especialistas)**: Solicita vaga com classificação de gravidade e necessidade de suporte.
- **Gestão Hospitalar / Auditoria**: Acompanha taxa de ocupação, tempo médio de permanência e conformidade regulatória.

## Métricas de Sucesso
- Disponibilidade do sistema: 99,9%
- Tempo de resposta p95: < 300 ms em consultas de leitos
- Taxa de erro de requisições: < 0,5%
- Cobertura mínima de testes: 85%
- Redução no tempo médio de giro de leito (limpeza -> ocupação)

## Escopo Inicial
- Autenticação e autorização por perfil (RBAC: Médico, Enfermeiro, Regulador, Administrador, Higienização).
- Cadastro e categorização de leitos (Unidade, Quarto, Tipo: UTI Adulto/Neo/Pediátrica, Enfermaria, Isolamento).
- Máquina de estados do leito: `LIVRE` -> `RESERVADO` -> `OCUPADO` -> `DESOCUPADO_AGUARDANDO_LIMPEZA` -> `EM_HIGIENIZACAO` -> `BLOQUEADO_MANUTENCAO`.
- **Corrida de Leito Multiprofissional**: Registro à beira-leito de sinais vitais, checagem de dispositivos invasivos (acessos, sondas, drenos), exame de integridade da pele (LPP) e alinhamento de condutas.
- **Ditado e Transcrição por Voz em Tempo Real (pt-BR)**: Captura de voz e extração de parâmetros clínicos através de heurística clínica.
- **Passagem de Plantão SBAR**: Transmissão estruturada de turno (Situação, Background, Avaliação e Recomendações).
- **Exportação Consolidada de Prontuários**: Geração e download em 1 clique de prontuário em PDF clínico, JSON estruturado e resumo SBAR.
- Dashboard de ocupação em tempo real e relatórios de auditoria.

## Não-Escopo Inicial
- Faturamento SUS/TISS avançado.
- Integração nativa com equipamentos de UTI (monitores cardíacos).

## Restrições
- LGPD (dados de pacientes protegidos, minimizados e auditáveis).
- Resiliência operacional: funcionamento contínuo 24x7 com tolerância a falhas transitórias.
