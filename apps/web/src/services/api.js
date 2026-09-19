const API_BASE = '/api';

export const api = {
  // Leitos
  async getLeitos(unidade = '') {
    try {
      const url = unidade ? `${API_BASE}/leitos?unidade=${encodeURIComponent(unidade)}` : `${API_BASE}/leitos`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar leitos');
      const data = await res.json();
      localStorage.setItem('cached_leitos', JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('API indisponível, usando cache local:', err);
      const cached = localStorage.getItem('cached_leitos');
      return cached ? JSON.parse(cached) : [];
    }
  },

  // Corrida de Leito
  async createCorrida(data) {
    try {
      const res = await fetch(`${API_BASE}/corrida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Erro ao salvar corrida de leito');
      const saved = await res.json();
      
      // Salva também localmente para persistência offline
      const historicoLocal = JSON.parse(localStorage.getItem('local_corridas') || '[]');
      historicoLocal.push(saved);
      localStorage.setItem('local_corridas', JSON.stringify(historicoLocal));
      
      return saved;
    } catch (err) {
      console.warn('Fallback offline para registro de corrida:', err);
      const offlineEntry = {
        ...data,
        id: 'local-' + Date.now(),
        data_hora: new Date().toISOString()
      };
      const historicoLocal = JSON.parse(localStorage.getItem('local_corridas') || '[]');
      historicoLocal.push(offlineEntry);
      localStorage.setItem('local_corridas', JSON.stringify(historicoLocal));
      return offlineEntry;
    }
  },

  async getCorridasPorPaciente(pacienteId) {
    try {
      const res = await fetch(`${API_BASE}/corrida/paciente/${pacienteId}`);
      if (!res.ok) throw new Error('Erro ao buscar histórico do paciente');
      return await res.json();
    } catch (err) {
      const historicoLocal = JSON.parse(localStorage.getItem('local_corridas') || '[]');
      return historicoLocal.filter(r => r.paciente_id === pacienteId);
    }
  },

  // Analisador Clínico de Fala
  async parseSpeech(transcription) {
    try {
      const res = await fetch(`${API_BASE}/corrida/parse-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription })
      });
      if (!res.ok) throw new Error('Erro no analisador de voz');
      return await res.json();
    } catch (err) {
      // Fallback local simples de regex caso o backend esteja offline
      return fallbackLocalSpeechParser(transcription);
    }
  },

  // Passagem de Plantão SBAR
  async createPlantao(data) {
    try {
      const res = await fetch(`${API_BASE}/plantao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Erro ao salvar passagem de plantão');
      return await res.json();
    } catch (err) {
      const offline = { ...data, id: 'plantao-' + Date.now(), data_hora: new Date().toISOString() };
      const local = JSON.parse(localStorage.getItem('local_plantoes') || '[]');
      local.unshift(offline);
      localStorage.setItem('local_plantoes', JSON.stringify(local));
      return offline;
    }
  },

  async getPlantoes(unidade = 'UTI Geral') {
    try {
      const res = await fetch(`${API_BASE}/plantao/unidade/${encodeURIComponent(unidade)}`);
      if (!res.ok) throw new Error('Erro ao buscar plantões');
      return await res.json();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('local_plantoes') || '[]');
      return local.filter(p => !unidade || p.unidade === unidade);
    }
  },

  // Exportação e Prontuários
  async getPatientSummary(pacienteId) {
    try {
      const res = await fetch(`${API_BASE}/export/paciente/${pacienteId}/summary`);
      if (!res.ok) throw new Error('Erro ao gerar prontuário');
      return await res.json();
    } catch (err) {
      console.warn('Usando construtor offline de prontuário');
      return null;
    }
  },

  getDownloadUrl(pacienteId, format = 'json') {
    return `${API_BASE}/export/paciente/${pacienteId}/${format}`;
  }
};

// Parser local de emergência para quando estiver sem conexão com a API
function fallbackLocalSpeechParser(text) {
  const lower = (text || '').toLowerCase();
  const parsed = {
    detected_entities: []
  };

  const paMatch = lower.match(/(?:press[aã]o|pa)?\s*(\d{2,3})\s*(?:por|x|\/)\s*(\d{2,3})/);
  if (paMatch) {
    let sis = parseInt(paMatch[1]);
    let dia = parseInt(paMatch[2]);
    if (sis < 30 && dia < 20) { sis *= 10; dia *= 10; }
    parsed.pa_sistolica = sis;
    parsed.pa_diastolica = dia;
    parsed.detected_entities.push(`PA: ${sis}x${dia} mmHg`);
  }

  const fcMatch = lower.match(/(?:frequ[eê]ncia|fc|card[ií]aca)\s*[:=]?\s*(\d{2,3})/);
  if (fcMatch) {
    parsed.fc = parseInt(fcMatch[1]);
    parsed.detected_entities.push(`FC: ${parsed.fc} bpm`);
  }

  const satMatch = lower.match(/(?:satura[cç][aã]o|saturando|sat)\s*[:=]?\s*(\d{2,3})/);
  if (satMatch) {
    parsed.sato2 = parseInt(satMatch[1]);
    parsed.detected_entities.push(`SatO2: ${parsed.sato2}%`);
  }

  if (lower.includes('afebril')) {
    parsed.temp = 36.5;
    parsed.detected_entities.push('Temp: 36.5°C');
  }

  return parsed;
}
