import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

export default function VoiceInput({ 
  onTranscription, 
  onAutoFill, 
  placeholder = "Pressione o microfone e dite os dados da visita...",
  compact = false 
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [browserSupport, setBrowserSupport] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const fullText = (final || interim).trim();
      setTranscript(fullText);

      if (onTranscription) {
        onTranscription(fullText);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Erro no reconhecimento de voz:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Se ainda estava marcado como listening, reinicia para ditado contínuo
      if (recognitionRef.current && isListening) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (onAutoFill && transcript) {
        onAutoFill(transcript);
      }
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Falha ao iniciar microfone:', err);
      }
    }
  };

  if (!browserSupport) {
    return (
      <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Seu navegador não suporta a Web Speech API. Recomendamos o uso do <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> no celular ou computador para ditado por voz.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? "Parar ditado e preencher" : "Ditar por voz"}
        className={`p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 ${
          isListening 
            ? 'bg-rose-600 text-white animate-recording shadow-lg shadow-rose-500/30' 
            : 'bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-slate-700'
        }`}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="w-full bg-sky-50/70 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 rounded-xl p-3.5 transition-all shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-full ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-sky-600 text-white'}`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Ditado de Voz Clínico (pt-BR)
              {isListening && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  Ouvindo ao vivo...
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isListening 
                ? "Fale normalmente: sinais vitais, dispositivos e condutas serão extraídos." 
                : placeholder}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md active:scale-95 ${
            isListening 
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-recording shadow-rose-500/25' 
              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/25'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Concluir Ditado</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Gravar Voz</span>
            </>
          )}
        </button>
      </div>

      {/* Caixa de transcrição ao vivo */}
      {transcript && (
        <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 italic">
          "{transcript}"
        </div>
      )}
    </div>
  );
}
