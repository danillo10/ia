from fastapi import APIRouter
from ..servicos.roteamento import estimar_rota_e_tempo
from ..servicos.tarifacao import calcular_preco_passageiro, calcular_preco_motorista, calcular_taxa_app

roteador = APIRouter(prefix="/corridas", tags=["Corridas"])

@roteador.post("/estimar")
async def estimar(payload: dict):
    origem = payload.get("origem")  # {lat, lon}
    destino = payload.get("destino")
    rota = await estimar_rota_e_tempo((origem["lat"], origem["lon"]), (destino["lat"], destino["lon"]))
    
    # Calcula preço total que o passageiro paga (R$ 2,15/km)
    preco_passageiro = calcular_preco_passageiro(rota["distancia_km"], rota["duracao_min"])
    
    # Calcula quanto o motorista recebe (55% do valor total)
    preco_motorista = calcular_preco_motorista(preco_passageiro)
    
    # Calcula a taxa do app (45% do valor total)
    taxa_app = calcular_taxa_app(preco_passageiro, preco_motorista)
    
    return {
        "rota": rota,
        "preco_estimado": preco_passageiro,  # Passageiro paga este valor (R$ 2,15/km)
        "preco_motorista": preco_motorista,   # Motorista recebe este valor (55%)
        "taxa_app": taxa_app,                 # Taxa do app (45%)
        "taxa_app_percentual": 45.0,
        "percentual_motorista": 55.0
    }
