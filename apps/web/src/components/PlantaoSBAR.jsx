import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Clock, User, ShieldAlert, Send, Plus, 
  CheckCircle, AlertCircle, Sparkles, BookOpen 
} from 'lucide-react';
import VoiceInput from './VoiceInput';
import { api } from '../services/api';

export default function PlantaoSBAR({ unidadeSelecionada }) {
  const [plantoes, setPlantoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    unidade: unidadeSelecionada || 'UTI Geral',
    turno: 'DIURNO',
    plantonista_passando: 'Dr. André Mendonça',
    plantonista_recebendo: 'Dra. Camila Nogueira',
    situacao_sbar: '',
    background_sbar: '',
    avaliacao_sbar: '',
    recomendacao_sbar: '',
    transcricao_voz_bruta: ''
  });

  const loadPlantoes = async () => {
    setLoading(true);
    try {
      const data = await api.getPlantoes(unidadeSelecionada);
      setPlantoes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlantoes();
  }, [unidadeSelecionada]);

  const handleVoiceTranscription = (text) => {
    setForm(prev => ({
      ...prev,
      transcricao_voz_bruta: text,
      // Se a situação estiver vazia, preenche automaticamente
      situacao_sbar: prev.situacao_sbar || text
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPlantao(form);
      setShowNewModal(false);
      setForm({
        unidade: unidadeSelecionada || 'UTI Geral',
        turno: 'DIURNO',
        plantonista_passando: 'Dr. André Mendonça',
        plantonista_recebendo: 'Dra. Camila Nogueira',
        situacao_sbar: '',
        background_sbar: '',
        avaliacao_sbar: '',
        recomendacao_sbar: '',
        transcricao_voz_bruta: ''
      });
      loadPlantoes();
    } catch (err) {
      alert('Erro ao registrar passagem de plantão');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner com Botão de Novo Plantão */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            Metodologia Internacional SBAR
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Passagem de Plantão — {unidadeSelecionada}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Transmissão estruturada de informações críticas entre equipes (Situação, Background, Avaliação e Recomendações).
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Registrar Passagem de Plantão
        </button>
      </div>

      {/* Lista de Plantões Registrados */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Carregando passagens de plantão...</div>
      ) : plantoes.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
          Nenhuma passagem de plantão registrada para esta unidade ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {plantoes.map((p) => (
            <div 
              key={p.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                    p.turno === 'DIURNO' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                  }`}>
                    TURNO {p.turno}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(p.data_hora).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Passou: <strong>{p.plantonista_passando}</strong> ➔ Recebeu: <strong>{p.plantonista_recebendo}</strong>
                </div>
              </div>

              {/* Blocos SBAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* S - Situação */}
                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-700">
                  <strong className="text-sky-800 dark:text-sky-300 font-bold block mb-1">
                    S — Situação (Cenário Geral da Ala)
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {p.situacao_sbar}
                  </p>
                </div>

                {/* B - Background */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-800 dark:text-slate-300 font-bold block mb-1">
                    B — Background (Histórico & Contexto)
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {p.background_sbar || 'Sem informações de histórico relevante.'}
                  </p>
                </div>

                {/* A - Avaliação */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-slate-900/60 border border-amber-100 dark:border-slate-700">
                  <strong className="text-amber-800 dark:text-amber-300 font-bold block mb-1">
                    A — Avaliação (Intercorrências nas últimas 12h)
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {p.avaliacao_sbar || 'Plantão sem intercorrências graves.'}
                  </p>
                </div>

                {/* R - Recomendações */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-slate-900/60 border border-emerald-100 dark:border-slate-700">
                  <strong className="text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
                    R — Recomendações & Pendências Críticas
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {p.recomendacao_sbar || 'Sem pendências imediatas.'}
                  </p>
                </div>
              </div>

              {p.transcricao_voz_bruta && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Nota ditada por voz: "{p.transcricao_voz_bruta}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nova Passagem de Plantão */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Nova Passagem de Plantão (SBAR)</h3>
                <p className="text-xs text-slate-400">Unidade: {unidadeSelecionada}</p>
              </div>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Voz */}
              <VoiceInput 
                onTranscription={handleVoiceTranscription}
                placeholder="Dite o resumo do plantão verbalmente para preencher..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno
                  </label>
                  <select
                    value={form.turno}
                    onChange={(e) => setForm({ ...form, turno: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="DIURNO">Diurno (07h às 19h)</option>
                    <option value="NOTURNO">Noturno (19h às 07h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plantonista que Passa
                  </label>
                  <input
                    type="text"
                    value={form.plantonista_passando}
                    onChange={(e) => setForm({ ...form, plantonista_passando: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plantonista que Recebe
                  </label>
                  <input
                    type="text"
                    value={form.plantonista_recebendo}
                    onChange={(e) => setForm({ ...form, plantonista_recebendo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-700 dark:text-sky-300 mb-1">
                  S — Situação Geral dos Leitos e Ocupação
                </label>
                <textarea
                  rows="2"
                  required
                  value={form.situacao_sbar}
                  onChange={(e) => setForm({ ...form, situacao_sbar: e.target.value })}
                  placeholder="Ex.: 8 leitos ocupados, 2 vagas disponíveis. Pacientes em ventilação mecânica..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  B — Background & Procedimentos Recentes
                </label>
                <textarea
                  rows="2"
                  value={form.background_sbar}
                  onChange={(e) => setForm({ ...form, background_sbar: e.target.value })}
                  placeholder="Ex.: Leito 1 pós-op cardíaco imediato; Leito 3 admitido de madrugada com sepse..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
                  A — Avaliação & Intercorrências do Plantão
                </label>
                <textarea
                  rows="2"
                  value={form.avaliacao_sbar}
                  onChange={(e) => setForm({ ...form, avaliacao_sbar: e.target.value })}
                  placeholder="Ex.: Queda de pressão no leito 2 revertida com noradrenalina. Extubação leito 4..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  R — Recomendações & Pendências Obrigatórias
                </label>
                <textarea
                  rows="2"
                  value={form.recomendacao_sbar}
                  onChange={(e) => setForm({ ...form, recomendacao_sbar: e.target.value })}
                  placeholder="Ex.: Coleta de gasometria leito 1 às 22h. Checar resultado de cultura leito 3..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow"
                >
                  Concluir Passagem de Plantão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
