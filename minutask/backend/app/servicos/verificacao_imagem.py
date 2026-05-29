"""
Análise básica de imagem no cadastro (documento/selfie).
Em produção: integrar OCR/ML (Vision API, Rekognition, etc.).
"""
from pathlib import Path
from typing import Tuple

from PIL import Image


def analisar_imagem_documento(caminho: Path) -> Tuple[str, str | None, float]:
    """
    Retorna (status, motivo, confianca).
    status: aprovado | rejeitado | pendente
    """
    try:
        with Image.open(caminho) as img:
            img.verify()
        with Image.open(caminho) as img:
            largura, altura = img.size
            formato = (img.format or "").upper()

        if formato not in ("JPEG", "JPG", "PNG", "WEBP"):
            return "rejeitado", "Formato de imagem não suportado", 0.0

        if largura < 400 or altura < 300:
            return "rejeitado", "Imagem muito pequena para leitura do documento", 0.2

        if largura > 8000 or altura > 8000:
            return "rejeitado", "Imagem excede tamanho máximo", 0.1

        proporcao = largura / altura if altura else 0
        if proporcao < 0.5 or proporcao > 3.5:
            return "pendente", "Proporção incomum; revisão manual", 0.5

        # Heurística simples: documentos costumam ser mais largos que altos
        confianca = 0.85 if 1.2 <= proporcao <= 2.2 else 0.65
        return "aprovado", None, confianca

    except Exception as erro:
        return "rejeitado", f"Arquivo inválido: {erro}", 0.0
