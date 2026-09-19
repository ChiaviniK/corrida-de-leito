import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Leito(Base):
    __tablename__ = "leitos"

    id = Column(String, primary_key=True, default=generate_uuid)
    codigo = Column(String(50), unique=True, nullable=False, index=True)  # ex.: "UTI-01", "ENF-102A"
    unidade = Column(String(100), nullable=False, index=True)             # ex.: "UTI Geral", "Enfermaria Clínica"
    tipo = Column(String(50), default="CLINICO")                          # CLINICO, UTI, CIRURGICO, ISOLAMENTO
    status = Column(String(50), default="LIVRE")                          # LIVRE, OCUPADO, AGUARDANDO_LIMPEZA, BLOQUEADO
    paciente_atual_id = Column(String, ForeignKey("pacientes.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    paciente = relationship("Paciente", back_populates="leito_atual", foreign_keys=[paciente_atual_id])
    registros_corrida = relationship("RegistroCorridaLeito", back_populates="leito", cascade="all, delete-orphan")


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(String, primary_key=True, default=generate_uuid)
    prontuario = Column(String(50), unique=True, nullable=False, index=True)
    nome = Column(String(150), nullable=False)
    idade = Column(Integer, nullable=True)
    genero = Column(String(20), nullable=True)
    diagnostico_principal = Column(Text, nullable=True)
    data_internacao = Column(DateTime, default=datetime.utcnow)
    alergias = Column(Text, default="Nega alergias conhecidas")
    precaucao = Column(String(50), default="PADRAO")                      # PADRAO, CONTATO, GOTICULAS, AEROSSOIS
    created_at = Column(DateTime, default=datetime.utcnow)

    leito_atual = relationship("Leito", back_populates="paciente", foreign_keys=[Leito.paciente_atual_id])
    registros_corrida = relationship("RegistroCorridaLeito", back_populates="paciente", cascade="all, delete-orphan")


class RegistroCorridaLeito(Base):
    __tablename__ = "registros_corrida_leito"

    id = Column(String, primary_key=True, default=generate_uuid)
    leito_id = Column(String, ForeignKey("leitos.id"), nullable=False, index=True)
    paciente_id = Column(String, ForeignKey("pacientes.id"), nullable=False, index=True)
    data_hora = Column(DateTime, default=datetime.utcnow, index=True)
    responsavel_nome = Column(String(100), nullable=False)
    responsavel_cargo = Column(String(50), default="MULTIDISCIPLINAR")    # MEDICO, ENFERMEIRO, FISIOTERAPEUTA, ETC.

    # 1. Avaliação Física e Clínica (Sinais Vitais)
    pa_sistolica = Column(Integer, nullable=True)                         # ex.: 120
    pa_diastolica = Column(Integer, nullable=True)                        # ex.: 80
    fc = Column(Integer, nullable=True)                                   # bpm
    fr = Column(Integer, nullable=True)                                   # irpm
    temp = Column(Float, nullable=True)                                   # °C
    sato2 = Column(Integer, nullable=True)                                # %
    suporte_o2 = Column(String(100), default="Ar ambiente")              # Ar ambiente, Cateter nasal, Venturi, VNI, TOT
    glicemia = Column(Integer, nullable=True)                             # mg/dL
    nivel_consciencia = Column(String(50), default="Lúcido/Orientado")    # Lúcido, Sonolento, Torporoso, Sedado (RASS -3)
    escala_dor = Column(Integer, default=0)                               # 0 a 10

    # 2. Checagem de Dispositivos Invasivos
    acesso_venoso = Column(String(100), default="Nenhum")                 # AVP MSE, CVC Jugular, PICC
    acesso_venoso_aspecto = Column(String(100), default="Limpo/Sem flogose")
    sonda_alimentar = Column(String(50), default="Nenhuma")               # SNG, SNE, GTT
    sonda_vesical = Column(String(50), default="Nenhuma")                 # SVD, Alívio
    debito_urinario_aspecto = Column(String(100), default="Claro")        # Claro, Concentrado, Piúria, Hematúria
    debito_urinario_ml = Column(Integer, nullable=True)                   # Débito recente
    drenos_descricao = Column(Text, default="Sem drenos")
    infusoes_ativas = Column(Text, default="Nenhuma")                     # ex.: Noradrenalina 0.1mcg/kg/min, Fentanil

    # 3. Exame do Paciente & Pele
    lesao_pressao = Column(Boolean, default=False)
    lesao_pressao_detalhe = Column(Text, default="Pele íntegra")
    curativos_ativos = Column(Text, default="Nenhum")
    evolucao_clinica = Column(Text, default="")                           # Resumo clínico / exame sumário

    # 4. Discussão de Condutas & Metas do Dia
    conduta_medica = Column(Text, default="")
    conduta_enfermagem = Column(Text, default="")
    conduta_fisioterapia = Column(Text, default="")
    conduta_nutricao = Column(Text, default="")
    exames_pendentes = Column(Text, default="")
    previsao_alta = Column(String(50), default="Indefinida")              # 24h, 48h, 72h, > 7 dias

    # Transcrição de Voz e Gravação
    transcricao_voz_bruta = Column(Text, nullable=True)                   # O texto integral ditado verbalmente
    audio_nota = Column(Text, nullable=True)                              # Base64 ou URL do áudio gravado

    leito = relationship("Leito", back_populates="registros_corrida")
    paciente = relationship("Paciente", back_populates="registros_corrida")


class PassagemPlantao(Base):
    __tablename__ = "passagens_plantao"

    id = Column(String, primary_key=True, default=generate_uuid)
    unidade = Column(String(100), nullable=False, index=True)
    data_hora = Column(DateTime, default=datetime.utcnow, index=True)
    turno = Column(String(20), default="DIURNO")                          # DIURNO, NOTURNO
    plantonista_passando = Column(String(100), nullable=False)
    plantonista_recebendo = Column(String(100), nullable=False)

    # Metodologia SBAR
    situacao_sbar = Column(Text, nullable=False)                          # S - Situação geral da ala
    background_sbar = Column(Text, default="")                            # B - Contexto e histórico
    avaliacao_sbar = Column(Text, default="")                             # A - Intercorrências nas últimas 12h
    recomendacao_sbar = Column(Text, default="")                          # R - Pendências para o próximo plantão

    transcricao_voz_bruta = Column(Text, nullable=True)
    leitos_resumo_json = Column(Text, default="[]")                       # Snapshot dos leitos no plantão


class SimpleLeito(Base):
    __tablename__ = "simple_leitos"

    id = Column(String, primary_key=True, default=generate_uuid)
    leito = Column(String(50), nullable=False)          # ex: "Leito 101", "UTI 02"
    paciente = Column(String(150), nullable=False)      # ex: "Maria Francisca"
    status = Column(String(20), default="ATIVO")        # "ATIVO" ou "ALTA"
    criticidade = Column(String(20), default="ESTAVEL") # "ESTAVEL", "ATENCAO", "CRITICO"
    created_at = Column(DateTime, default=datetime.utcnow)

    registros = relationship("SimpleRegistro", back_populates="leito_rel", cascade="all, delete-orphan", order_by="desc(SimpleRegistro.data_hora)")


class SimpleRegistro(Base):
    __tablename__ = "simple_registros"

    id = Column(String, primary_key=True, default=generate_uuid)
    leito_id = Column(String, ForeignKey("simple_leitos.id"), nullable=False, index=True)
    texto = Column(Text, nullable=False)
    data_hora = Column(DateTime, default=datetime.utcnow, index=True)
    tipo = Column(String(20), default="TEXTO")          # TEXTO ou VOZ
    autor = Column(String(100), default="Profissional") # ex: "Dra. Camila"

    leito_rel = relationship("SimpleLeito", back_populates="registros")


