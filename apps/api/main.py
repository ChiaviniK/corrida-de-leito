import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from .database import engine, Base, get_db
from .models import Leito, Paciente, RegistroCorridaLeito, PassagemPlantao, SimpleLeito, SimpleRegistro
from pydantic import BaseModel
from .schemas import (
    LeitoResponse, LeitoCreate, PacienteResponse, PacienteCreate
)
from .routes_corrida import router as corrida_router
from .routes_plantao import router as plantao_router
from .routes_export import router as export_router

# Criação das tabelas no banco de dados
Base.metadata.create_all(bind=engine)

def _ensure_sqlite_columns():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(simple_leitos)")).fetchall()
            cols = [r[1] for r in res]
            if "status" not in cols:
                conn.execute(text("ALTER TABLE simple_leitos ADD COLUMN status VARCHAR(20) DEFAULT 'ATIVO'"))
                conn.commit()

            if "criticidade" not in cols:
                conn.execute(text("ALTER TABLE simple_leitos ADD COLUMN criticidade VARCHAR(20) DEFAULT 'ESTAVEL'"))
                conn.commit()

            res_reg = conn.execute(text("PRAGMA table_info(simple_registros)")).fetchall()
            cols_reg = [r[1] for r in res_reg]
            if "autor" not in cols_reg:
                conn.execute(text("ALTER TABLE simple_registros ADD COLUMN autor VARCHAR(100) DEFAULT 'Profissional'"))
                conn.commit()
    except Exception:
        pass

_ensure_sqlite_columns()

app = FastAPI(
    title="API de Corrida de Leito & Passagem de Plantão",
    description="Sistema para registro clínico multiprofissional com transcrição por voz e relatórios de leitos hospitalares.",
    version="1.0.0"
)

# CORS liberado para testes locais e em rede
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores
app.include_router(corrida_router)
app.include_router(plantao_router)
app.include_router(export_router)
# =========================================================================
# ENDPOINTS SIMPLIFICADOS: ADICIONAR LEITO, PACIENTE E REGISTROS (VOZ/TEXTO)
# =========================================================================

class SimpleLeitoCreate(BaseModel):
    leito: str
    paciente: str
    criticidade: str = "ESTAVEL"


class SimpleLeitoUpdate(BaseModel):
    leito: str
    paciente: str


class SimpleCriticidadeUpdate(BaseModel):
    criticidade: str


class SimpleRegistroCreate(BaseModel):
    texto: str
    tipo: str = "TEXTO"
    autor: str = "Profissional"


@app.get("/api/simple/leitos", tags=["Corrida de Leito Simplificada"])
def listar_leitos_simplificados(status_filtro: str = None, db: Session = Depends(get_db)):
    # Se não houver leitos, popula um exemplo
    if db.query(SimpleLeito).count() == 0:
        exemplo = SimpleLeito(leito="Leito 101", paciente="Dona Maria Silva", status="ATIVO", criticidade="ESTAVEL")
        db.add(exemplo)
        db.commit()
        db.refresh(exemplo)
        reg_exemplo = SimpleRegistro(
            leito_id=exemplo.id,
            texto="Pressão 125x80, FC 76 bpm, saturação 98% em ar ambiente, afebril. Mantendo acesso periférico limpo. Conduta: manter hidratação e solicitar hemograma.",
            tipo="VOZ",
            autor="Dra. Camila"
        )
        db.add(reg_exemplo)
        db.commit()

    query = db.query(SimpleLeito)
    if status_filtro:
        query = query.filter(SimpleLeito.status == status_filtro)
    
    leitos = query.order_by(SimpleLeito.created_at.desc()).all()
    resultado = []
    for l in leitos:
        resultado.append({
            "id": l.id,
            "leito": l.leito,
            "paciente": l.paciente,
            "status": l.status or "ATIVO",
            "criticidade": l.criticidade or "ESTAVEL",
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "registros": [
                {
                    "id": r.id,
                    "texto": r.texto,
                    "tipo": r.tipo,
                    "autor": r.autor or "Profissional",
                    "data_hora": r.data_hora.isoformat() if r.data_hora else None
                }
                for r in l.registros
            ]
        })
    return resultado


