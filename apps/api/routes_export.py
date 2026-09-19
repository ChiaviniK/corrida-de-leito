from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
import json

from .database import get_db
from .models import Paciente, RegistroCorridaLeito, Leito

router = APIRouter(prefix="/api/export", tags=["Exportação e Prontuários"])


@router.get("/paciente/{paciente_id}/summary")
def obter_resumo_completo_paciente(paciente_id: str, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")

    registros = db.query(RegistroCorridaLeito)\
        .filter(RegistroCorridaLeito.paciente_id == paciente_id)\
        .order_by(RegistroCorridaLeito.data_hora.asc())\
        .all()

    leito_atual = db.query(Leito).filter(Leito.paciente_atual_id == paciente_id).first()

    return {
        "paciente": {
            "id": paciente.id,
            "prontuario": paciente.prontuario,
            "nome": paciente.nome,
            "idade": paciente.idade,
            "genero": paciente.genero,
            "diagnostico_principal": paciente.diagnostico_principal,
            "alergias": paciente.alergias,
            "precaucao": paciente.precaucao,
            "data_internacao": paciente.data_internacao.isoformat() if paciente.data_internacao else None,
            "leito_atual": leito_atual.codigo if leito_atual else "Não alocado",
            "unidade": leito_atual.unidade if leito_atual else "-"
        },
        "total_visitas": len(registros),
        "historico_corridas": [
            {
                "id": r.id,
                "data_hora": r.data_hora.isoformat() if r.data_hora else None,
                "responsavel": f"{r.responsavel_nome} ({r.responsavel_cargo})",
                "sinais_vitais": {
                    "pa": f"{r.pa_sistolica}x{r.pa_diastolica} mmHg" if r.pa_sistolica and r.pa_diastolica else "Não aferida",
                    "fc": f"{r.fc} bpm" if r.fc else "-",
                    "fr": f"{r.fr} irpm" if r.fr else "-",
                    "temp": f"{r.temp}°C" if r.temp else "-",
                    "sato2": f"{r.sato2}%" if r.sato2 else "-",
                    "suporte_o2": r.suporte_o2,
                    "glicemia": f"{r.glicemia} mg/dL" if r.glicemia else "-",
                    "nivel_consciencia": r.nivel_consciencia,
                    "escala_dor": r.escala_dor
                },
                "dispositivos": {
                    "acesso_venoso": r.acesso_venoso,
                    "acesso_aspecto": r.acesso_venoso_aspecto,
                    "sonda_alimentar": r.sonda_alimentar,
                    "sonda_vesical": r.sonda_vesical,
                    "debito_urinario": f"{r.debito_urinario_aspecto}" + (f" ({r.debito_urinario_ml} ml)" if r.debito_urinario_ml else ""),
                    "drenos": r.drenos_descricao,
                    "infusoes": r.infusoes_ativas
                },
                "pele_exame": {
                    "lesao_pressao": "Sim" if r.lesao_pressao else "Não",
                    "lesao_detalhe": r.lesao_pressao_detalhe,
                    "curativos": r.curativos_ativos,
                    "evolucao": r.evolucao_clinica
                },
                "condutas_metas": {
                    "medica": r.conduta_medica,
                    "enfermagem": r.conduta_enfermagem,
                    "fisioterapia": r.conduta_fisioterapia,
                    "nutricao": r.conduta_nutricao,
                    "exames_pendentes": r.exames_pendentes,
                    "previsao_alta": r.previsao_alta
                },
                "transcricao_voz": r.transcricao_voz_bruta
            }
            for r in registros
        ]
    }


@router.get("/paciente/{paciente_id}/json")
def baixar_json_paciente(paciente_id: str, db: Session = Depends(get_db)):
    resumo = obter_resumo_completo_paciente(paciente_id, db)
    conteudo = json.dumps(resumo, indent=2, ensure_ascii=False)
    prontuario = resumo["paciente"]["prontuario"]
    
    return Response(
        content=conteudo,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="prontuario_corrida_leito_{prontuario}.json"'
        }
    )


