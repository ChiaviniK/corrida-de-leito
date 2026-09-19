import React, { useState } from 'react';
import { 
  Activity, ShieldAlert, FileText, Stethoscope, 
  BedDouble, User, AlertCircle, CheckCircle2, Clock 
} from 'lucide-react';

export default function BedGrid({ leitos, onSelectCorrida, onSelectReport }) {
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeitos = leitos.filter((l) => {
    const matchesStatus = 
      filterStatus === 'TODOS' ? true : l.status === filterStatus;
    const matchesSearch = 
      !searchTerm ||
      l.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.paciente?.nome && l.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.paciente?.prontuario && l.paciente.prontuario.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OCUPADO':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            Ocupado
          </span>
        );
      case 'LIVRE':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Livre / Vago
          </span>
        );
      case 'AGUARDANDO_LIMPEZA':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            Aguardando Limpeza
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Busca Rápida */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {['TODOS', 'OCUPADO', 'LIVRE', 'AGUARDANDO_LIMPEZA'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === st
                    ? 'bg-sky-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'TODOS' ? 'Todos os Leitos' : st === 'OCUPADO' ? 'Ocupados' : st === 'LIVRE' ? 'Livres' : 'Higienização'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar leito, paciente ou prontuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Grid de Cards de Leito */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeitos.map((leito) => {
          const p = leito.paciente;
          const isOccupied = leito.status === 'OCUPADO' && p;

          return (
            <div
              key={leito.id}
              className={`rounded-2xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                isOccupied
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700'
              }`}
            >
              {/* Topo do Card */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {leito.codigo}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {leito.tipo}
                    </span>
                  </div>
                  {getStatusBadge(leito.status)}
                </div>

                {/* Conteúdo do Paciente */}
                {isOccupied ? (
                  <div className="space-y-2 mt-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                        {p.nome}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Prontuário: <strong>{p.prontuario}</strong> • {p.idade} anos
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[11px]">Diagnóstico:</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                        {p.diagnostico_principal}
                      </p>
                    </div>

                    {p.precaucao && p.precaucao !== 'PADRAO' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-md">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Precaução: {p.precaucao}
                      </div>
                    )}

                    {p.alergias && p.alergias !== 'Nega alergias conhecidas' && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                        ⚠️ Alergias: {p.alergias}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                    <BedDouble className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-medium">Leito disponível para admissão</p>
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                {isOccupied ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectReport(leito)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      Prontuário
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectCorrida(leito)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white active:scale-95 transition-all shadow-md shadow-sky-600/20"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Corrida de Leito
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-[11px] text-slate-400 py-1">
                    {leito.status === 'LIVRE' ? 'Pronto para regulação' : 'Aguardando higienização terminal'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
