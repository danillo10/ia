from httpx import AsyncClient
from app.main import api
import pytest

@pytest.mark.asyncio
async def test_estimativa():
    async with AsyncClient(app=api, base_url="http://test") as ac:
        payload = {"origem": {"lat": -8.05, "lon": -34.9}, "destino": {"lat": -8.06, "lon": -34.88}}
        resp = await ac.post("/api/v1/corridas/estimar", json=payload)
        assert resp.status_code == 200
        corpo = resp.json()
        assert "rota" in corpo and "preco_estimado" in corpo
        assert corpo["rota"]["distancia_km"] > 0
        # Verifica que o motorista recebe 55% do valor do passageiro
        assert "preco_motorista" in corpo
        assert "taxa_app" in corpo
        assert corpo["percentual_motorista"] == 55.0
        assert corpo["taxa_app_percentual"] == 45.0
        # Valida cálculo: preco_motorista = max(preco_estimado * 0.55, 7.0)
        preco_passageiro = corpo["preco_estimado"]
        preco_motorista = corpo["preco_motorista"]
        valor_calculado_55 = preco_passageiro * 0.55
        valor_esperado = max(valor_calculado_55, 7.0)
        assert abs(preco_motorista - valor_esperado) < 0.02  # Margem para arredondamento
        # Garante que motorista sempre recebe no mínimo R$ 7,00
        assert preco_motorista >= 7.0

@pytest.mark.asyncio
async def test_minimo_motorista():
    """Testa que motorista recebe no mínimo R$ 7,00 mesmo em corridas muito curtas"""
    async with AsyncClient(app=api, base_url="http://test") as ac:
        # Corrida muito curta: origem e destino próximos
        payload = {"origem": {"lat": -8.05, "lon": -34.9}, "destino": {"lat": -8.051, "lon": -34.901}}
        resp = await ac.post("/api/v1/corridas/estimar", json=payload)
        assert resp.status_code == 200
        corpo = resp.json()
        
        # Mesmo que o passageiro pague menos que R$ 12,73 (7/0.55),
        # o motorista deve receber no mínimo R$ 7,00
        preco_passageiro = corpo["preco_estimado"]
        preco_motorista = corpo["preco_motorista"]
        
        assert preco_motorista >= 7.0, f"Motorista deve receber no mínimo R$ 7,00, recebeu R$ {preco_motorista}"
        
        # Se o passageiro pagar menos que R$ 12,73, o motorista recebe R$ 7,00 fixo
        if preco_passageiro < 12.73:
            assert preco_motorista == 7.0, f"Para corridas < R$ 12,73, motorista deve receber R$ 7,00 fixo"
