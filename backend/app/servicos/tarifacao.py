def calcular_preco_passageiro(dist_km: float, dur_min: float, base: float = 5.0, preco_km: float = 2.10, preco_min: float = 0.5, dinamica: float = 1.0, desconto: float = 0.0) -> float:
    """
    Calcula o preço total que o passageiro paga
    - Base: R$ 5,00
    - Por km: R$ 2,10
    - Por minuto: R$ 0,50
    """
    valor = (base + dist_km * preco_km + dur_min * preco_min) * dinamica - desconto
    return round(max(valor, 7.0), 2)

def calcular_preco_motorista(preco_passageiro: float, percentual_motorista: float = 55.0, minimo_motorista: float = 7.0) -> float:
    """
    Calcula quanto o motorista recebe (55% do valor pago pelo passageiro)
    - Motorista: 55% do valor total
    - Plataforma: 45% do valor total (ou menos se necessário garantir mínimo)
    - Mínimo garantido ao motorista: R$ 7,00
    """
    valor_calculado = preco_passageiro * (percentual_motorista / 100)
    # Garante que motorista sempre receba no mínimo R$ 7,00
    return round(max(valor_calculado, minimo_motorista), 2)

def calcular_taxa_app(preco_passageiro: float, preco_motorista: float) -> float:
    """Calcula o valor da taxa do app (45% do total)"""
    return round(preco_passageiro - preco_motorista, 2)
