import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Heart, Thermometer, Wind, Droplets, 
  Sparkles, CheckCircle2, ShieldAlert, FileText, UserCheck, Stethoscope 
} from 'lucide-react';
import VoiceInput from './VoiceInput';
import { api } from '../services/api';

export default function CorridaLeitoModal({ leito, onClose, onSaveSuccess }) {
  const paciente = leito?.paciente;

  const [activeTab, setActiveTab] = useState('vitais');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceParsedNotice, setVoiceParsedNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    leito_id: leito?.id || '',
    paciente_id: paciente?.id || '',
    responsavel_nome: 'Dra. Camila Nogueira',
    responsavel_cargo: 'MEDICO',

    // Sinais Vitais
    pa_sistolica: '',
    pa_diastolica: '',
    fc: '',
    fr: '',
    temp: '',
    sato2: '',
    suporte_o2: 'Ar ambiente',
    glicemia: '',
    nivel_consciencia: 'Lúcido e orientado',
    escala_dor: 0,

    // Dispositivos
    acesso_venoso: 'AVP MSE',
    acesso_venoso_aspecto: 'Limpo/Sem flogose',
    sonda_alimentar: 'Nenhuma (Dieta Oral)',
    sonda_vesical: 'Nenhuma (Diurese espontânea)',
    debito_urinario_aspecto: 'Claro',
    debito_urinario_ml: '',
    drenos_descricao: 'Sem drenos',
    infusoes_ativas: 'Nenhuma',

    // Exame da Pele
    lesao_pressao: false,
    lesao_pressao_detalhe: 'Pele íntegra',
    curativos_ativos: 'Nenhum',
    evolucao_clinica: '',

    // Condutas
    conduta_medica: '',
    conduta_enfermagem: '',
    conduta_fisioterapia: '',
    conduta_nutricao: '',
    exames_pendentes: '',
    previsao_alta: '48h',

    // Voz
    transcricao_voz_bruta: ''
  });

  const handleAutoFillFromVoice = async (transcript) => {
    setFormData(prev => ({ ...prev, transcricao_voz_bruta: transcript }));
    
    // Processa com o parser clínico da API
    const parsed = await api.parseSpeech(transcript);
    
    setFormData(prev => {
      const updated = { ...prev };
      if (parsed.pa_sistolica) updated.pa_sistolica = parsed.pa_sistolica;
      if (parsed.pa_diastolica) updated.pa_diastolica = parsed.pa_diastolica;
      if (parsed.fc) updated.fc = parsed.fc;
      if (parsed.fr) updated.fr = parsed.fr;
      if (parsed.temp) updated.temp = parsed.temp;
      if (parsed.sato2) updated.sato2 = parsed.sato2;
      if (parsed.suporte_o2) updated.suporte_o2 = parsed.suporte_o2;
      if (parsed.glicemia) updated.glicemia = parsed.glicemia;
      if (parsed.nivel_consciencia) updated.nivel_consciencia = parsed.nivel_consciencia;
      if (parsed.acesso_venoso) updated.acesso_venoso = parsed.acesso_venoso;
      if (parsed.sonda_vesical) updated.sonda_vesical = parsed.sonda_vesical;
      if (parsed.sonda_alimentar) updated.sonda_alimentar = parsed.sonda_alimentar;
      if (parsed.lesao_pressao !== null && parsed.lesao_pressao !== undefined) {
        updated.lesao_pressao = parsed.lesao_pressao;
        updated.lesao_pressao_detalhe = parsed.lesao_pressao ? "LPP identificada" : "Pele íntegra";
      }
      if (parsed.conduta_medica) updated.conduta_medica = parsed.conduta_medica;
      if (parsed.exames_pendentes) updated.exames_pendentes = parsed.exames_pendentes;
      return updated;
    });

    if (parsed.detected_entities && parsed.detected_entities.length > 0) {
      setVoiceParsedNotice(parsed.detected_entities);
      setTimeout(() => setVoiceParsedNotice(null), 8000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        pa_sistolica: formData.pa_sistolica ? parseInt(formData.pa_sistolica) : null,
        pa_diastolica: formData.pa_diastolica ? parseInt(formData.pa_diastolica) : null,
        fc: formData.fc ? parseInt(formData.fc) : null,
        fr: formData.fr ? parseInt(formData.fr) : null,
        temp: formData.temp ? parseFloat(formData.temp) : null,
        sato2: formData.sato2 ? parseInt(formData.sato2) : null,
        glicemia: formData.glicemia ? parseInt(formData.glicemia) : null,
        debito_urinario_ml: formData.debito_urinario_ml ? parseInt(formData.debito_urinario_ml) : null,
        escala_dor: parseInt(formData.escala_dor) || 0
      };

      await api.createCorrida(payload);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao salvar registro da corrida de leito. Verifique os dados.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Cabeçalho do Leito & Paciente */}
        <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-white/20 rounded-md tracking-wide uppercase">
                  {leito?.codigo} • {leito?.unidade}
                </span>
                {paciente?.precaucao && paciente.precaucao !== 'PADRAO' && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/90 text-white rounded-md flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Isolamento: {paciente.precaucao}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1.5 leading-tight">
                {paciente?.nome || 'Leito Sem Paciente Alocado'}
              </h2>
              <p className="text-sky-100 text-xs sm:text-sm mt-1">
                Prontuário: <strong>{paciente?.prontuario}</strong> • {paciente?.idade} anos • {paciente?.genero} • Diagnóstico: {paciente?.diagnostico_principal}
              </p>
              {paciente?.alergias && paciente.alergias !== 'Nega alergias' && (
                <div className="mt-1 text-xs text-amber-200 font-medium flex items-center gap-1">
                  ⚠️ Alergias: {paciente.alergias}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Barra de Ditado de Voz */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <VoiceInput 
            onAutoFill={handleAutoFillFromVoice}
            placeholder="Dite os parâmetros: 'Pressão 120 por 80, FC 75, Sat 98%, afebril, conduta manter dieta e pedir hemograma'..."
          />

          {voiceParsedNotice && (
            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Extraído por voz com sucesso:</strong> {voiceParsedNotice.join(' • ')}
              </span>
            </div>
          )}
        </div>

        {/* Abas da Corrida */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('vitais')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'vitais'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            1. Sinais Vitais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dispositivos')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dispositivos'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            2. Dispositivos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pele')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'pele'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            3. Exame & Pele
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('condutas')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'condutas'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            4. Condutas & Metas
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[58vh] overflow-y-auto">
          
          {/* ABA 1: SINAIS VITAIS */}
          {activeTab === 'vitais' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PA Sistólica (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.pa_sistolica}
                    onChange={(e) => setFormData({ ...formData, pa_sistolica: e.target.value })}
                    placeholder="120"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PA Diastólica (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.pa_diastolica}
                    onChange={(e) => setFormData({ ...formData, pa_diastolica: e.target.value })}
                    placeholder="80"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    FC (bpm)
                  </label>
                  <input
                    type="number"
                    value={formData.fc}
                    onChange={(e) => setFormData({ ...formData, fc: e.target.value })}
                    placeholder="78"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    FR (irpm)
                  </label>
                  <input
                    type="number"
                    value={formData.fr}
                    onChange={(e) => setFormData({ ...formData, fr: e.target.value })}
                    placeholder="18"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temp}
                    onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                    placeholder="36.5"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SatO2 (%)
                  </label>
                  <input
                    type="number"
                    value={formData.sato2}
                    onChange={(e) => setFormData({ ...formData, sato2: e.target.value })}
                    placeholder="98"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Suporte de O2
                  </label>
                  <select
                    value={formData.suporte_o2}
                    onChange={(e) => setFormData({ ...formData, suporte_o2: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Ar ambiente">Ar ambiente</option>
                    <option value="Cateter Nasal O2">Cateter Nasal O2</option>
                    <option value="Máscara de Venturi">Máscara de Venturi</option>
                    <option value="VNI (Não Invasiva)">VNI (Não Invasiva)</option>
                    <option value="Ventilação Mecânica Invasiva (TOT)">Ventilação Mecânica (TOT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Glicemia (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={formData.glicemia}
                    onChange={(e) => setFormData({ ...formData, glicemia: e.target.value })}
                    placeholder="110"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nível de Consciência / Sedação
                  </label>
                  <select
                    value={formData.nivel_consciencia}
                    onChange={(e) => setFormData({ ...formData, nivel_consciencia: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Lúcido e orientado">Lúcido e orientado</option>
                    <option value="Sonolento, despertável">Sonolento, despertável</option>
                    <option value="Confuso / Desorientado">Confuso / Desorientado</option>
                    <option value="Torporoso">Torporoso</option>
                    <option value="Sedado (RASS -2 a -3)">Sedado (RASS -2 a -3)</option>
                    <option value="Sedado Profundo (RASS -4 a -5)">Sedado Profundo (RASS -4 a -5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Escala de Dor (0 a 10): <span className="font-bold text-sky-600">{formData.escala_dor}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.escala_dor}
                    onChange={(e) => setFormData({ ...formData, escala_dor: e.target.value })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-sky-600 mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DISPOSITIVOS INVASIVOS */}
          {activeTab === 'dispositivos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Acesso Venoso
                  </label>
                  <select
                    value={formData.acesso_venoso}
                    onChange={(e) => setFormData({ ...formData, acesso_venoso: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Nenhum">Nenhum</option>
                    <option value="AVP MSE">AVP Membro Superior Esquerdo</option>
                    <option value="AVP MSD">AVP Membro Superior Direito</option>
                    <option value="CVC Subclávia D">CVC Subclávia Direita</option>
                    <option value="CVC Jugular D">CVC Jugular Direita</option>
                    <option value="PICC">PICC</option>
                    <option value="Dissecção / Outro">Dissecção / Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aspecto do Sítio do Acesso
                  </label>
                  <input
                    type="text"
                    value={formData.acesso_venoso_aspecto}
                    onChange={(e) => setFormData({ ...formData, acesso_venoso_aspecto: e.target.value })}
                    placeholder="Limpo, sem hiperemia ou secreção"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sonda / Via de Nutrição
                  </label>
                  <select
                    value={formData.sonda_alimentar}
                    onChange={(e) => setFormData({ ...formData, sonda_alimentar: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Nenhuma (Dieta Oral)">Nenhuma (Dieta Oral)</option>
                    <option value="SNE (Sonda Nasoenteral)">SNE (Sonda Nasoenteral)</option>
                    <option value="SNG (Sonda Nasogástrica aberta)">SNG (Sonda Nasogástrica)</option>
                    <option value="Gastrostomia (GTT)">Gastrostomia (GTT)</option>
                    <option value="Jejunostomia">Jejunostomia</option>
                    <option value="Jejum / NPO">Jejum / NPO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sonda Vesical / Diurese
                  </label>
                  <select
                    value={formData.sonda_vesical}
                    onChange={(e) => setFormData({ ...formData, sonda_vesical: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Nenhuma (Diurese espontânea)">Nenhuma (Diurese espontânea)</option>
                    <option value="SVD em sistema fechado">SVD em sistema fechado</option>
                    <option value="Sonda de Alívio Intermitente">Sonda de Alívio</option>
                    <option value="Cistostomia">Cistostomia</option>
                    <option value="Anúria / Em diálise">Anúria / Em diálise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Débito Urinário (ml nas últimas 12/24h) e Aspecto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.debito_urinario_ml}
                      onChange={(e) => setFormData({ ...formData, debito_urinario_ml: e.target.value })}
                      placeholder="ml"
                      className="w-28 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <select
                      value={formData.debito_urinario_aspecto}
                      onChange={(e) => setFormData({ ...formData, debito_urinario_aspecto: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Claro">Claro / Límpido</option>
                      <option value="Concentrado">Concentrado / Colúrico</option>
                      <option value="Piúria">Piúria / Turvo</option>
                      <option value="Hematúria">Hematúria</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Drenos (Local e Débito)
                  </label>
                  <input
                    type="text"
                    value={formData.drenos_descricao}
                    onChange={(e) => setFormData({ ...formData, drenos_descricao: e.target.value })}
                    placeholder="Sem drenos ou: Dreno de tórax à D..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Infusões Contínuas / Bombas de Infusão Ativas
                </label>
                <input
                  type="text"
                  value={formData.infusoes_ativas}
                  onChange={(e) => setFormData({ ...formData, infusoes_ativas: e.target.value })}
                  placeholder="Ex.: Noradrenalina 0.05 mcg/kg/min, Fentanil 2ml/h, Soro Fisiológico 1000ml..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* ABA 3: PELE E EXAME FÍSICO */}
          {activeTab === 'pele' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Lesão por Pressão (LPP)?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Vigilância ativa de pele conforme protocolo de segurança do paciente
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lesao_pressao}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        lesao_pressao: e.target.checked,
                        lesao_pressao_detalhe: e.target.checked ? "LPP Grau 1 em Sacro" : "Pele íntegra"
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {formData.lesao_pressao && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Localização e Estágio da Lesão:
                    </label>
                    <input
                      type="text"
                      value={formData.lesao_pressao_detalhe}
                      onChange={(e) => setFormData({ ...formData, lesao_pressao_detalhe: e.target.value })}
                      placeholder="Ex: Região sacra grau 2, calcâneo direito..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Curativos e Feridas Cirúrgicas
                </label>
                <input
                  type="text"
                  value={formData.curativos_ativos}
                  onChange={(e) => setFormData({ ...formData, curativos_ativos: e.target.value })}
                  placeholder="Ex: Incisão cirúrgica limpa e seca, curativo trocado hoje..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exame do Paciente & Evolução Sumária Geral
                </label>
                <textarea
                  rows="3"
                  value={formData.evolucao_clinica}
                  onChange={(e) => setFormData({ ...formData, evolucao_clinica: e.target.value })}
                  placeholder="Descreva o estado geral, ausculta pulmonar/cardíaca, queixas do paciente..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>
            </div>
          )}

          {/* ABA 4: CONDUTAS E METAS MULTIPROFISSIONAIS */}
          {activeTab === 'condutas' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conduta Médica & Prescrição
                </label>
                <textarea
                  rows="2"
                  value={formData.conduta_medica}
                  onChange={(e) => setFormData({ ...formData, conduta_medica: e.target.value })}
                  placeholder="Ex.: Manter ceftriaxona D4, desmamar sedação, solicitar ecocardiograma..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Metas da Enfermagem
                  </label>
                  <input
                    type="text"
                    value={formData.conduta_enfermagem}
                    onChange={(e) => setFormData({ ...formData, conduta_enfermagem: e.target.value })}
                    placeholder="Balanço hídrico rigoroso, troca de curativo..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Metas da Fisioterapia
                  </label>
                  <input
                    type="text"
                    value={formData.conduta_fisioterapia}
                    onChange={(e) => setFormData({ ...formData, conduta_fisioterapia: e.target.value })}
                    placeholder="Sedestação à beira leito, higiene brônquica..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exames Pendentes / Solicitados
                  </label>
                  <input
                    type="text"
                    value={formData.exames_pendentes}
                    onChange={(e) => setFormData({ ...formData, exames_pendentes: e.target.value })}
                    placeholder="Hemograma, gasometria, TC de crânio..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Previsão de Alta / Desospitalização
                  </label>
                  <select
                    value={formData.previsao_alta}
                    onChange={(e) => setFormData({ ...formData, previsao_alta: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="24h">Próximas 24 horas</option>
                    <option value="48h">48 horas</option>
                    <option value="72h">72 horas</option>
                    <option value="Superior a 7 dias">Sem previsão próxima (acima de 7 dias)</option>
                    <option value="Transferência de Setor">Transferência de Setor (UTI para Enfermaria)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Rodapé e Botões */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Registrado por: <strong>{formData.responsavel_nome}</strong>
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Visita de Leito'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
