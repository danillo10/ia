from httpx import AsyncClient
from app.main import api
import pytest

@pytest.mark.asyncio
async def test_saude():
    async with AsyncClient(app=api, base_url="http://test") as ac:
        resp = await ac.get("/saude")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