@router.get("/paciente/{paciente_id}/markdown")
def baixar_markdown_paciente(paciente_id: str, db: Session = Depends(get_db)):
    resumo = obter_resumo_completo_paciente(paciente_id, db)
    p = resumo["paciente"]

    linhas = [
        f"# Prontuário Consolidado: Corrida de Leito & Plano de Cuidados",
        f"**Hospital Geral — Unidade: {p['unidade']} | Leito: {p['leito_atual']}**\n",
        f"---",
        f"## Dados de Identificação do Paciente",
        f"- **Nome:** {p['nome']}",
        f"- **Prontuário:** {p['prontuario']} | **Idade:** {p['idade']} anos | **Gênero:** {p['genero']}",
        f"- **Diagnóstico Principal:** {p['diagnostico_principal']}",
        f"- **Alergias:** {p['alergias']}",
        f"- **Precaução / Isolamento:** {p['precaucao']}",
        f"- **Data de Internação:** {p['data_internacao']}",
        f"\n---\n",
        f"## Histórico de Corridas de Leito Realizadas ({resumo['total_visitas']} visitas registradas)",
    ]

    for idx, reg in enumerate(resumo["historico_corridas"], 1):
        sv = reg["sinais_vitais"]
        disp = reg["dispositivos"]
        pele = reg["pele_exame"]
        cond = reg["condutas_metas"]

        linhas.extend([
            f"\n### Visita #{idx} — {reg['data_hora']}",
            f"**Responsável:** {reg['responsavel']}\n",
            f"#### 1. Sinais Vitais e Avaliação Clínica",
            f"- **PA:** {sv['pa']} | **FC:** {sv['fc']} | **FR:** {sv['fr']}",
            f"- **Temperatura:** {sv['temp']} | **SatO2:** {sv['sato2']} ({sv['suporte_o2']})",
            f"- **Glicemia:** {sv['glicemia']} | **Consciência:** {sv['nivel_consciencia']} | **Dor:** {sv['escala_dor']}/10",
            f"\n#### 2. Checagem de Dispositivos Invasivos",
            f"- **Acesso Venoso:** {disp['acesso_venoso']} (Aspecto: {disp['acesso_aspecto']})",
            f"- **Sonda Nutricional:** {disp['sonda_alimentar']} | **Sonda Vesical:** {disp['sonda_vesical']} (Diurese: {disp['debito_urinario']})",
            f"- **Drenos:** {disp['drenos']} | **Infusões Contínuas:** {disp['infusoes']}",
            f"\n#### 3. Exame Físico & Pele",
            f"- **Lesão por Pressão (LPP):** {pele['lesao_pressao']} - {pele['lesao_detalhe']}",
            f"- **Curativos:** {pele['curativos']} | **Evolução:** {pele['evolucao'] or 'Sem intercorrências'}",
            f"\n#### 4. Discussão Multiprofissional e Metas do Dia",
            f"- **Conduta Médica:** {cond['medica'] or '-'}",
            f"- **Conduta de Enfermagem:** {cond['enfermagem'] or '-'}",
            f"- **Fisioterapia:** {cond['fisioterapia'] or '-'}",
            f"- **Nutrição:** {cond['nutricao'] or '-'}",
            f"- **Exames Solicitados:** {cond['exames_pendentes'] or '-'}",
            f"- **Previsão de Alta:** {cond['previsao_alta']}",
        ])
        if reg["transcricao_voz"]:
            linhas.append(f"\n> **Transcrição de Voz Original:** *\"{reg['transcricao_voz']}\"*")
        linhas.append("\n---")

    conteudo = "\n".join(linhas)
    prontuario = p["prontuario"]

    return Response(
        content=conteudo,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="prontuario_{prontuario}.md"'
        }
    )
