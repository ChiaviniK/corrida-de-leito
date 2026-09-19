from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Paciente Schemas
class PacienteBase(BaseModel):
    prontuario: str
    nome: str
    idade: Optional[int] = None
    genero: Optional[str] = None
    diagnostico_principal: Optional[str] = None
    alergias: Optional[str] = "Nega alergias conhecidas"
    precaucao: Optional[str] = "PADRAO"


class PacienteCreate(PacienteBase):
    pass


class PacienteResponse(PacienteBase):
    id: str
    data_internacao: datetime

    class Config:
        from_attributes = True


# Leito Schemas
class LeitoBase(BaseModel):
    codigo: str
    unidade: str
    tipo: Optional[str] = "CLINICO"
    status: Optional[str] = "LIVRE"


class LeitoCreate(LeitoBase):
    paciente_atual_id: Optional[str] = None


class LeitoResponse(LeitoBase):
    id: str
    paciente_atual_id: Optional[str] = None
    paciente: Optional[PacienteResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Registro da Corrida de Leito Schemas
class RegistroCorridaCreate(BaseModel):
    leito_id: str
    paciente_id: str
    responsavel_nome: str
    responsavel_cargo: Optional[str] = "MULTIDISCIPLINAR"

    # Sinais Vitais
    pa_sistolica: Optional[int] = None
    pa_diastolica: Optional[int] = None
    fc: Optional[int] = None
    fr: Optional[int] = None
    temp: Optional[float] = None
    sato2: Optional[int] = None
    suporte_o2: Optional[str] = "Ar ambiente"
    glicemia: Optional[int] = None
    nivel_consciencia: Optional[str] = "Lúcido/Orientado"
    escala_dor: Optional[int] = 0

    # Dispositivos
    acesso_venoso: Optional[str] = "Nenhum"
    acesso_venoso_aspecto: Optional[str] = "Limpo/Sem flogose"
    sonda_alimentar: Optional[str] = "Nenhuma"
    sonda_vesical: Optional[str] = "Nenhuma"
    debito_urinario_aspecto: Optional[str] = "Claro"
    debito_urinario_ml: Optional[int] = None
    drenos_descricao: Optional[str] = "Sem drenos"
    infusoes_ativas: Optional[str] = "Nenhuma"

    # Exame de Pele
    lesao_pressao: Optional[bool] = False
    lesao_pressao_detalhe: Optional[str] = "Pele íntegra"
    curativos_ativos: Optional[str] = "Nenhum"
    evolucao_clinica: Optional[str] = ""

    # Condutas e Metas
    conduta_medica: Optional[str] = ""
    conduta_enfermagem: Optional[str] = ""
    conduta_fisioterapia: Optional[str] = ""
    conduta_nutricao: Optional[str] = ""
    exames_pendentes: Optional[str] = ""
    previsao_alta: Optional[str] = "Indefinida"

    # Voz
    transcricao_voz_bruta: Optional[str] = None
    audio_nota: Optional[str] = None


class RegistroCorridaResponse(RegistroCorridaCreate):
    id: str
    data_hora: datetime

    class Config:
        from_attributes = True


# Passagem de Plantão SBAR Schemas
class PassagemPlantaoCreate(BaseModel):
    unidade: str
    turno: Optional[str] = "DIURNO"
    plantonista_passando: str
    plantonista_recebendo: str
    situacao_sbar: str
    background_sbar: Optional[str] = ""
    avaliacao_sbar: Optional[str] = ""
    recomendacao_sbar: Optional[str] = ""
    transcricao_voz_bruta: Optional[str] = None
    leitos_resumo_json: Optional[str] = "[]"


class PassagemPlantaoResponse(PassagemPlantaoCreate):
    id: str
    data_hora: datetime

    class Config:
        from_attributes = True


# Parser Clínico de Voz
class ClinicalParseRequest(BaseModel):
    transcription: str


class ClinicalParseResponse(BaseModel):
    pa_sistolica: Optional[int] = None
    pa_diastolica: Optional[int] = None
    fc: Optional[int] = None
    fr: Optional[int] = None
    temp: Optional[float] = None
    sato2: Optional[int] = None
    suporte_o2: Optional[str] = None
    glicemia: Optional[int] = None
    nivel_consciencia: Optional[str] = None
    acesso_venoso: Optional[str] = None
    sonda_vesical: Optional[str] = None
    sonda_alimentar: Optional[str] = None
    lesao_pressao: Optional[bool] = None
    conduta_medica: Optional[str] = None
    conduta_enfermagem: Optional[str] = None
    exames_pendentes: Optional[str] = None
    detected_entities: List[str] = []