@app.post("/api/simple/leitos", status_code=status.HTTP_201_CREATED, tags=["Corrida de Leito Simplificada"])
def criar_leito_simplificado(data: SimpleLeitoCreate, db: Session = Depends(get_db)):
    nova_crit = (data.criticidade or "ESTAVEL").upper()
    novo = SimpleLeito(leito=data.leito.strip(), paciente=data.paciente.strip(), status="ATIVO", criticidade=nova_crit)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return {
        "id": novo.id,
        "leito": novo.leito,
        "paciente": novo.paciente,
        "status": "ATIVO",
        "criticidade": novo.criticidade,
        "created_at": novo.created_at.isoformat(),
        "registros": []
    }


@app.post("/api/simple/leitos/{leito_id}/registros", status_code=status.HTTP_201_CREATED, tags=["Corrida de Leito Simplificada"])
def adicionar_registro_leito(leito_id: str, data: SimpleRegistroCreate, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")

    novo_reg = SimpleRegistro(
        leito_id=leito.id,
        texto=data.texto.strip(),
        tipo=data.tipo,
        autor=data.autor.strip() if data.autor else "Profissional"
    )
    db.add(novo_reg)
    db.commit()
    db.refresh(novo_reg)
    return {
        "id": novo_reg.id,
        "texto": novo_reg.texto,
        "tipo": novo_reg.tipo,
        "autor": novo_reg.autor,
        "data_hora": novo_reg.data_hora.isoformat()
    }


@app.post("/api/simple/leitos/{leito_id}/alta", tags=["Corrida de Leito Simplificada"])
def dar_alta_paciente(leito_id: str, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")
    leito.status = "ALTA"
    db.commit()
    return {"mensagem": f"Alta registrada com sucesso para o paciente {leito.paciente}."}


@app.post("/api/simple/leitos/{leito_id}/reativar", tags=["Corrida de Leito Simplificada"])
def reativar_leito_paciente(leito_id: str, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")
    leito.status = "ATIVO"
    db.commit()
    return {"mensagem": f"Leito de {leito.paciente} reativado com sucesso."}


@app.put("/api/simple/leitos/{leito_id}", tags=["Corrida de Leito Simplificada"])
def atualizar_leito_simplificado(leito_id: str, data: SimpleLeitoUpdate, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")
    leito.leito = data.leito.strip()
    leito.paciente = data.paciente.strip()
    db.commit()
    db.refresh(leito)
    return {
        "id": leito.id,
        "leito": leito.leito,
        "paciente": leito.paciente,
        "status": leito.status or "ATIVO",
        "criticidade": leito.criticidade or "ESTAVEL"
    }


@app.patch("/api/simple/leitos/{leito_id}/criticidade", tags=["Corrida de Leito Simplificada"])
def atualizar_criticidade_leito(leito_id: str, data: SimpleCriticidadeUpdate, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")
    nova_crit = data.criticidade.strip().upper()
    if nova_crit not in ["ESTAVEL", "ATENCAO", "CRITICO"]:
        nova_crit = "ESTAVEL"
    leito.criticidade = nova_crit
    db.commit()
    db.refresh(leito)
    return {
        "id": leito.id,
        "criticidade": leito.criticidade
    }


@app.delete("/api/simple/leitos/{leito_id}", tags=["Corrida de Leito Simplificada"])
def excluir_leito_simplificado(leito_id: str, db: Session = Depends(get_db)):
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")
    db.delete(leito)
    db.commit()
    return {"mensagem": "Leito removido com sucesso."}


@app.get("/api/simple/leitos/{leito_id}/download", tags=["Corrida de Leito Simplificada"])
def baixar_arquivo_paciente(leito_id: str, db: Session = Depends(get_db)):
    from fastapi.responses import Response
    leito = db.query(SimpleLeito).filter(SimpleLeito.id == leito_id).first()
    if not leito:
        raise HTTPException(status_code=404, detail="Leito não encontrado.")

    linhas = [
        f"========================================================",
        f"PRONTUÁRIO DE CORRIDA DE LEITO — REGISTRO DO PACIENTE",
        f"========================================================",
        f"Leito: {leito.leito}",
        f"Paciente: {leito.paciente}",
        f"Status: {leito.status or 'ATIVO'}",
        f"Criticidade / Risco: {leito.criticidade or 'ESTAVEL'}",
        f"Data de Admissão no Sistema: {leito.created_at.strftime('%d/%m/%Y às %H:%M') if leito.created_at else '-'}",
        f"Total de Registros: {len(leito.registros)}",
        f"--------------------------------------------------------\n",
        f"HISTÓRICO DE ACOMPANHAMENTO E CONDUTAS:\n"
    ]

    for idx, r in enumerate(leito.registros, 1):
        data_str = r.data_hora.strftime('%d/%m/%Y %H:%M') if r.data_hora else '-'
        linhas.append(f"[{data_str}] — Registrado por: {r.autor or 'Profissional'} (Via {r.tipo})")
        linhas.append(f"{r.texto}\n")

    linhas.append("========================================================")
    conteudo = "\n".join(linhas)

    nome_arquivo = f"registros_{leito.leito.replace(' ', '_')}_{leito.paciente.replace(' ', '_')}.txt"
    return Response(
        content=conteudo,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'}
    )


# Endpoints de Leitos
@app.get("/api/leitos", response_model=List[LeitoResponse], tags=["Leitos"])
def listar_leitos(unidade: str = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Leito)
    if unidade:
        query = query.filter(Leito.unidade == unidade)
    if status:
        query = query.filter(Leito.status == status)
    return query.order_by(Leito.codigo.asc()).all()


@app.post("/api/leitos", response_model=LeitoResponse, status_code=status.HTTP_201_CREATED, tags=["Leitos"])
def criar_leito(data: LeitoCreate, db: Session = Depends(get_db)):
    existente = db.query(Leito).filter(Leito.codigo == data.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Código de leito já cadastrado.")
    leito = Leito(**data.dict())
    db.add(leito)
    db.commit()
    db.refresh(leito)
    return leito


# Endpoints de Pacientes
@app.get("/api/pacientes", response_model=List[PacienteResponse], tags=["Pacientes"])
def listar_pacientes(db: Session = Depends(get_db)):
    return db.query(Paciente).order_by(Paciente.nome.asc()).all()


@app.get("/api/pacientes/{id}", response_model=PacienteResponse, tags=["Pacientes"])
def obter_paciente(id: str, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    return p


@app.post("/api/seed", tags=["Administração"])
def popular_dados_demonstracao(db: Session = Depends(get_db)):
    """
    Popula dados realistas de leitos, pacientes e corridas de leito para testes imediatos.
    """
    if db.query(Leito).count() > 0:
        return {"mensagem": "O banco já possui dados cadastrados."}

    # 1. Criação de Pacientes
    p1 = Paciente(
        prontuario="PR-88231",
        nome="Dona Maria Francisca da Silva",
        idade=68,
        genero="Feminino",
        diagnostico_principal="Insuficiência Cardíaca Descompensada perfil B + DPOC exacerbado",
        alergias="Penicilina e Dipirona",
        precaucao="PADRAO",
        data_internacao=datetime.utcnow() - timedelta(days=4)
    )
    p2 = Paciente(
        prontuario="PR-91045",
        nome="Sr. José Carlos Oliveira",
        idade=54,
        genero="Masculino",
        diagnostico_principal="Pós-operatório D2 de Revascularização do Miocárdio (RM)",
        alergias="Nega alergias",
        precaucao="PADRAO",
        data_internacao=datetime.utcnow() - timedelta(days=2)
    )
    p3 = Paciente(
        prontuario="PR-74512",
        nome="Sra. Ana Lúcia Rezende",
        idade=72,
        genero="Feminino",
        diagnostico_principal="Pneumonia Bacteriana Comunitária com derrame parapneumônico",
        alergias="Sulfa",
        precaucao="GOTICULAS",
        data_internacao=datetime.utcnow() - timedelta(days=5)
    )
    p4 = Paciente(
        prontuario="PR-63980",
        nome="Sr. Roberto de Almeida Santos",
        idade=42,
        genero="Masculino",
        diagnostico_principal="Politrauma com fratura exposta de fêmur e contusão pulmonar",
        alergias="Nega alergias",
        precaucao="PADRAO",
        data_internacao=datetime.utcnow() - timedelta(days=1)
    )

    db.add_all([p1, p2, p3, p4])
    db.commit()

    # 2. Criação de Leitos
    l1 = Leito(codigo="UTI-01", unidade="UTI Geral", tipo="UTI", status="OCUPADO", paciente_atual_id=p2.id)
    l2 = Leito(codigo="UTI-02", unidade="UTI Geral", tipo="UTI", status="OCUPADO", paciente_atual_id=p4.id)
    l3 = Leito(codigo="UTI-03", unidade="UTI Geral", tipo="UTI", status="LIVRE", paciente_atual_id=None)
    l4 = Leito(codigo="ENF-101A", unidade="Enfermaria Clínica", tipo="CLINICO", status="OCUPADO", paciente_atual_id=p1.id)
    l5 = Leito(codigo="ENF-101B", unidade="Enfermaria Clínica", tipo="CLINICO", status="OCUPADO", paciente_atual_id=p3.id)
    l6 = Leito(codigo="ENF-102A", unidade="Enfermaria Clínica", tipo="CLINICO", status="AGUARDANDO_LIMPEZA", paciente_atual_id=None)
    l7 = Leito(codigo="ENF-102B", unidade="Enfermaria Clínica", tipo="CLINICO", status="LIVRE", paciente_atual_id=None)

    db.add_all([l1, l2, l3, l4, l5, l6, l7])
    db.commit()

    # 3. Registros de Corrida de Leito Anteriores para histórico do Paciente 1
    r1 = RegistroCorridaLeito(
        leito_id=l4.id,
        paciente_id=p1.id,
        data_hora=datetime.utcnow() - timedelta(hours=20),
        responsavel_nome="Dra. Camila Nogueira",
        responsavel_cargo="MEDICO",
        pa_sistolica=140,
        pa_diastolica=90,
        fc=88,
        fr=22,
        temp=36.4,
        sato2=93,
        suporte_o2="Cateter Nasal O2 (2 L/min)",
        glicemia=142,
        nivel_consciencia="Lúcido e orientado",
        escala_dor=2,
        acesso_venoso="AVP MSE",
        acesso_venoso_aspecto="Sem flogose, fixação íntegra",
        sonda_alimentar="Nenhuma (Dieta Oral branda)",
        sonda_vesical="Nenhuma (Diurese espontânea)",
        debito_urinario_aspecto="Claro",
        debito_urinario_ml=1200,
        drenos_descricao="Sem drenos",
        infusoes_ativas="Furosemida 40mg IV 12/12h",
        lesao_pressao=False,
        lesao_pressao_detalhe="Pele íntegra, risco moderado em Braden",
        curativos_ativos="Nenhum",
        evolucao_clinica="Paciente eupneica em repouso com O2, menor estase jugular, queixa de tosse esporádica.",
        conduta_medica="Manter furosemida, solicitar radiografia de tórax e BNP de controle.",
        conduta_enfermagem="Controle hídrico rigoroso, balanço de 12h, mudança de decúbito 2/2h.",
        conduta_fisioterapia="Cinesioterapia respiratória, incentivo à sedestação à beira do leito.",
        conduta_nutricao="Dieta hipossódica para cardiopata, aceitação de 70%.",
        exames_pendentes="Raio-X de tórax e gasometria venosa.",
        previsao_alta="48h a 72h",
        transcricao_voz_bruta="Paciente lúcida, afebril, saturando 93 com cateter de O2 a 2 litros. PA 140 por 90, frequência 88. Acesso periférico no braço esquerdo limpo. Conduta manter diurético e pedir raio-x de tórax."
    )

    # 4. Registros para Paciente 2 (UTI)
    r2 = RegistroCorridaLeito(
        leito_id=l1.id,
        paciente_id=p2.id,
        data_hora=datetime.utcnow() - timedelta(hours=6),
        responsavel_nome="Dr. Lucas Prado",
        responsavel_cargo="MEDICO",
        pa_sistolica=115,
        pa_diastolica=70,
        fc=74,
        fr=16,
        temp=36.8,
        sato2=98,
        suporte_o2="Ar ambiente",
        glicemia=118,
        nivel_consciencia="Lúcido e contactuante",
        escala_dor=4,
        acesso_venoso="CVC Subclávia D",
        acesso_venoso_aspecto="Curativo estéril limpo",
        sonda_alimentar="Dieta oral leve",
        sonda_vesical="SVD em sistema fechado",
        debito_urinario_aspecto="Límpido",
        debito_urinario_ml=1800,
        drenos_descricao="Dreno mediastinal com débito serohemático escasso (< 50ml/24h)",
        infusoes_ativas="Dobutamina em desmame (2.5 mcg/kg/min)",
        lesao_pressao=False,
        lesao_pressao_detalhe="Sem LPP",
        curativos_ativos="Incisão esternal e safenectomia limpas e secas",
        evolucao_clinica="Extubado com sucesso, estável hemodinamicamente sem necessidade de noradrenalina.",
        conduta_medica="Suspender dobutamina às 14h se PAM > 65. Previsão de alta da UTI para enfermaria amanhã.",
        conduta_enfermagem="Curativo diário com clorexidina alcoólica, vigilância de diurese.",
        conduta_fisioterapia="Deambulação precoce no quarto com acompanhamento.",
        conduta_nutricao="Progressão de dieta para geral branda.",
        exames_pendentes="Hemograma, potássio, magnésio e coagulograma matinal.",
        previsao_alta="24h (para Enfermaria)",
        transcricao_voz_bruta="Paciente estável no D2 de RM. PA 115 por 70, FC 74, saturando 98 em ar ambiente. CVC limpo, dreno com débito mínimo. Conduta desmamar dobuta e transferir amanhã se mantiver estabilidade."
    )

    db.add_all([r1, r2])

    # 5. Passagem de Plantão Anterior
    plantao = PassagemPlantao(
        unidade="UTI Geral",
        data_hora=datetime.utcnow() - timedelta(hours=8),
        turno="NOTURNO",
        plantonista_passando="Dr. André Mendonça",
        plantonista_recebendo="Dra. Camila Nogueira",
        situacao_sbar="UTI com 2 leitos ocupados e 1 vago. Pacientes estáveis sem parada cardiorrespiratória no plantão.",
        background_sbar="Leito 1 pós-op de RM em D2; Leito 2 politrauma pós-acidente de moto grave com fixador externo.",
        avaliacao_sbar="Leito 1 tolerou bem desmame de ventilação mecânica e extubação às 02h. Leito 2 precisou de 1 bolsa de hemácias por queda de hemoglobina, atualmente estável com PAM 72.",
        recomendacao_sbar="Checar hematócrito do leito 2 às 10h. Avaliar alta do leito 1 para enfermaria. Vaga no leito 3 disponível para regulação."
    )
    db.add(plantao)

    db.commit()
    return {"mensagem": "Dados de demonstração populados com sucesso!", "leitos": 7, "pacientes": 4}


@app.get("/health", tags=["Saúde"])
def healthcheck():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "app": "Corrida de Leito & Plantão"}


# Servir Frontend Single Page Application (quando compilado)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web", "dist"))
if os.path.isdir(dist_dir):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")

