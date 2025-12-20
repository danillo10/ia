"""
Serviço de geocodificação usando Google Maps API
Centraliza todas as chamadas à API do Google Maps no backend
"""
import os
import httpx
from typing import Optional, List, Dict, Any

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

async def buscar_enderecos(texto_busca: str, lat_usuario: Optional[float] = None, lon_usuario: Optional[float] = None) -> List[Dict[str, Any]]:
    """
    Busca endereços usando Google Places Autocomplete API
    
    Args:
        texto_busca: Texto digitado pelo usuário
        lat_usuario: Latitude do usuário (para bias de proximidade)
        lon_usuario: Longitude do usuário (para bias de proximidade)
    
    Returns:
        Lista de sugestões de endereços
    """
    if not GOOGLE_MAPS_API_KEY:
        print("⚠️ GOOGLE_MAPS_API_KEY não configurada, retornando lista vazia")
        return []
    
    if not texto_busca or len(texto_busca) < 3:
        return []
    
    url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    
    params = {
        "input": texto_busca,
        "key": GOOGLE_MAPS_API_KEY,
        "language": "pt-BR",
        "components": "country:br"  # Restringe ao Brasil
    }
    
    # Se tiver localização do usuário, adiciona bias de proximidade
    if lat_usuario and lon_usuario:
        params["location"] = f"{lat_usuario},{lon_usuario}"
        params["radius"] = 50000  # 50km de raio
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                print(f"⚠️ Google Places API retornou status: {data.get('status')}")
                return []
            
            # Formata os resultados
            sugestoes = []
            for prediction in data.get("predictions", [])[:5]:  # Limita a 5 resultados
                sugestoes.append({
                    "place_id": prediction.get("place_id"),
                    "nome": prediction.get("structured_formatting", {}).get("main_text", ""),
                    "nome_completo": prediction.get("description", ""),
                    "tipo": "endereco"
                })
            
            return sugestoes
            
    except Exception as erro:
        print(f"❌ Erro ao buscar endereços: {erro}")
        return []


async def obter_coordenadas_por_place_id(place_id: str) -> Optional[Dict[str, float]]:
    """
    Obtém coordenadas de um Place ID usando Google Places Details API
    
    Args:
        place_id: ID do local retornado pelo autocomplete
    
    Returns:
        Dicionário com lat e lon, ou None se falhar
    """
    if not GOOGLE_MAPS_API_KEY:
        print("⚠️ GOOGLE_MAPS_API_KEY não configurada")
        return None
    
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    params = {
        "place_id": place_id,
        "key": GOOGLE_MAPS_API_KEY,
        "fields": "geometry"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                print(f"⚠️ Google Places Details retornou status: {data.get('status')}")
                return None
            
            location = data.get("result", {}).get("geometry", {}).get("location", {})
            
            if not location:
                return None
            
            return {
                "lat": location.get("lat"),
                "lon": location.get("lng")
            }
            
    except Exception as erro:
        print(f"❌ Erro ao obter coordenadas: {erro}")
        return None


async def geocodificacao_reversa(lat: float, lon: float) -> Optional[str]:
    """
    Obtém endereço a partir de coordenadas usando Google Geocoding API
    
    Args:
        lat: Latitude
        lon: Longitude
    
    Returns:
        Endereço formatado como string, ou None se falhar
    """
    if not GOOGLE_MAPS_API_KEY:
        print("⚠️ GOOGLE_MAPS_API_KEY não configurada")
        return None
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    
    params = {
        "latlng": f"{lat},{lon}",
        "key": GOOGLE_MAPS_API_KEY,
        "language": "pt-BR"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                print(f"⚠️ Google Geocoding retornou status: {data.get('status')}")
                return None
            
            results = data.get("results", [])
            if not results:
                return None
            
            # Retorna o endereço formatado do primeiro resultado
            return results[0].get("formatted_address")
            
    except Exception as erro:
        print(f"❌ Erro na geocodificação reversa: {erro}")
        return None


async def calcular_rota_google_maps(origem_lat: float, origem_lon: float, destino_lat: float, destino_lon: float) -> Optional[Dict[str, Any]]:
    """
    Calcula rota usando Google Directions API
    
    Args:
        origem_lat: Latitude de origem
        origem_lon: Longitude de origem
        destino_lat: Latitude de destino
        destino_lon: Longitude de destino
    
    Returns:
        Dicionário com distancia_km, duracao_min e polyline, ou None se falhar
    """
    if not GOOGLE_MAPS_API_KEY:
        print("⚠️ GOOGLE_MAPS_API_KEY não configurada, usando cálculo haversine")
        return None
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    params = {
        "origin": f"{origem_lat},{origem_lon}",
        "destination": f"{destino_lat},{destino_lon}",
        "key": GOOGLE_MAPS_API_KEY,
        "mode": "driving",  # Modo de direção
        "language": "pt-BR"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                print(f"⚠️ Google Directions retornou status: {data.get('status')}")
                return None
            
            routes = data.get("routes", [])
            if not routes:
                return None
            
            # Pega a primeira rota
            route = routes[0]
            leg = route.get("legs", [{}])[0]
            
            # Extrai distância e duração
            distancia_metros = leg.get("distance", {}).get("value", 0)
            duracao_segundos = leg.get("duration", {}).get("value", 0)
            
            # Extrai polyline para desenhar rota no mapa
            polyline = route.get("overview_polyline", {}).get("points", "")
            
            return {
                "distancia_km": round(distancia_metros / 1000, 1),
                "duracao_min": round(duracao_segundos / 60, 1),
                "polyline": polyline
            }
            
    except Exception as erro:
        print(f"❌ Erro ao calcular rota: {erro}")
        return None
