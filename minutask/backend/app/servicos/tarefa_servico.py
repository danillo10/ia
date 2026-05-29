import json
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..modelos.tarefa import Tarefa, TarefaRecusa
from .geo import distancia_rota_km
from .tarifacao import calcular_valor_ponto, calcular_valor_rota, horas_minimas_pela_distancia

BUSCA_MINUTOS = 2


def agora_utc() -> datetime:
    return datetime.now(timezone.utc)


def busca_expira_em() -> datetime:
    return agora_utc() + timedelta(minutes=BUSCA_MINUTOS)


def parse_agendado(payload: dict) -> datetime:
    """Data/hora em que o serviço deve ser realizado (UTC). Padrão: agora."""
    raw = payload.get("agendado_para")
    if raw is None or raw == "":
        return agora_utc()
    if isinstance(raw, datetime):
        dt = raw
    elif isinstance(raw, str):
        texto = raw.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(texto)
        except ValueError as e:
            raise ValueError("Data ou hora do serviço inválida") from e
    else:
        raise ValueError("Data ou hora do serviço inválida")

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)

    if dt < agora_utc() - timedelta(minutes=2):
        raise ValueError("Data e hora do serviço não podem ser no passado")
    return dt


def atualizar_expiracao_busca(tarefa: Tarefa) -> None:
    if tarefa.estado != "buscando" or not tarefa.busca_ativa:
        return
    if tarefa.busca_expira_em and agora_utc() >= tarefa.busca_expira_em.replace(tzinfo=timezone.utc):
        tarefa.busca_ativa = False


def pode_reenviar(tarefa: Tarefa) -> bool:
    atualizar_expiracao_busca(tarefa)
    return tarefa.estado == "buscando" and not tarefa.busca_ativa


def parse_pontos(payload: dict) -> list[dict]:
    raw = payload.get("pontos_rota") or payload.get("pontos") or []
    if not isinstance(raw, list):
        return []
    pontos = []
    for p in raw:
        if p.get("lat") is None or p.get("lon") is None:
            continue
        pontos.append(
            {
                "lat": float(p["lat"]),
                "lon": float(p["lon"]),
                "endereco": p.get("endereco"),
            }
        )
    return pontos


def validar_criacao(payload: dict) -> tuple[str, list[dict], dict]:
    tipo = (payload.get("tipo_loc") or "ponto").strip().lower()
    if tipo not in ("ponto", "rota"):
        raise ValueError("tipo_loc deve ser 'ponto' ou 'rota'")

    pontos = parse_pontos(payload)
    if tipo == "rota":
        if len(pontos) < 2:
            raise ValueError("Rota exige pelo menos 2 paradas")
        coords = [(p["lat"], p["lon"]) for p in pontos]
        dist_km = distancia_rota_km(coords)
        horas_min = horas_minimas_pela_distancia(dist_km)
        horas = float(payload.get("horas_contratadas") or horas_min)
        if horas < horas_min:
            raise ValueError(f"Mínimo de {horas_min}h para esta distância ({dist_km} km)")
        precos = calcular_valor_rota(horas)
        precos["distancia_km"] = dist_km
        precos["horas_minimas"] = horas_min
        precos["pontos"] = pontos
        return tipo, pontos, precos

    lat, lon = payload.get("lat"), payload.get("lon")
    if lat is None or lon is None:
        raise ValueError("Localização (lat/lon) obrigatória para serviço em um ponto")
    valor_fixo = payload.get("valor_fixo")
    if valor_fixo is None:
        valor_fixo = payload.get("valor_sugerido")
    if valor_fixo is None or float(valor_fixo) <= 0:
        raise ValueError("Informe o valor inicial do serviço")
    precos = calcular_valor_ponto(float(valor_fixo))
    if not pontos:
        pontos = [{"lat": float(lat), "lon": float(lon), "endereco": payload.get("endereco")}]
    precos["pontos"] = pontos
    return tipo, pontos, precos


