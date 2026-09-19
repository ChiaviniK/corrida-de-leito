import React from 'react';
import { 
  Stethoscope, BedDouble, BookOpen, Moon, Sun, 
  Activity, Sparkles, RefreshCw 
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  unidade, 
  setUnidade, 
  unidadesDisponiveis,
  darkMode,
  setDarkMode,
  onRefresh,
  totalOcupados,
  totalLivres
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Corrida de Leito
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-full">
                  Assistente Multiprofissional
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Visita Beira-Leito • Transcrição por Voz • Passagem SBAR
              </p>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCurrentTab('leitos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'leitos'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>Corrida de Leitos</span>
            </button>

            <button
              onClick={() => setCurrentTab('plantao')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'plantao'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Passagem SBAR</span>
            </button>
          </div>

          {/* Controles Laterais */}
          <div className="flex items-center gap-2.5">
            {/* Seletor de Unidade */}
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Todas as Unidades</option>
              {unidadesDisponiveis.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Atualizar */}
            <button
              onClick={onRefresh}
              title="Atualizar leitos"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Alternador Modo Escuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro (Plantão Noturno)"}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
