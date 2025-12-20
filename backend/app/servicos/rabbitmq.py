import aio_pika
import json
import os
from typing import Dict, Any

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

class RabbitMQService:
    def __init__(self):
        self.connection = None
        self.channel = None
    
    async def conectar(self):
        """Conecta ao RabbitMQ"""
        try:
            self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
            self.channel = await self.connection.channel()
            print("✅ Conectado ao RabbitMQ")
        except Exception as erro:
            print(f"❌ Erro ao conectar RabbitMQ: {erro}")
            self.connection = None
            self.channel = None
    
    async def desconectar(self):
        """Desconecta do RabbitMQ"""
        if self.connection:
            await self.connection.close()
            print("🔌 Desconectado do RabbitMQ")
    
    async def publicar_nova_corrida(self, corrida_data: Dict[str, Any]):
        """Publica uma nova corrida na fila para motoristas"""
        if not self.channel:
            await self.conectar()
        
        if not self.channel:
            print("⚠️ RabbitMQ não disponível, pulando publicação")
            return
        
        try:
            # Declara a fila (cria se não existir)
            queue = await self.channel.declare_queue(
                'corridas_pendentes',
                durable=True  # Fila persiste reinícios
            )
            
            # Publica a mensagem
            mensagem = aio_pika.Message(
                body=json.dumps(corrida_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT  # Mensagem persiste
            )
            
            await self.channel.default_exchange.publish(
                mensagem,
                routing_key='corridas_pendentes'
            )
            
            print(f"📤 Corrida {corrida_data.get('id')} publicada no RabbitMQ")
        except Exception as erro:
            print(f"❌ Erro ao publicar no RabbitMQ: {erro}")

# Instância global
rabbitmq_service = RabbitMQService()
