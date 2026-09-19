from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from .models import PassagemPlantao
from .schemas import PassagemPlantaoCreate, PassagemPlantaoResponse

router = APIRouter(prefix="/api/plantao", tags=["Passagem de Plantão SBAR"])


@router.post("", response_model=PassagemPlantaoResponse, status_code=status.HTTP_201_CREATED)
def criar_passagem_plantao(data: PassagemPlantaoCreate, db: Session = Depends(get_db)):
    plantao = PassagemPlantao(**data.dict())
    db.add(plantao)
    db.commit()
    db.refresh(plantao)
    return plantao


@router.get("/unidade/{unidade}", response_model=List[PassagemPlantaoResponse])
def listar_por_unidade(unidade: str, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(PassagemPlantao)\
        .filter(PassagemPlantao.unidade == unidade)\
        .order_by(PassagemPlantao.data_hora.desc())\
        .limit(limit)\
        .all()


@router.get("/ultimo/{unidade}", response_model=PassagemPlantaoResponse)
def obter_ultimo_plantao(unidade: str, db: Session = Depends(get_db)):
    plantao = db.query(PassagemPlantao)\
        .filter(PassagemPlantao.unidade == unidade)\
        .order_by(PassagemPlantao.data_hora.desc())\
        .first()
    if not plantao:
        raise HTTPException(status_code=404, detail="Nenhum plantão anterior encontrado para esta unidade.")
    return plantao