def aplicar_dados_tarefa(
    tarefa: Tarefa,
    tipo: str,
    pontos: list[dict],
    precos: dict,
    *,
    reiniciar_busca: bool = True,
) -> None:
    primeiro = pontos[0]
    tarefa.tipo_loc = tipo
    tarefa.lat = primeiro["lat"]
    tarefa.lon = primeiro["lon"]
    tarefa.endereco = primeiro.get("endereco")
    tarefa.pontos_rota_json = json.dumps(pontos, ensure_ascii=False)
    tarefa.negociavel = precos.get("negociavel", True)

    if tipo == "rota":
        tarefa.distancia_km = precos.get("distancia_km", 0)
        tarefa.horas_contratadas = precos["horas_contratadas"]
        tarefa.valor_hora_base = precos["valor_hora_base"]
        tarefa.taxa_app = precos["taxa_app"]
        tarefa.valor_fixo = 0
        tarefa.valor_publicado = precos["valor_publicado"]
        tarefa.valor_sugerido = precos["valor_publicado"]
    else:
        tarefa.distancia_km = 0
        tarefa.horas_contratadas = 0
        tarefa.valor_fixo = precos["valor_fixo"]
        tarefa.valor_publicado = precos["valor_publicado"]
        tarefa.valor_sugerido = precos["valor_publicado"]

    if reiniciar_busca:
        tarefa.busca_ativa = True
        tarefa.busca_expira_em = busca_expira_em()
        tarefa.tentativas_busca = (tarefa.tentativas_busca or 0) + 1


def serializar_tarefa(tarefa: Tarefa, fotos: list[dict] | None = None) -> dict:
    atualizar_expiracao_busca(tarefa)
    pontos = []
    if tarefa.pontos_rota_json:
        try:
            pontos = json.loads(tarefa.pontos_rota_json)
        except json.JSONDecodeError:
            pontos = []

    expira = tarefa.busca_expira_em
    segundos_restantes = None
    if tarefa.busca_ativa and expira:
        delta = expira.replace(tzinfo=timezone.utc) - agora_utc()
        segundos_restantes = max(0, int(delta.total_seconds()))

    return {
        "id": tarefa.id,
        "estado": tarefa.estado,
        "descricao": tarefa.descricao,
        "categoria": tarefa.categoria,
        "tipo_loc": tarefa.tipo_loc or "ponto",
        "lat": tarefa.lat,
        "lon": tarefa.lon,
        "endereco": tarefa.endereco,
        "pontos_rota": pontos,
        "distancia_km": tarefa.distancia_km,
        "horas_contratadas": tarefa.horas_contratadas,
        "valor_hora_base": tarefa.valor_hora_base,
        "taxa_app": tarefa.taxa_app,
        "valor_fixo": tarefa.valor_fixo,
        "valor_publicado": tarefa.valor_publicado,
        "valor_sugerido": tarefa.valor_sugerido,
        "negociavel": bool(tarefa.negociavel),
        "busca_ativa": bool(tarefa.busca_ativa),
        "busca_expira_em": expira.isoformat() if expira else None,
        "segundos_busca_restantes": segundos_restantes,
        "pode_reenviar": pode_reenviar(tarefa),
        "tentativas_busca": tarefa.tentativas_busca or 0,
        "trabalhador_id": tarefa.trabalhador_id,
        "aceito_em": tarefa.aceito_em.isoformat() if tarefa.aceito_em else None,
        "criado_em": tarefa.criado_em.isoformat() if tarefa.criado_em else None,
        "agendado_para": tarefa.agendado_para.isoformat() if tarefa.agendado_para else None,
        "fotos": fotos if fotos is not None else [],
    }


def dados_fila(tarefa: Tarefa, fotos: list[dict] | None = None) -> dict:
    base = serializar_tarefa(tarefa, fotos=fotos)
    base["tarefa_id"] = tarefa.id
    return base


async def limpar_recusas(sessao: AsyncSession, tarefa_id: int) -> None:
    await sessao.execute(delete(TarefaRecusa).where(TarefaRecusa.tarefa_id == tarefa_id))
