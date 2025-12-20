from fastapi import APIRouter, HTTPException, Query
import httpx
import os
from typing import Optional

roteador = APIRouter(prefix="/geocodificacao", tags=["Geocodificação"])

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

@roteador.get("/directions")
async def obter_direcoes(
    origin: str = Query(..., description="Origem lat,lng"),
    destination: str = Query(..., description="Destino lat,lng"),
    language: str = Query("pt-BR", description="Idioma")
):
    """Calcula rota usando Google Directions API"""
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google Maps API Key não configurada")
    
    params = {
        "origin": origin,
        "destination": destination,
        "key": GOOGLE_MAPS_API_KEY,
        "mode": "driving",
        "language": language,
        "region": "BR"
    }
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao calcular direções: {str(e)}")

@roteador.get("/autocomplete")
async def buscar_autocomplete(
    input: str = Query(..., description="Texto para busca"),
    location: Optional[str] = Query(None, description="Lat,Lng para proximidade"),
    radius: Optional[int] = Query(50000, description="Raio em metros"),
    language: str = Query("pt-BR", description="Idioma"),
    components: str = Query("country:br", description="Filtros por país")
):
    """Busca de endereços usando Nominatim (OpenStreetMap) - Gratuito"""
    params = {
        "q": input.strip(),
        "format": "json",
        "addressdetails": "1",
        "limit": "10",
        "countrycodes": "br",
        "accept-language": "pt-BR,pt"
    }
    
    if location:
        lat, lon = location.split(',')
        params["viewbox"] = f"{float(lon)-0.5},{float(lat)+0.5},{float(lon)+0.5},{float(lat)-0.5}"
        params["bounded"] = "1"
    
    url = "https://nominatim.openstreetmap.org/search"
    
    headers = {
        "User-Agent": "MotoTaxi/1.0 (Aplicativo de transporte)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=10.0)
            results = response.json()
            
            # Converte formato Nominatim para formato compatível com Google
            predictions = []
            for result in results:
                predictions.append({
                    "place_id": result["place_id"],
                    "description": result["display_name"],
                    "structured_formatting": {
                        "main_text": result.get("name", result["display_name"].split(",")[0]),
                        "secondary_text": result["display_name"]
                    }
                })
            
            return {
                "predictions": predictions,
                "status": "OK" if predictions else "ZERO_RESULTS"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao consultar Nominatim: {str(e)}")

@roteador.get("/place-details")
async def obter_detalhes_lugar(
    place_id: str = Query(..., description="ID do lugar do Nominatim"),
    fields: str = Query("geometry,name,formatted_address,types", description="Campos desejados"),
    language: str = Query("pt-BR", description="Idioma")
):
    """Detalhes do lugar usando Nominatim (OpenStreetMap) - Gratuito"""
    # Nominatim usa o endpoint /details com place_id direto
    params = {
        "place_id": place_id,
        "format": "json",
        "addressdetails": "1",
        "accept-language": "pt-BR,pt"
    }
    
    url = "https://nominatim.openstreetmap.org/details"
    
    headers = {
        "User-Agent": "MotoTaxi/1.0 (Aplicativo de transporte)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=10.0)
            result = response.json()
            
            if "place_id" in result:
                # Pega coordenadas do centroid
                centroid = result.get("centroid", {})
                return {
                    "result": {
                        "name": result.get("localname", result.get("calculated_wikipedia", "Local")),
                        "formatted_address": result.get("calculated_wikipedia", "Endereço"),
                        "geometry": {
                            "location": {
                                "lat": float(centroid.get("coordinates", [0, 0])[1]) if centroid else 0,
                                "lng": float(centroid.get("coordinates", [0, 0])[0]) if centroid else 0
                            }
                        },
                        "types": [result.get("category", "establishment")]
                    },
                    "status": "OK"
                }
            else:
                return {"status": "ZERO_RESULTS"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao consultar Nominatim: {str(e)}")

@roteador.get("/geocode")
async def geocodificar_reverso(
    latlng: str = Query(..., description="Coordenadas lat,lng"),
    language: str = Query("pt-BR", description="Idioma")
):
    """Geocodificação reversa usando Nominatim (OpenStreetMap) - Gratuito"""
    lat, lon = latlng.split(',')
    
    params = {
        "lat": lat.strip(),
        "lon": lon.strip(),
        "format": "json",
        "addressdetails": "1",
        "accept-language": "pt-BR,pt"
    }
    
    url = "https://nominatim.openstreetmap.org/reverse"
    
    headers = {
        "User-Agent": "MotoTaxi/1.0 (Aplicativo de transporte)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=10.0)
            data = response.json()
            
            # Converte formato Nominatim para formato compatível com Google
            if "display_name" in data:
                return {
                    "results": [
                        {
                            "formatted_address": data["display_name"],
                            "geometry": {
                                "location": {
                                    "lat": float(data["lat"]),
                                    "lng": float(data["lon"])
                                }
                            }
                        }
                    ],
                    "status": "OK"
                }
            else:
                return {"results": [], "status": "ZERO_RESULTS"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao consultar Nominatim: {str(e)}")