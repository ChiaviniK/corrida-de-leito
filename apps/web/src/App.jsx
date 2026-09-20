import React, { useState, useEffect, useRef } from 'react';
import { 
  BedDouble, Plus, Mic, MicOff, Download, FileText, 
  Trash2, Clock, CheckCircle2, AlertCircle, Volume2, 
  User, RefreshCw, Printer, Search, Check, Copy,
  Sparkles, LogOut, RotateCcw, Share2, Tag, ShieldCheck,
  Sun, Moon, Edit3, ArrowUpDown, AlertTriangle, Activity, Smartphone
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// Parser inteligente de sinais vitais no texto ou áudio
function extrairSinaisVitais(texto) {
  if (!texto) return [];
  const sinais = [];

  // Pressão Arterial (ex: PA 120x80, 130/85, pressão 140 por 90)
  const matchPA = texto.match(/(?:PA|press[aã]o(?:\s*arterial)?)\s*[:=]?\s*(\d{2,3})\s*(?:x|\/|\s*por\s*)\s*(\d{2,3})/i);
  if (matchPA) {
    const sist = parseInt(matchPA[1], 10);
    const diast = parseInt(matchPA[2], 10);
    const alterado = sist >= 140 || sist <= 90 || diast >= 90 || diast <= 60;
    sinais.push({
      tipo: 'PA',
      label: `PA: ${sist}x${diast} mmHg`,
      alterado,
      alerta: alterado ? 'Pressão fora da faixa alvo' : null
    });
  }

  // Frequência Cardíaca (ex: FC 110, 76 bpm, pulso 80)
  const matchFC = texto.match(/(?:FC|freq[uü][eê]ncia\s*card[ií]aca|pulso)\s*[:=]?\s*(\d{2,3})(?:\s*bpm)?/i);
  if (matchFC) {
    const fc = parseInt(matchFC[1], 10);
    const alterado = fc > 100 || fc < 50;
    sinais.push({
      tipo: 'FC',
      label: `FC: ${fc} bpm`,
      alterado,
      alerta: alterado ? (fc > 100 ? 'Taquicardia' : 'Bradicardia') : null
    });
  }

  // Saturação de O2 (ex: Sat 92%, saturação 98%, sato2 94)
  const matchSat = texto.match(/(?:Sat(?:O2|ura[cç][aã]o)?)\s*[:=]?\s*(\d{2,3})\s*%?/i);
  if (matchSat) {
    const sat = parseInt(matchSat[1], 10);
    const alterado = sat < 93;
    sinais.push({
      tipo: 'SatO2',
      label: `SatO₂: ${sat}%`,
      alterado,
      alerta: alterado ? 'Hipoxemia (<93%)' : null
    });
  }

  // Temperatura / Tax (ex: temp 38.2, tax 37, afebril, febre 38.5)
  if (/(?:afebril)/i.test(texto)) {
    sinais.push({ tipo: 'Temp', label: 'Tax: Afebril (36.5°C)', alterado: false });
  } else {
    const matchTemp = texto.match(/(?:temp(?:eratura)?|tax|febre)\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\s*(?:°?C|graus)?/i);
    if (matchTemp) {
      const temp = parseFloat(matchTemp[1].replace(',', '.'));
      const alterado = temp >= 37.8;
      sinais.push({
        tipo: 'Temp',
        label: `Tax: ${temp}°C`,
        alterado,
        alerta: alterado ? 'Febre / Estado Febril' : null
      });
    }
  }

  // Glicemia / HGT (ex: glicemia 180, hgt 94, destro 110)
  const matchGlic = texto.match(/(?:glicemia|hgt|destro|glic)\s*[:=]?\s*(\d{2,3})/i);
  if (matchGlic) {
    const glic = parseInt(matchGlic[1], 10);
    const alterado = glic > 180 || glic < 70;
    sinais.push({
      tipo: 'Glicemia',
      label: `Glic: ${glic} mg/dL`,
      alterado,
      alerta: alterado ? (glic > 180 ? 'Hiperglicemia' : 'Hipoglicemia') : null
    });
  }

  return sinais;
}

export default function App() {
  const [leitos, setLeitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('ATIVOS'); // 'ATIVOS' | 'ALTAS'
  const [showModalNovoLeito, setShowModalNovoLeito] = useState(false);
  const [novoLeitoNum, setNovoLeitoNum] = useState('');
  const [novoPacienteNome, setNovoPacienteNome] = useState('');
  const [novaCriticidade, setNovaCriticidade] = useState('ESTAVEL');
  const [busca, setBusca] = useState('');
  const [criterioOrdenacao, setCriterioOrdenacao] = useState('CORREDOR'); // 'CORREDOR' | 'CRITICIDADE' | 'PENDENTES' | 'RECENTES'

  // Modo Noturno (Plantão)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('corrida_dark_mode') === 'true';
  });

  // Modal de Edição de Leito / Paciente
  const [leitoEmEdicao, setLeitoEmEdicao] = useState(null);
  const [editLeitoNome, setEditLeitoNome] = useState('');
  const [editPacienteNome, setEditPacienteNome] = useState('');

  // Identificação do profissional responsável (persistido no localStorage)
  const [autor, setAutor] = useState(() => {
    return localStorage.getItem('corrida_autor') || 'Dra. Camila';
  });
  const [editandoAutor, setEditandoAutor] = useState(false);

  // Estados de entrada por leito
  const [textosEntrada, setTextosEntrada] = useState({});
  const [gravandoLeitoId, setGravandoLeitoId] = useState(null);
  const [toastMensagem, setToastMensagem] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  const recognitionRef = useRef(null);
  const gravandoLeitoIdRef = useRef(null);

  // Efeito do Dark Mode no HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('corrida_dark_mode', darkMode);
  }, [darkMode]);

  // Captura do evento de instalação PWA (Adicionar à Tela Inicial)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const instalarPWA = async () => {
    if (!installPrompt) return;
    vibrar([40]);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      dispararToast('Aplicativo instalado na tela de início!');
    }
  };

  // Chips clínicos rápidos para inserção ágil com 1 toque
  const chipsClinicos = [
    { label: 'Sinais estáveis', texto: 'Sinais vitais estáveis, afebril, eupneico em ar ambiente.' },
    { label: 'Acesso OK', texto: 'Acesso venoso periférico pérvio, limpo e sem sinais flogísticos.' },
    { label: 'Diurese límpida', texto: 'Diurese espontânea presente, aspecto límpido e claro.' },
    { label: 'Pele íntegra', texto: 'Pele íntegra em proeminências ósseas, sem lesão por pressão.' },
    { label: 'Dieta tolerada', texto: 'Aceitando e tolerando dieta por via oral sem queixas.' },
    { label: 'Exames pendentes', texto: 'Aguardando resultado de exames laboratoriais complementares.' },
    { label: 'Previsão de Alta', texto: 'Boa evolução clínica. Previsão de alta médica nas próximas 24 horas.' },
  ];

  // Feedback Háptico (vibração no celular/tablet)
  const vibrar = (padrao = [30]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(padrao);
      } catch (e) {}
    }
  };

  const dispararToast = (msg) => {
    setToastMensagem(msg);
    setTimeout(() => {
      setToastMensagem(null);
    }, 3200);
  };

  const handleSalvarAutor = (novoNome) => {
    const limpo = novoNome.trim() || 'Profissional';
    setAutor(limpo);
    localStorage.setItem('corrida_autor', limpo);
    setEditandoAutor(false);
  };

  // Carregar leitos (API com fallback local)
  const carregarLeitos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simple/leitos');
      if (res.ok) {
        const data = await res.json();
        setLeitos(data);
        localStorage.setItem('leitos_simplificados', JSON.stringify(data));
      } else {
        throw new Error('API indisponível');
      }
    } catch (err) {
      console.warn('Usando armazenamento local:', err);
      const local = localStorage.getItem('leitos_simplificados');
      if (local) {
        setLeitos(JSON.parse(local));
      } else {
        const inicial = [
          {
            id: 'exemplo-1',
            leito: 'Leito 101',
            paciente: 'Dona Maria Francisca da Silva',
            status: 'ATIVO',
            criticidade: 'ESTAVEL',
            created_at: new Date().toISOString(),
            registros: [
              {
                id: 'reg-1',
                texto: 'Pressão 125x80 mmHg, FC 76 bpm, saturação 98% em ar ambiente, afebril. Mantendo acesso venoso periférico em MSE limpo e sem flogose. Diurese espontânea clara. Conduta: manter hidratação e solicitar hemograma matinal.',
                tipo: 'VOZ',
                autor: 'Dra. Camila',
                data_hora: new Date().toISOString()
              }
            ]
          }
        ];
        setLeitos(inicial);
        localStorage.setItem('leitos_simplificados', JSON.stringify(inicial));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLeitos();
  }, []);

  const persistirLeitos = (novosLeitos) => {
    setLeitos(novosLeitos);
    localStorage.setItem('leitos_simplificados', JSON.stringify(novosLeitos));
  };

  // Criar novo leito
  const handleCriarLeito = async (e) => {
    e.preventDefault();
    if (!novoLeitoNum.trim() || !novoPacienteNome.trim()) return;

    vibrar([40]);
    const novoObj = {
      id: 'leito-' + Date.now(),
      leito: novoLeitoNum.trim(),
      paciente: novoPacienteNome.trim(),
      status: 'ATIVO',
      criticidade: novaCriticidade,
      created_at: new Date().toISOString(),
      registros: []
    };

    try {
      const res = await fetch('/api/simple/leitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leito: novoObj.leito, 
          paciente: novoObj.paciente,
          criticidade: novoObj.criticidade
        })
      });
      if (res.ok) {
        const salvo = await res.json();
        persistirLeitos([salvo, ...leitos]);
      } else {
        persistirLeitos([novoObj, ...leitos]);
      }
    } catch (err) {
      persistirLeitos([novoObj, ...leitos]);
    }

    setNovoLeitoNum('');
    setNovoPacienteNome('');
    setNovaCriticidade('ESTAVEL');
    setShowModalNovoLeito(false);
    dispararToast(`Leito ${novoObj.leito} cadastrado com sucesso!`);
  };

  // Abrir Modal de Edição
  const abrirEdicaoLeito = (item) => {
    vibrar([20]);
    setLeitoEmEdicao(item);
    setEditLeitoNome(item.leito);
    setEditPacienteNome(item.paciente);
  };

  // Salvar Edição de Leito / Paciente
  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (!leitoEmEdicao || !editLeitoNome.trim() || !editPacienteNome.trim()) return;

    vibrar([40]);
    const leitoId = leitoEmEdicao.id;
    const novosDados = {
      leito: editLeitoNome.trim(),
      paciente: editPacienteNome.trim()
    };

    try {
      await fetch(`/api/simple/leitos/${leitoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novosDados)
      });
    } catch (err) {}

    const atualizados = leitos.map((l) => {
      if (l.id === leitoId) {
        return { ...l, ...novosDados };
      }
      return l;
    });

    persistirLeitos(atualizados);
    setLeitoEmEdicao(null);
    dispararToast('Dados do leito e paciente atualizados!');
  };

  // Mudar Criticidade (🟢 Estável | 🟡 Atenção | 🔴 Crítico) com 1 toque
  const handleMudarCriticidade = async (id, novaCrit) => {
    vibrar([30]);
    try {
      await fetch(`/api/simple/leitos/${id}/criticidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criticidade: novaCrit })
      });
    } catch (e) {}

    const atualizados = leitos.map((l) => {
      if (l.id === id) {
        return { ...l, criticidade: novaCrit };
      }
      return l;
    });

    persistirLeitos(atualizados);
    const nomesCrit = { ESTAVEL: 'Estável 🟢', ATENCAO: 'Atenção 🟡', CRITICO: 'Crítico 🔴' };
    dispararToast(`Criticidade alterada para: ${nomesCrit[novaCrit] || novaCrit}`);
  };

  // Dar Alta ao Paciente
  const handleDarAlta = async (id, leitoNome, pacienteNome) => {
    if (!window.confirm(`Deseja confirmar a ALTA HOSPITALAR para ${pacienteNome} (${leitoNome})? O registro será mantido no histórico de altas.`)) return;

    vibrar([50, 40]);
    try {
      await fetch(`/api/simple/leitos/${id}/alta`, { method: 'POST' });
    } catch (e) {}

    const atualizados = leitos.map((l) => {
      if (l.id === id) {
        return { ...l, status: 'ALTA' };
      }
      return l;
    });

    persistirLeitos(atualizados);
    dispararToast(`Alta registrada para ${pacienteNome}. Transferido para histórico de altas.`);
  };

  // Reativar Leito
  const handleReativarLeito = async (id, leitoNome, pacienteNome) => {
    vibrar([40]);
    try {
      await fetch(`/api/simple/leitos/${id}/reativar`, { method: 'POST' });
    } catch (e) {}

    const atualizados = leitos.map((l) => {
      if (l.id === id) {
        return { ...l, status: 'ATIVO' };
      }
      return l;
    });

    persistirLeitos(atualizados);
    dispararToast(`Leito de ${pacienteNome} reativado na lista principal.`);
  };

  // Excluir leito
  const handleExcluirLeito = async (id, leitoNome) => {
    if (!window.confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE o registro do ${leitoNome}? Todos os dados deste paciente serão apagados.`)) return;

    vibrar([60]);
    try {
      await fetch(`/api/simple/leitos/${id}`, { method: 'DELETE' });
    } catch (e) {}

    persistirLeitos(leitos.filter((l) => l.id !== id));
    dispararToast(`Registro do ${leitoNome} removido.`);
  };

  // Inserir chip clínico inteligente no texto
  const handleInserirChip = (leitoId, textoChip) => {
    vibrar([25]);
    setTextosEntrada((prev) => {
      const atual = (prev[leitoId] || '').trim();
      const novo = atual ? `${atual}\n• ${textoChip}` : `• ${textoChip}`;
      return { ...prev, [leitoId]: novo };
    });
  };

  // Salvar registro de texto/voz
  const handleSalvarRegistro = async (leitoId, tipo = 'TEXTO') => {
    const texto = (textosEntrada[leitoId] || '').trim();
    if (!texto) {
      alert('Por favor, digite ou dite as informações antes de salvar.');
      return;
    }

    vibrar([30, 40]);
    const novoRegistro = {
      id: 'reg-' + Date.now(),
      texto: texto,
      tipo: tipo,
      autor: autor || 'Profissional',
      data_hora: new Date().toISOString()
    };

    try {
      await fetch(`/api/simple/leitos/${leitoId}/registros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto, tipo: tipo, autor: autor })
      });
    } catch (e) {}

    const leitosAtualizados = leitos.map((l) => {
      if (l.id === leitoId) {
        return {
          ...l,
          registros: [novoRegistro, ...(l.registros || [])]
        };
      }
      return l;
    });

    persistirLeitos(leitosAtualizados);
    setTextosEntrada((prev) => ({ ...prev, [leitoId]: '' }));
    if (gravandoLeitoId === leitoId) {
      pararGravacao();
    }
    dispararToast('Registro clínico adicionado com sucesso!');
  };

  // Reconhecimento de Voz (Web Speech API Otimizado para Mobile e Desktop)
  const iniciarGravacao = (leitoId) => {
    vibrar([50]);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Recomendamos usar o Google Chrome ou Microsoft Edge.');
      return;
    }

    // Se já estava gravando outro leito, encerra a anterior
    pararGravacao();

    const recognition = new SpeechRecognition();
    // No Android/Mobile, continuous e interimResults verdadeiros causam acúmulo de buffer e repetição de palavras.
    // Usar continuous: false com reinício suave em onend elimina 100% a duplicação!
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let textoTranscrito = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i] && event.results[i][0]) {
          const pedaco = event.results[i][0].transcript.trim();
          if (pedaco) {
            textoTranscrito += (textoTranscrito ? ' ' : '') + pedaco;
          }
        }
      }

      if (!textoTranscrito) return;

      // Anexa de forma limpa ao texto existente sem duplicar
      setTextosEntrada((prev) => {
        const textoAtual = (prev[leitoId] || '').trim();
        // Evita re-inserção se o navegador reenviar o mesmo trecho
        if (textoAtual.endsWith(textoTranscrito)) {
          return prev;
        }
        const novoTexto = textoAtual ? `${textoAtual} ${textoTranscrito}` : textoTranscrito;
        return {
          ...prev,
          [leitoId]: novoTexto
        };
      });
    };

    recognition.onerror = (event) => {
      console.warn('Erro voz:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        pararGravacao();
        alert('Permissão de microfone negada. Por favor, autorize o acesso ao microfone no navegador.');
      }
    };

    recognition.onend = () => {
      // Se ainda estiver ativo para este leito, reinicia com buffer limpo (escuta contínua estável)
      if (gravandoLeitoIdRef.current === leitoId) {
        try {
          recognition.start();
        } catch (e) {
          gravandoLeitoIdRef.current = null;
          setGravandoLeitoId(null);
        }
      } else {
        setGravandoLeitoId(null);
      }
    };

    recognitionRef.current = recognition;
    gravandoLeitoIdRef.current = leitoId;
    setGravandoLeitoId(leitoId);

    try {
      recognition.start();
    } catch (err) {
      console.error('Falha ao iniciar reconhecimento:', err);
      gravandoLeitoIdRef.current = null;
      setGravandoLeitoId(null);
    }
  };

  const pararGravacao = () => {
    vibrar([30, 20]);
    gravandoLeitoIdRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // abort encerra imediatamente sem disparar callbacks residuais
      } catch (e) {}
      recognitionRef.current = null;
    }
    setGravandoLeitoId(null);
  };

  // Copiar Resumo para WhatsApp (Individual)
  const copiarWhatsAppLeito = (item) => {
    vibrar([30]);
    const dataHoraStr = new Date().toLocaleString('pt-BR');
    const ultimosRegs = item.registros && item.registros.length > 0 
      ? item.registros.slice(0, 2).map((r) => `*${r.autor || 'Profissional'}* (${new Date(r.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}):\n"${r.texto}"`).join('\n\n')
      : '_Sem registros recentes._';

    const critLabels = { ESTAVEL: '🟢 Estável', ATENCAO: '🟡 Atenção / Observação', CRITICO: '🔴 Crítico / Prioritário' };

    const msg = [
      `🏥 *CORRIDA DE LEITO — BOLETIM RÁPIDO*`,
      `🛏️ *Acomodação:* ${item.leito}`,
      `👤 *Paciente:* ${item.paciente}`,
      `🎯 *Criticidade:* ${critLabels[item.criticidade] || '🟢 Estável'}`,
      `📌 *Status:* ${item.status === 'ALTA' ? 'ALTA HOSPITALAR' : 'EM TRATAMENTO / ATIVO'}`,
      `⏱️ *Emitido em:* ${dataHoraStr}`,
      `---------------------------------------`,
      `📋 *ÚLTIMA CONDUTA / EVOLUÇÃO:*`,
      ultimosRegs,
      `---------------------------------------`,
      `_Sistema de Corrida de Leito & Passagem de Plantão_`
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      dispararToast(`Resumo do ${item.leito} copiado para a área de transferência!`);
    } else {
      alert('Texto gerado:\n\n' + msg);
    }
  };

  // Copiar Resumo Geral para WhatsApp
  const copiarWhatsAppGeral = () => {
    vibrar([40]);
    const ativos = leitos.filter((l) => (l.status || 'ATIVO') === 'ATIVO');
    if (ativos.length === 0) {
      alert('Não há leitos ativos para exportar resumo.');
      return;
    }

    const critEmojis = { ESTAVEL: '🟢', ATENCAO: '🟡', CRITICO: '🔴' };

    const linhas = [
      `🏥 *BOLETIM GERAL — CORRIDA DE LEITO & PASSAGEM DE PLANTÃO*`,
      `👨‍⚕️ *Responsável:* ${autor}`,
      `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`,
      `🛏️ *Total de Leitos Ativos:* ${ativos.length}`,
      `=======================================`
    ];

    ativos.forEach((l, idx) => {
      const emoji = critEmojis[l.criticidade] || '🟢';
      const ultimo = l.registros && l.registros.length > 0 ? l.registros[0] : null;
      linhas.push(`\n*${idx + 1}. [${emoji}] ${l.leito} — ${l.paciente}*`);
      if (ultimo) {
        linhas.push(`↳ _${ultimo.autor || 'Equipe'}:_ ${ultimo.texto.substring(0, 140)}${ultimo.texto.length > 140 ? '...' : ''}`);
      } else {
        linhas.push(`↳ _Sem visitas registradas hoje._`);
      }
    });

    linhas.push(`\n=======================================`);
    linhas.push(`_Relatório compilado automaticamente._`);

    const textoFinal = linhas.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textoFinal);
      dispararToast(`Resumo geral de todos os ${ativos.length} leitos copiado para o WhatsApp!`);
    } else {
      alert('Resumo Geral:\n\n' + textoFinal);
    }
  };

  // Exportar PDF
  const exportarPDF = (item) => {
    vibrar([30]);
    const doc = new jsPDF();

    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text("REGISTRO DE CORRIDA DE LEITO — PRONTUÁRIO", 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hospital Geral • Paciente: ${item.paciente} | Leito: ${item.leito} • Emissão: ${new Date().toLocaleString('pt-BR')}`, 14, 19);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Identificação:", 14, 35);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paciente: ${item.paciente}`, 14, 42);
    doc.text(`Acomodação: ${item.leito}`, 14, 48);
    doc.text(`Criticidade / Risco: ${item.criticidade || 'ESTAVEL'}`, 14, 54);
    doc.text(`Status Atual: ${item.status === 'ALTA' ? 'ALTA HOSPITALAR' : 'ATIVO / EM ACOMPANHAMENTO'}`, 14, 60);
    doc.text(`Total de Registros Realizados: ${item.registros?.length || 0}`, 14, 66);

    let y = 78;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Histórico de Registros e Condutas Multiprofissionais:", 14, y);
    y += 8;

    if (!item.registros || item.registros.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text("Nenhum registro clínico adicionado ainda.", 14, y);
    } else {
      item.registros.forEach((r, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 7, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const dataStr = r.data_hora ? new Date(r.data_hora).toLocaleString('pt-BR') : '-';
        doc.text(`Registro #${idx + 1} — ${dataStr} • Autor: ${r.autor || 'Profissional'} (Via ${r.tipo || 'Texto'})`, 16, y + 5);
        y += 11;

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        
        const linhasTexto = doc.splitTextToSize(r.texto, 178);
        doc.text(linhasTexto, 16, y);
        y += (linhasTexto.length * 5) + 6;
      });
    }

    doc.save(`registros_${item.leito.replace(/\s+/g, '_')}_${item.paciente.replace(/\s+/g, '_')}.pdf`);
  };

  // Exportar TXT
  const exportarTXT = (item) => {
    vibrar([30]);
    let conteudo = `========================================================\n`;
    conteudo += `PRONTUÁRIO DE CORRIDA DE LEITO — REGISTRO DO PACIENTE\n`;
    conteudo += `========================================================\n`;
    conteudo += `Leito: ${item.leito}\n`;
    conteudo += `Paciente: ${item.paciente}\n`;
    conteudo += `Criticidade / Risco: ${item.criticidade || 'ESTAVEL'}\n`;
    conteudo += `Status: ${item.status === 'ALTA' ? 'ALTA HOSPITALAR' : 'ATIVO'}\n`;
    conteudo += `Data de Emissão: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudo += `Total de Registros: ${item.registros?.length || 0}\n`;
    conteudo += `--------------------------------------------------------\n\n`;

    if (!item.registros || item.registros.length === 0) {
      conteudo += `Nenhum registro gravado.\n`;
    } else {
      item.registros.forEach((r, idx) => {
        const dataStr = r.data_hora ? new Date(r.data_hora).toLocaleString('pt-BR') : '-';
        conteudo += `[Registro #${idx + 1} — ${dataStr} • Autor: ${r.autor || 'Profissional'} (Via ${r.tipo || 'Texto'})]\n`;
        conteudo += `${r.texto}\n\n`;
      });
    }

    conteudo += `========================================================\n`;

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registros_${item.leito.replace(/\s+/g, '_')}_${item.paciente.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtragem e Ordenação Inteligente
  const leitosFiltrados = leitos.filter((l) => {
    const statusValido = abaAtiva === 'ATIVOS' 
      ? (l.status || 'ATIVO') === 'ATIVO' 
      : l.status === 'ALTA';
    
    if (!statusValido) return false;

    if (!busca) return true;
    const b = busca.toLowerCase();
    return l.leito.toLowerCase().includes(b) || l.paciente.toLowerCase().includes(b);
  }).sort((a, b) => {
    if (criterioOrdenacao === 'CORREDOR') {
      return a.leito.localeCompare(b.leito, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (criterioOrdenacao === 'CRITICIDADE') {
      const peso = { CRITICO: 3, ATENCAO: 2, ESTAVEL: 1 };
      const pesoA = peso[a.criticidade] || 1;
      const pesoB = peso[b.criticidade] || 1;
      return pesoB - pesoA;
    }
    if (criterioOrdenacao === 'PENDENTES') {
      const temRegsHojeA = a.registros && a.registros.length > 0;
      const temRegsHojeB = b.registros && b.registros.length > 0;
      if (!temRegsHojeA && temRegsHojeB) return -1;
      if (temRegsHojeA && !temRegsHojeB) return 1;
      return 0;
    }
    if (criterioOrdenacao === 'RECENTES') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return 0;
  });

  const contagemAtivos = leitos.filter((l) => (l.status || 'ATIVO') === 'ATIVO').length;
  const contagemAltas = leitos.filter((l) => l.status === 'ALTA').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Toast flutuante de Notificação */}
      {toastMensagem && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-sky-600 text-white rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* Topo / Navbar Direta */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Corrida de Leito</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 rounded-full border border-sky-200 dark:border-sky-800">
                  v2.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registro Clínico Rápido por Texto ou Áudio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Instalar App (PWA) */}
            {installPrompt && (
              <button
                type="button"
                onClick={instalarPWA}
                title="Instalar aplicativo na tela inicial do celular/computador"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Alternador de Modo Noturno (Plantão) */}
            <button
              type="button"
              onClick={() => {
                vibrar([20]);
                setDarkMode(!darkMode);
              }}
              title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Noturno (Plantão)"}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Seletor de Autor / Profissional Responsável */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {editandoAutor ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={autor}
                  onBlur={(e) => handleSalvarAutor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSalvarAutor(e.target.value);
                  }}
                  className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded px-1.5 py-0.5 focus:outline-none w-28"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoAutor(true)}
                  title="Clique para alterar o nome do profissional que assina os registros"
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                >
                  <span>{autor}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal underline">(alterar)</span>
                </button>
              )}
            </div>

            {/* Exportar Resumo Geral para WhatsApp */}
            <button
              type="button"
              onClick={copiarWhatsAppGeral}
              title="Copiar boletim geral com todos os leitos ativos para WhatsApp"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 transition-all active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Plantão WhatsApp</span>
            </button>

            {/* Botão Adicionar Leito */}
            <button
              type="button"
              onClick={() => setShowModalNovoLeito(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Leito</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        
        {/* Barra de Filtros, Abas (Ativos vs Altas), Ordenação e Busca */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
          
          {/* Navegação de Abas: Ativos vs Altas */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { vibrar([20]); setAbaAtiva('ATIVOS'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                abaAtiva === 'ATIVOS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Leitos Ativos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                abaAtiva === 'ATIVOS' 
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {contagemAtivos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { vibrar([20]); setAbaAtiva('ALTAS'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                abaAtiva === 'ALTAS'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Histórico de Altas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                abaAtiva === 'ALTAS' 
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {contagemAltas}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Seletor de Ordenação Inteligente */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ordenar:</span>
              <select
                value={criterioOrdenacao}
                onChange={(e) => {
                  vibrar([20]);
                  setCriterioOrdenacao(e.target.value);
                }}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="CORREDOR" className="dark:bg-slate-900">Corredor (101, 102...)</option>
                <option value="CRITICIDADE" className="dark:bg-slate-900">Criticidade (🔴 primeiro)</option>
                <option value="PENDENTES" className="dark:bg-slate-900">Não visitados hoje</option>
                <option value="RECENTES" className="dark:bg-slate-900">Mais recentes</option>
              </select>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="w-full sm:w-56 relative">
              <input
                type="text"
                placeholder="Buscar leito ou paciente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>
          </div>
        </div>

        {/* Modal Adicionar Leito */}
        {showModalNovoLeito && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Cadastrar Leito e Paciente</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Informe a acomodação e o nome completo do paciente para iniciar a corrida.</p>

              <form onSubmit={handleCriarLeito} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Identificação do Leito</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Leito 101, UTI-02, Sala 04..."
                    value={novoLeitoNum}
                    onChange={(e) => setNovoLeitoNum(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Paciente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Maria Francisca da Silva..."
                    value={novoPacienteNome}
                    onChange={(e) => setNovoPacienteNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classificação Inicial de Risco</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ESTAVEL', label: 'Estável 🟢', bg: 'border-emerald-500 text-emerald-700 dark:text-emerald-400' },
                      { id: 'ATENCAO', label: 'Atenção 🟡', bg: 'border-amber-500 text-amber-700 dark:text-amber-400' },
                      { id: 'CRITICO', label: 'Crítico 🔴', bg: 'border-rose-500 text-rose-700 dark:text-rose-400' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { vibrar([20]); setNovaCriticidade(c.id); }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border-2 transition-all ${
                          novaCriticidade === c.id 
                            ? `${c.bg} bg-slate-50 dark:bg-slate-800 shadow-sm` 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModalNovoLeito(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20"
                  >
                    Salvar Leito
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Leito / Paciente */}
        {leitoEmEdicao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Editar Identificação</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Atualize o número do leito ou corrija o nome do paciente sem perder o histórico.</p>

              <form onSubmit={handleSalvarEdicao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Identificação do Leito</label>
                  <input
                    type="text"
                    required
                    value={editLeitoNome}
                    onChange={(e) => setEditLeitoNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Paciente</label>
                  <input
                    type="text"
                    required
                    value={editPacienteNome}
                    onChange={(e) => setEditPacienteNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLeitoEmEdicao(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de Leitos */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">Carregando leitos do sistema...</div>
        ) : leitosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <BedDouble className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
              {abaAtiva === 'ATIVOS' ? 'Nenhum leito ativo no momento' : 'Nenhuma alta registrada ainda'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {abaAtiva === 'ATIVOS' 
                ? 'Clique no botão "Adicionar Leito" acima para cadastrar o primeiro leito e começar a corrida.'
                : 'Quando um paciente receber alta, clique no botão "Dar Alta" no card para arquivá-lo aqui com histórico integral.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {leitosFiltrados.map((item) => {
              const estaGravando = gravandoLeitoId === item.id;
              const textoAtual = textosEntrada[item.id] || '';
              const isAlta = item.status === 'ALTA';
              const crit = item.criticidade || 'ESTAVEL';

              return (
                <div 
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-5 space-y-4 hover:shadow-md transition-all ${
                    isAlta 
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/10' 
                      : crit === 'CRITICO'
                        ? 'border-rose-300 dark:border-rose-900/70 ring-1 ring-rose-200 dark:ring-rose-950'
                        : crit === 'ATENCAO'
                          ? 'border-amber-300 dark:border-amber-900/70'
                          : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-xs font-black rounded-md tracking-wide ${
                          isAlta 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                        }`}>
                          {item.leito}
                        </span>

                        {/* Seletor de Criticidade com 1 Toque (somente para leitos ativos) */}
                        {!isAlta && (
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {[
                              { id: 'ESTAVEL', emoji: '🟢', title: 'Estável' },
                              { id: 'ATENCAO', emoji: '🟡', title: 'Atenção' },
                              { id: 'CRITICO', emoji: '🔴', title: 'Crítico' }
                            ].map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleMudarCriticidade(item.id, c.id)}
                                title={`Marcar como ${c.title}`}
                                className={`px-1.5 py-0.5 text-xs rounded-md transition-all ${
                                  crit === c.id
                                    ? 'bg-white dark:bg-slate-700 shadow-sm font-bold scale-105'
                                    : 'opacity-40 hover:opacity-100'
                                }`}
                              >
                                {c.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {isAlta && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Alta Concluída
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          {item.paciente}
                        </h3>

                        {/* Botão de Edição Rápida (Lápis ✏️) */}
                        <button
                          type="button"
                          onClick={() => abrirEdicaoLeito(item)}
                          title="Editar identificação do leito ou nome do paciente"
                          className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botão de WhatsApp Rápido do Card */}
                      <button
                        type="button"
                        onClick={() => copiarWhatsAppLeito(item)}
                        title="Copiar resumo deste paciente para WhatsApp"
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Ações de Alta / Reativação */}
                      {isAlta ? (
                        <button
                          type="button"
                          onClick={() => handleReativarLeito(item.id, item.leito, item.paciente)}
                          title="Reativar este paciente na lista de leitos ativos"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reativar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDarAlta(item.id, item.leito, item.paciente)}
                          title="Registrar alta médica do paciente"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors active:scale-95"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Dar Alta</span>
                        </button>
                      )}

                      {/* Excluir leito */}
                      <button
                        type="button"
                        onClick={() => handleExcluirLeito(item.id, item.leito)}
                        title="Excluir leito definitivamente"
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Área de Entrada: Digitação ou Voz (Somente para leitos ativos) */}
                  {!isAlta && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <span>Novo Registro:</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">({autor})</span>
                        </span>
                        {estaGravando && (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 text-[11px] animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                            Gravando áudio ao vivo... Fale agora
                          </span>
                        )}
                      </div>

                      {/* Chips Clínicos Rápidos de 1 Toque */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {chipsClinicos.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInserirChip(item.id, chip.texto)}
                            title={`Inserir: "${chip.texto}"`}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-200 dark:hover:border-sky-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-all active:scale-95"
                          >
                            + {chip.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <textarea
                          rows="3"
                          placeholder="Digite ou clique no microfone para ditar: PA, saturação, FC, dispositivos, condutas..."
                          value={textoAtual}
                          onChange={(e) => setTextosEntrada({ ...textosEntrada, [item.id]: e.target.value })}
                          className={`w-full p-3 text-xs rounded-xl border focus:outline-none transition-all ${
                            estaGravando 
                              ? 'border-rose-400 ring-2 ring-rose-300 bg-rose-50/20 dark:bg-rose-950/20' 
                              : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-sky-500 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                          }`}
                        ></textarea>

                        {/* Botão de Microfone Flutuante */}
                        <button
                          type="button"
                          onClick={() => {
                            if (estaGravando) {
                              pararGravacao();
                            } else {
                              iniciarGravacao(item.id);
                            }
                          }}
                          title={estaGravando ? "Parar gravação" : "Ditar por voz (pt-BR)"}
                          className={`absolute right-3 bottom-3 p-2 rounded-full transition-all shadow-md active:scale-95 ${
                            estaGravando 
                              ? 'bg-rose-600 text-white animate-bounce' 
                              : 'bg-sky-600 hover:bg-sky-700 text-white'
                          }`}
                        >
                          {estaGravando ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSalvarRegistro(item.id, estaGravando ? 'VOZ' : 'TEXTO')}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Salvar Registro
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Histórico de Registros Anteriores com Sinais Vitais */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>Histórico do Paciente ({item.registros?.length || 0})</span>
                    </div>

                    {item.registros && item.registros.length > 0 ? (
                      <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                        {item.registros.map((reg) => {
                          const sinais = extrairSinaisVitais(reg.texto);

                          return (
                            <div 
                              key={reg.id} 
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  {new Date(reg.data_hora).toLocaleString('pt-BR')} • {reg.autor || 'Profissional'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px] border border-slate-200 dark:border-slate-700 font-bold">
                                  {reg.tipo === 'VOZ' ? '🎤 Voz' : '⌨️ Texto'}
                                </span>
                              </div>

                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {reg.texto}
                              </p>

                              {/* Pílulas Inteligentes de Sinais Vitais Detectados */}
                              {sinais.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                                  {sinais.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        s.alterado
                                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                          : 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                      }`}
                                      title={s.alerta || 'Dentro dos limites de referência'}
                                    >
                                      {s.alterado ? <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> : <Activity className="w-3 h-3 text-sky-600 dark:text-sky-400" />}
                                      {s.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhum registro gravado ainda. Digite ou use o microfone acima.
                      </p>
                    )}
                  </div>

                  {/* Barra Inferior de Download do Arquivo do Paciente */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Exportar Registros:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => exportarPDF(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Baixar PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => exportarTXT(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar TXT
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
