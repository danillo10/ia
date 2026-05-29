import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import config
from ..modelos.tarefa_foto import TarefaFoto

MAX_FOTOS_POR_TAREFA = 5
MAX_BYTES_FOTO = 5 * 1024 * 1024
EXTENSOES_OK = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def url_publica_foto(caminho_relativo: str) -> str:
    return f"/uploads/{caminho_relativo.lstrip('/')}"


def serializar_foto(foto: TarefaFoto) -> dict:
    return {
        "id": foto.id,
        "url": url_publica_foto(foto.caminho),
        "ordem": foto.ordem,
    }


async def contar_fotos(sessao: AsyncSession, tarefa_id: int) -> int:
    res = await sessao.execute(
        select(TarefaFoto.id).where(TarefaFoto.tarefa_id == tarefa_id)
    )
    return len(res.all())


async def listar_fotos_tarefa(sessao: AsyncSession, tarefa_id: int) -> list[dict]:
    res = await sessao.execute(
        select(TarefaFoto)
        .where(TarefaFoto.tarefa_id == tarefa_id)
        .order_by(TarefaFoto.ordem.asc(), TarefaFoto.id.asc())
    )
    return [serializar_foto(f) for f in res.scalars().all()]


async def fotos_por_tarefas(sessao: AsyncSession, tarefa_ids: list[int]) -> dict[int, list[dict]]:
    if not tarefa_ids:
        return {}
    res = await sessao.execute(
        select(TarefaFoto)
        .where(TarefaFoto.tarefa_id.in_(tarefa_ids))
        .order_by(TarefaFoto.tarefa_id, TarefaFoto.ordem, TarefaFoto.id)
    )
    mapa: dict[int, list[dict]] = {}
    for foto in res.scalars().all():
        mapa.setdefault(foto.tarefa_id, []).append(serializar_foto(foto))
    return mapa


async def salvar_fotos_tarefa(
    sessao: AsyncSession,
    tarefa_id: int,
    arquivos: list[UploadFile],
) -> list[dict]:
    if not arquivos:
        raise HTTPException(status_code=400, detail="Envie pelo menos uma foto")

    existentes = await contar_fotos(sessao, tarefa_id)
    if existentes + len(arquivos) > MAX_FOTOS_POR_TAREFA:
        raise HTTPException(
            status_code=400,
            detail=f"Máximo de {MAX_FOTOS_POR_TAREFA} fotos por pedido",
        )

    pasta = Path(config.uploads_dir) / "tarefas" / str(tarefa_id)
    pasta.mkdir(parents=True, exist_ok=True)

    salvas: list[dict] = []
    ordem = existentes

    for arquivo in arquivos:
        if not arquivo.filename:
            continue
        ext = Path(arquivo.filename).suffix.lower()
        if ext not in EXTENSOES_OK:
            raise HTTPException(
                status_code=400,
                detail="Formato inválido. Use JPG, PNG, WEBP ou GIF",
            )
        conteudo = await arquivo.read()
        if len(conteudo) > MAX_BYTES_FOTO:
            raise HTTPException(status_code=400, detail="Cada foto deve ter no máximo 5 MB")
        if len(conteudo) < 100:
            continue

        nome = f"{uuid.uuid4().hex}{ext}"
        caminho_relativo = f"tarefas/{tarefa_id}/{nome}"
        caminho_abs = Path(config.uploads_dir) / caminho_relativo
        caminho_abs.write_bytes(conteudo)

        foto = TarefaFoto(tarefa_id=tarefa_id, caminho=caminho_relativo, ordem=ordem)
        sessao.add(foto)
        ordem += 1
        salvas.append({"caminho": caminho_relativo, "obj": foto})

    if not salvas:
        raise HTTPException(status_code=400, detail="Nenhuma foto válida enviada")

    await sessao.commit()
    for item in salvas:
        await sessao.refresh(item["obj"])

    return [serializar_foto(item["obj"]) for item in salvas]
