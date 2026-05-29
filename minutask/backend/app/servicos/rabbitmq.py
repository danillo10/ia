import aio_pika
import json
import os
from typing import Any, Dict

from ..core.config import config

RABBITMQ_URL = os.getenv("RABBITMQ_URL") or config.rabbitmq_url


class RabbitMQService:
    def __init__(self):
        self.connection = None
        self.channel = None

    async def conectar(self):
        if not RABBITMQ_URL:
            return
        try:
            self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
            self.channel = await self.connection.channel()
            print("✅ Minutask: conectado ao RabbitMQ")
        except Exception as erro:
            print(f"❌ Minutask RabbitMQ: {erro}")
            self.connection = None
            self.channel = None

    async def desconectar(self):
        if self.connection:
            await self.connection.close()

    async def _publicar(self, fila: str, dados: Dict[str, Any]):
        if not self.channel:
            await self.conectar()
        if not self.channel:
            print("⚠️ RabbitMQ indisponível")
            return
        await self.channel.declare_queue(fila, durable=True)
        mensagem = aio_pika.Message(
            body=json.dumps(dados, default=str).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await self.channel.default_exchange.publish(mensagem, routing_key=fila)
        print(f"📤 Minutask [{fila}]: {dados.get('tipo')} tarefa={dados.get('tarefa_id') or dados.get('id')}")

    async def publicar_nova_tarefa(self, tarefa_data: Dict[str, Any]):
        """Todos os trabalhadores online devem consumir esta fila."""
        payload = {"tipo": "nova_tarefa", **tarefa_data}
        await self._publicar("jobs_pendentes", payload)

    async def publicar_tarefa_encerrada(self, tarefa_id: int, trabalhador_id: int):
        """Após aceite: para de notificar os demais."""
        await self._publicar(
            "jobs_encerrados",
            {
                "tipo": "tarefa_aceita",
                "tarefa_id": tarefa_id,
                "trabalhador_id": trabalhador_id,
            },
        )


rabbitmq_service = RabbitMQService()
