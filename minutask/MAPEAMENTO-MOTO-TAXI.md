# Mapeamento Moto Táxi → Minutask

O Moto Táxi **não foi alterado**. O Minutask replica o mesmo padrão em código novo.

| Moto Táxi | Minutask |
|-----------|----------|
| `Corrida` | `Tarefa` |
| `passageiro` | `contratante` |
| `motociclista` / `motorista` | `trabalhador` |
| `estado: buscando` | `estado: buscando` |
| `POST .../aceitar` (409 se ocupada) | `POST /trabalhador/tarefas/{id}/aceitar` |
| `POST .../recusar` | `POST /trabalhador/tarefas/{id}/recusar` |
| RabbitMQ `corridas_pendentes` | `jobs_pendentes` |
| Parar broadcast após aceite | `jobs_encerrados` + evento WS `tarefa_aceita` |
| `mobile-app` (passageiro) | `app-contratante` (Flutter) |
| `motorista-app` | `app-trabalhador` (Flutter) |
| Origem/destino GPS | Local do serviço + `descricao` livre |
| Foto capacete | Análise de documento no cadastro |

Portas separadas: API moto `8000`, Minutask `8001`.
