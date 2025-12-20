import math
from typing import Optional, Dict, Any
from .geocodificacao import calcular_rota_google_maps

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

async def estimar_rota_e_tempo(origem: tuple[float,float], destino: tuple[float,float], velocidade_kmh: float = 30.0) -> Dict[str, Any]:
    """
    Estima rota e tempo usando Google Maps API se disponível, caso contrário usa haversine
    
    Args:
        origem: Tupla (lat, lon) da origem
        destino: Tupla (lat, lon) do destino
        velocidade_kmh: Velocidade média em km/h (usado apenas no fallback)
    
    Returns:
        Dicionário com distancia_km, duracao_min e opcionalmente polyline
    """
    # Tenta usar Google Maps API primeiro
    try:
        rota_google = await calcular_rota_google_maps(origem[0], origem[1], destino[0], destino[1])
        if rota_google:
            print(f"✅ Rota calculada via Google Maps: {rota_google['distancia_km']}km, {rota_google['duracao_min']}min")
            return rota_google
    except Exception as erro:
        print(f"⚠️ Erro ao usar Google Maps, usando fallback haversine: {erro}")
    
    # Fallback: cálculo haversine
    dist_km = haversine_km(origem[0], origem[1], destino[0], destino[1])
    horas = dist_km / max(velocidade_kmh, 1e-6)
    minutos = horas * 60.0
    
    return {
        "distancia_km": round(dist_km, 1), 
        "duracao_min": round(minutos, 1)
    }

