import re
from typing import Dict, Any, List


def parse_clinical_speech(text: str) -> Dict[str, Any]:
    """
    Extrai parâmetros vitais, dispositivos e condutas a partir do texto ditado
    em português brasileiro (pt-BR) durante a corrida de leito.
    """
    result: Dict[str, Any] = {
        "pa_sistolica": None,
        "pa_diastolica": None,
        "fc": None,
        "fr": None,
        "temp": None,
        "sato2": None,
        "suporte_o2": None,
        "glicemia": None,
        "nivel_consciencia": None,
        "acesso_venoso": None,
        "sonda_vesical": None,
        "sonda_alimentar": None,
        "lesao_pressao": None,
        "conduta_medica": None,
        "conduta_enfermagem": None,
        "exames_pendentes": None,
        "detected_entities": [],
    }

    if not text:
        return result

    lower = text.lower()

    # 1. Pressão Arterial (PA)
    # Ex: "pressão 120 por 80", "pa 130 por 85", "120/80", "12 por 8"
    pa_match = re.search(
        r'(?:press[aã]o|pa)?\s*(\d{2,3})\s*(?:por|x|\/)\s*(\d{2,3})',
        lower
    )
    if pa_match:
        sis = int(pa_match.group(1))
        dia = int(pa_match.group(2))
        # Trata formato falado comum "12 por 8" -> 120x80
        if sis < 30 and dia < 20:
            sis *= 10
            dia *= 10
        result["pa_sistolica"] = sis
        result["pa_diastolica"] = dia
        result["detected_entities"].append(f"PA: {sis}x{dia} mmHg")

    # 2. Frequência Cardíaca (FC)
    # Ex: "frequência cardíaca 78", "fc 82", "cardíaca de 90"
    fc_match = re.search(
        r'(?:frequ[eê]ncia\s+card[ií]aca|fc|card[ií]aca(?:\s+de)?)\s*[:=]?\s*(\d{2,3})',
        lower
    )
    if fc_match:
        fc = int(fc_match.group(1))
        if 30 <= fc <= 250:
            result["fc"] = fc
            result["detected_entities"].append(f"FC: {fc} bpm")

    # 3. Frequência Respiratória (FR)
    fr_match = re.search(
        r'(?:frequ[eê]ncia\s+respirat[oó]ria|fr|respirat[oó]ria(?:\s+de)?)\s*[:=]?\s*(\d{1,2})',
        lower
    )
    if fr_match:
        fr = int(fr_match.group(1))
        if 8 <= fr <= 60:
            result["fr"] = fr
            result["detected_entities"].append(f"FR: {fr} irpm")

    # 4. Temperatura
    # Ex: "temperatura 36 e meio", "36.8", "37 graus", "afebril"
    if "afebril" in lower:
        result["temp"] = 36.5
        result["detected_entities"].append("Temperatura: 36.5°C (Afebril)")
    else:
        temp_match = re.search(
            r'(?:temperatura|temp|febre)\s*(?:de)?\s*(\d{2})[\.,](\d{1,2})',
            lower
        )
        if temp_match:
            temp = float(f"{temp_match.group(1)}.{temp_match.group(2)}")
            result["temp"] = temp
            result["detected_entities"].append(f"Temperatura: {temp}°C")

    # 5. Saturação (SatO2)
    # Ex: "saturação 98", "sat 97%", "saturando 95"
    sat_match = re.search(
        r'(?:satura[cç][aã]o|saturando|sat|spo2)\s*(?:de)?\s*(\d{2,3})\s*%?',
        lower
    )
    if sat_match:
        sat = int(sat_match.group(1))
        if 50 <= sat <= 100:
            result["sato2"] = sat
            result["detected_entities"].append(f"SatO2: {sat}%")

    # Suporte ventilatório
    if "ar ambiente" in lower:
        result["suporte_o2"] = "Ar ambiente"
    elif "cateter" in lower or "cânula" in lower:
        result["suporte_o2"] = "Cateter Nasal O2"
    elif "máscara" in lower or "venturi" in lower:
        result["suporte_o2"] = "Máscara de Venturi"
    elif "vni" in lower or "não invasiva" in lower:
        result["suporte_o2"] = "VNI (Ventilação Não Invasiva)"
    elif "intubado" in lower or "tubo orotraqueal" in lower or "ventilação mecânica" in lower:
        result["suporte_o2"] = "Ventilação Mecânica Invasiva"

    # 6. Glicemia
    # Ex: "glicemia 110", "dextro 135", "hgt 98"
    glic_match = re.search(
        r'(?:glicemia|dextro|hgt)\s*(?:de)?\s*(\d{2,3})',
        lower
    )
    if glic_match:
        glic = int(glic_match.group(1))
        result["glicemia"] = glic
        result["detected_entities"].append(f"Glicemia: {glic} mg/dL")

    # 7. Nível de Consciência
    if "lúcido" in lower or "lucido" in lower or "orientado" in lower:
        result["nivel_consciencia"] = "Lúcido e orientado"
    elif "sedado" in lower or "rass" in lower:
        result["nivel_consciencia"] = "Sedado / RASS controlado"
    elif "sonolento" in lower:
        result["nivel_consciencia"] = "Sonolento, despertável"
    elif "torporoso" in lower or "confuso" in lower:
        result["nivel_consciencia"] = "Confuso / Torporoso"

    # 8. Dispositivos
    if "acesso venoso central" in lower or "cvc" in lower:
        result["acesso_venoso"] = "CVC (Cateter Venoso Central)"
    elif "picc" in lower:
        result["acesso_venoso"] = "PICC"
    elif "acesso periférico" in lower or "avp" in lower or "acesso venoso" in lower:
        result["acesso_venoso"] = "AVP (Acesso Venoso Periférico)"

    if "sonda vesical" in lower or "svd" in lower:
        result["sonda_vesical"] = "SVD (Sonda Vesical de Demora)"
    elif "sem sonda vesical" in lower or "diurese espontânea" in lower:
        result["sonda_vesical"] = "Nenhuma (Diurese espontânea)"

    if "sonda nasoenteral" in lower or "sne" in lower:
        result["sonda_alimentar"] = "SNE (Sonda Nasoenteral)"
    elif "sonda nasogástrica" in lower or "sng" in lower:
        result["sonda_alimentar"] = "SNG (Sonda Nasogástrica)"
    elif "dieta oral" in lower:
        result["sonda_alimentar"] = "Nenhuma (Dieta Oral)"

    # 9. Lesão por Pressão / Pele
    if "sem lesão" in lower or "pele íntegra" in lower or "sem lpp" in lower:
        result["lesao_pressao"] = False
        result["detected_entities"].append("Pele Íntegra")
    elif "lesão por pressão" in lower or "lpp" in lower or "úlcera" in lower:
        result["lesao_pressao"] = True
        result["detected_entities"].append("Presença de Lesão por Pressão (LPP)")

    # 10. Condutas e Exames (captura de trechos após palavras-chave)
    conduta_match = re.search(
        r'(?:conduta(?: médica)?|plano(?: terapêutico)?)\s*[:=]?\s*(.*?)(?=(?:enfermagem|exames|alta|$))',
        lower,
        re.DOTALL
    )
    if conduta_match:
        cond = conduta_match.group(1).strip()
        if len(cond) > 3:
            result["conduta_medica"] = cond.capitalize()

    exames_match = re.search(
        r'(?:exames?|solicitar|pendente[s]?)\s*[:=]?\s*(.*?)(?=(?:conduta|enfermagem|alta|$))',
        lower,
        re.DOTALL
    )
    if exames_match:
        ex = exames_match.group(1).strip()
        if len(ex) > 3:
            result["exames_pendentes"] = ex.capitalize()

    return result
