from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .database import get_db
from .models import RegistroCorridaLeito, Leito, Paciente
from .schemas import (
    RegistroCorridaCreate, RegistroCorridaResponse,
    ClinicalParseRequest, ClinicalParseResponse
)
from .clinical_parser import parse_clinical_speech

router = APIRouter(prefix="/api/corrida", tags=["Corrida de Leito"])


@router.post("", response_model=RegistroCorridaResponse, status_code=status.HTTP_201_CREATED)
def criar_registro_corrida(data: RegistroCorridaCreate, db: Session = Depends(get_db)):
    leito = db.query(Leito).filter(Leito.id == data.leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito informado não foi encontrado.")

    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente informado não foi encontrado.")

    registro = RegistroCorridaLeito(**data.dict())
    db.add(registro)
    
    # Atualiza timestamp de modificação do leito
    leito.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/leito/{leito_id}", response_model=List[RegistroCorridaResponse])
def listar_por_leito(leito_id: str, db: Session = Depends(get_db)):
    return db.query(RegistroCorridaLeito)\
        .filter(RegistroCorridaLeito.leito_id == leito_id)\
        .order_by(RegistroCorridaLeito.data_hora.desc())\
        .all()


@router.get("/paciente/{paciente_id}", response_model=List[RegistroCorridaResponse])
def listar_por_paciente(paciente_id: str, db: Session = Depends(get_db)):
    return db.query(RegistroCorridaLeito)\
        .filter(RegistroCorridaLeito.paciente_id == paciente_id)\
        .order_by(RegistroCorridaLeito.data_hora.desc())\
        .all()


@router.get("/recente", response_model=List[RegistroCorridaResponse])
def listar_recentes(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(RegistroCorridaLeito)\
        .order_by(RegistroCorridaLeito.data_hora.desc())\
        .limit(limit)\
        .all()


@router.post("/parse-speech", response_model=ClinicalParseResponse)
def analisar_fala_clinica(req: ClinicalParseRequest):
    """
    Recebe a transcrição de voz capturada pelo navegador e devolve os
    parâmetros clínicos estruturados para pré-preenchimento da tela.
    """
    parsed = parse_clinical_speech(req.transcription)
    return ClinicalParseResponse(**parsed)
