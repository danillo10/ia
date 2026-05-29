"""Regras de preço Minutask — valor fixo (ponto) ou rota por hora."""

VALOR_HORA_BASE = 50.0
TAXA_APP = 0.20
VELOCIDADE_MEDIA_KMH = 25.0
HORAS_MINIMAS_ROTA = 0.5


def horas_minimas_pela_distancia(distancia_km: float) -> float:
    if distancia_km <= 0:
        return HORAS_MINIMAS_ROTA
    horas = distancia_km / VELOCIDADE_MEDIA_KMH
    return max(HORAS_MINIMAS_ROTA, round(horas, 2))


def calcular_valor_rota(horas_contratadas: float) -> dict:
    """R$ 50/h trabalhador + 20% taxa app por hora informada."""
    horas = max(float(horas_contratadas), HORAS_MINIMAS_ROTA)
    valor_trabalhador = round(horas * VALOR_HORA_BASE, 2)
    taxa_app = round(valor_trabalhador * TAXA_APP, 2)
    valor_publicado = round(valor_trabalhador + taxa_app, 2)
    return {
        "horas_contratadas": horas,
        "valor_hora_base": VALOR_HORA_BASE,
        "taxa_app_percentual": TAXA_APP,
        "valor_trabalhador": valor_trabalhador,
        "taxa_app": taxa_app,
        "valor_publicado": valor_publicado,
        "negociavel": True,
    }


def calcular_valor_ponto(valor_fixo: float) -> dict:
    valor = round(max(float(valor_fixo), 0), 2)
    return {
        "valor_fixo": valor,
        "valor_publicado": valor,
        "negociavel": True,
    }
