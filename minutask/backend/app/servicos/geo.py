import math
from typing import Sequence


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def distancia_rota_km(pontos: Sequence[tuple[float, float]]) -> float:
    """Soma das distâncias entre paradas consecutivas."""
    if len(pontos) < 2:
        return 0.0
    total = 0.0
    for i in range(len(pontos) - 1):
        a, b = pontos[i], pontos[i + 1]
        total += haversine_km(a[0], a[1], b[0], b[1])
    return round(total, 2)
