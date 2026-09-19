import React, { useState, useEffect } from 'react';
import { 
  X, Download, Printer, Copy, Check, FileText, Calendar, 
  User, Activity, Droplets, Stethoscope, AlertTriangle, Shield 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';

export default function PatientReportModal({ paciente, leito, onClose }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      if (!paciente?.id) return;
      try {
        const data = await api.getPatientSummary(paciente.id);
        if (data) {
          setReportData(data);
        } else {
          // Fallback se a API não retornar
          const corridas = await api.getCorridasPorPaciente(paciente.id);
          setReportData({
            paciente: {
              ...paciente,
              leito_atual: leito?.codigo || '-',
              unidade: leito?.unidade || '-'
            },
            total_visitas: corridas.length,
            historico_corridas: corridas.map(r => ({
              id: r.id,
              data_hora: r.data_hora,
              responsavel: `${r.responsavel_nome} (${r.responsavel_cargo})`,
              sinais_vitais: {
                pa: r.pa_sistolica ? `${r.pa_sistolica}x${r.pa_diastolica} mmHg` : '-',
                fc: r.fc ? `${r.fc} bpm` : '-',
                fr: r.fr ? `${r.fr} irpm` : '-',
                temp: r.temp ? `${r.temp}°C` : '-',
                sato2: r.sato2 ? `${r.sato2}%` : '-',
                suporte_o2: r.suporte_o2,
                glicemia: r.glicemia ? `${r.glicemia} mg/dL` : '-',
                nivel_consciencia: r.nivel_consciencia,
                escala_dor: r.escala_dor
              },
              dispositivos: {
                acesso_venoso: r.acesso_venoso,
                acesso_aspecto: r.acesso_venoso_aspecto,
                sonda_alimentar: r.sonda_alimentar,
                sonda_vesical: r.sonda_vesical,
                debito_urinario: r.debito_urinario_aspecto,
                drenos: r.drenos_descricao,
                infusoes: r.infusoes_ativas
              },
              pele_exame: {
                lesao_pressao: r.lesao_pressao ? "Sim" : "Não",
                lesao_detalhe: r.lesao_pressao_detalhe,
                curativos: r.curativos_ativos,
                evolucao: r.evolucao_clinica
              },
              condutas_metas: {
                medica: r.conduta_medica,
                enfermagem: r.conduta_enfermagem,
                fisioterapia: r.conduta_fisioterapia,
                nutricao: r.conduta_nutricao,
                exames_pendentes: r.exames_pendentes,
                previsao_alta: r.previsao_alta
              },
              transcricao_voz: r.transcricao_voz_bruta
            }))
          });
        }
      } catch (err) {
        console.error('Erro ao carregar prontuário:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [paciente, leito]);

  // Geração de PDF nativo pelo jsPDF
  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const p = reportData.paciente;

    // Cabeçalho Hospitalar
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("PRONTUÁRIO CONSOLIDADO — CORRIDA DE LEITO", 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hospital Geral • Unidade: ${p.unidade} | Leito: ${p.leito_atual} • Emissão: ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    // Dados do Paciente
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("1. Identificação do Paciente", 14, 38);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${p.nome}`, 14, 46);
    doc.text(`Prontuário: ${p.prontuario}    Idade: ${p.idade || '-'} anos    Gênero: ${p.genero || '-'}`, 14, 52);
    doc.text(`Diagnóstico: ${p.diagnostico_principal || 'Em investigação'}`, 14, 58);
    doc.text(`Alergias: ${p.alergias || 'Nega'}    Precaução: ${p.precaucao || 'Padrão'}`, 14, 64);

    let y = 76;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`2. Histórico de Visitas / Corridas (${reportData.total_visitas} registradas)`, 14, y);
    y += 8;

    reportData.historico_corridas.forEach((reg, i) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const dataStr = new Date(reg.data_hora).toLocaleString('pt-BR');
      doc.text(`Visita #${i + 1} — ${dataStr} | Responsável: ${reg.responsavel}`, 16, y + 5);
      y += 12;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const sv = reg.sinais_vitais;
      doc.text(`• Sinais Vitais: PA ${sv.pa} | FC ${sv.fc} | FR ${sv.fr} | Temp ${sv.temp} | SatO2 ${sv.sato2} (${sv.suporte_o2}) | Glicemia: ${sv.glicemia}`, 16, y);
      y += 6;

      const d = reg.dispositivos;
      doc.text(`• Dispositivos: Acesso: ${d.acesso_venoso} | Sonda: ${d.sonda_alimentar} | SVD: ${d.sonda_vesical} | Drenos: ${d.drenos}`, 16, y);
      y += 6;

      const c = reg.condutas_metas;
      doc.text(`• Conduta Médica: ${c.medica || 'Manter condutas prévias'}`, 16, y);
      y += 6;
      doc.text(`• Enfermagem: ${c.enfermagem || '-'} | Fisio: ${c.fisioterapia || '-'} | Nutrição: ${c.nutricao || '-'}`, 16, y);
      y += 6;

      if (c.exames_pendentes) {
        doc.text(`• Exames Solicitados: ${c.exames_pendentes} | Previsão Alta: ${c.previsao_alta}`, 16, y);
        y += 6;
      }

      if (reg.transcricao_voz) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105);
        doc.text(`  Transcrição da fala: "${reg.transcricao_voz}"`, 16, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        y += 6;
      }

      y += 6; // espaço entre visitas
    });

    doc.save(`prontuario_corrida_leito_${p.prontuario}.pdf`);
  };

  const exportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registros_paciente_${reportData.paciente.prontuario}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummaryText = () => {
    if (!reportData) return;
    const p = reportData.paciente;
    let txt = `*CORRIDA DE LEITO — ${p.nome} (${p.prontuario})*\nLeito: ${p.leito_atual} • Unidade: ${p.unidade}\nDiagnóstico: ${p.diagnostico_principal}\n\n`;

    reportData.historico_corridas.forEach((r, idx) => {
      txt += `*Visita ${idx + 1} (${new Date(r.data_hora).toLocaleDateString('pt-BR')})*: PA ${r.sinais_vitais.pa}, Sat ${r.sinais_vitais.sato2}, FC ${r.sinais_vitais.fc}. Conduta: ${r.condutas_metas.medica || '-'}\n`;
    });

    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Prontuário & Arquivo de Registros do Paciente
              </h3>
              <p className="text-xs text-slate-400">
                Histórico consolidado de todas as corridas de leito e planos terapêuticos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar de Ações de Exportação */}
        <div className="p-3.5 bg-sky-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-900 dark:text-sky-300">
            <span>Exportar Registro Clínico:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Prontuário em PDF
            </button>

            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Arquivo JSON
            </button>

            <button
              onClick={copySummaryText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Resumo'}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 print:p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Carregando histórico do paciente...
            </div>
          ) : !reportData ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhum dado encontrado.
            </div>
          ) : (
            <>
              {/* Card de Identificação */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 rounded">
                      LEITO: {reportData.paciente.leito_atual} • {reportData.paciente.unidade}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {reportData.paciente.nome}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Prontuário: <strong>{reportData.paciente.prontuario}</strong> • {reportData.paciente.idade} anos • Gênero: {reportData.paciente.genero}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Total de Visitas Registradas:</span>
                    <span className="text-2xl font-black text-sky-600">{reportData.total_visitas}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Diagnóstico Principal:</strong>{' '}
                    <span className="text-slate-600 dark:text-slate-400">{reportData.paciente.diagnostico_principal}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Alergias:</strong>{' '}
                    <span className="text-rose-600 dark:text-rose-400 font-medium">{reportData.paciente.alergias}</span>
                  </div>
                </div>
              </div>

              {/* Linha do Tempo de Visitas */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  Evolução Clínica & Corridas de Leito Realizadas
                </h4>

                {reportData.historico_corridas.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    Nenhuma corrida de leito registrada para este paciente ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportData.historico_corridas.map((visita, idx) => (
                      <div 
                        key={visita.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {new Date(visita.data_hora).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Registrado por: <strong>{visita.responsavel}</strong>
                          </span>
                        </div>

                        {/* Grade com Sinais e Dispositivos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                            <strong className="text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              1. Sinais Vitais
                            </strong>
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                              <div>PA: <strong>{visita.sinais_vitais.pa}</strong> | FC: <strong>{visita.sinais_vitais.fc}</strong> | FR: {visita.sinais_vitais.fr}</div>
                              <div>Temp: <strong>{visita.sinais_vitais.temp}</strong> | SatO2: <strong>{visita.sinais_vitais.sato2}</strong> ({visita.sinais_vitais.suporte_o2})</div>
                              <div>Glicemia: {visita.sinais_vitais.glicemia} | Consciência: {visita.sinais_vitais.nivel_consciencia}</div>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                            <strong className="text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1.5">
                              <Droplets className="w-3.5 h-3.5" />
                              2. Dispositivos & Pele
                            </strong>
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                              <div>Acesso: <strong>{visita.dispositivos.acesso_venoso}</strong> ({visita.dispositivos.acesso_aspecto})</div>
                              <div>Diurese: {visita.dispositivos.sonda_vesical} ({visita.dispositivos.debito_urinario})</div>
                              <div>LPP: <strong>{visita.pele_exame.lesao_pressao}</strong> ({visita.pele_exame.lesao_detalhe})</div>
                            </div>
                          </div>
                        </div>

                        {/* Condutas e Metas */}
                        <div className="p-3 rounded-lg bg-sky-50/50 dark:bg-slate-900/40 border border-sky-100 dark:border-slate-800 text-xs space-y-1.5">
                          <strong className="text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                            Condutas Multiprofissionais & Metas
                          </strong>
                          <div className="text-slate-700 dark:text-slate-300">
                            <strong>Médica:</strong> {visita.condutas_metas.medica || '-'}
                          </div>
                          {visita.condutas_metas.enfermagem && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <strong>Enfermagem:</strong> {visita.condutas_metas.enfermagem}
                            </div>
                          )}
                          {visita.condutas_metas.exames_pendentes && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <strong>Exames Pendentes:</strong> {visita.condutas_metas.exames_pendentes}
                            </div>
                          )}
                        </div>

                        {/* Transcrição de Áudio se houver */}
                        {visita.transcricao_voz && (
                          <div className="mt-2 text-[11px] text-slate-500 italic">
                            Gravação transcrita: "{visita.transcricao_voz}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
