# 🚀 Guia de Simulação Completa - Moto Táxi

## 🎯 Objetivo
Simular a interação completa entre **Passageiro** e **Motorista** usando dados mockados, **SEM BACKEND**.

## ✅ Pré-requisitos
- ✅ `environment.useMock = true` (já configurado)
- ✅ Servidor Ionic: `ionic serve --port=8100`

## 📱 Simulação Super Rápida (2 Abas)

### 🟢 Login com 1 Clique

#### **Aba 1 - Passageiro:**
1. Abra `http://localhost:8100`
2. Clique em **"Entrar como Passageiro"** (botão azul)
3. ✅ Login automático como João Silva
4. Redirecionado para `/passageiro/mapa`

#### **Aba 2 - Motorista:**
1. Abra nova aba: `http://localhost:8100`
2. Clique em **"Entrar como Motorista"** (botão verde)
3. ✅ Login automático como Carlos Moto
4. Redirecionado para `/motociclista/chamadas`

---

## 🎬 Fluxo de Teste

### 1️⃣ Motorista Online (Aba 2)
- Toggle **ONLINE** (fica verde 🟢)
- ✅ "Aguardando chamadas..."
- Sistema busca a cada 5s

### 2️⃣ Passageiro Solicita (Aba 1)
- Clique "Obter Minha Localização"
- "Definir Destino" → Lat `-8.06`, Lon `-34.88`
- "Calcular Estimativa" → veja preço
- **"Solicitar Corrida"**
- ✅ Estado: **BUSCANDO** 🟡

### 3️⃣ Motorista Aceita (Aba 2)
- Em até 5s, corrida aparece no card
- Veja: distância, origem, destino, R$
- Clique **"Aceitar Corrida"**
- ✅ Vai para `/motociclista/executar/1`

### 4️⃣ Passageiro Recebe Confirmação (Aba 1)
- ✅ Toast: "Carlos Moto aceitou!"
- Estado: **ACEITA** 🔵
- Veja dados do motorista (nome, tel, placa)

### 5️⃣ Motorista Inicia (Aba 2)
- "Tirar Foto do Capacete" (simula)
- **"Iniciar Corrida"**
- ✅ Estado: **INICIADA** → **EM_ANDAMENTO** 🟢

### 6️⃣ Passageiro Vê Início (Aba 1)
- ✅ Toast: "Corrida iniciada!"
- Badge verde

### 7️⃣ Motorista Finaliza (Aba 2)
- **"Finalizar Corrida"**
- ✅ Alert: "R$ 24.87"
- Volta para chamadas

### 8️⃣ Passageiro Avalia (Aba 1)
- ✅ Toast: "Finalizada! R$ 24.87"
- Estado: **FINALIZADA** ✅
- Clique "Avaliar Motorista"
- Dê nota (1-5) + comentário
- "Nova Corrida"

---

## 👥 Contas Mock

**Passageiros:**
- `passageiro1@mototaxi.local` / `123456` (João Silva)
- `passageiro2@mototaxi.local` / `123456` (Maria Santos)

**Motoristas:**
- `moto1@mototaxi.local` / `123456` (Carlos Moto - ABC-1234)
- `moto2@mototaxi.local` / `123456` (Pedro Rider - XYZ-9876)

---

## 🔍 Debug Console

Abra DevTools (F12) e veja:
```
[MOCK] Corrida #1 criada - Aguardando motorista aceitar
[MOCK] 1 chamadas encontradas em raio de 10km
[MOCK] Corrida #1 aceita por motorista #3
[MOCK] Corrida #1 iniciada
[MOCK] Corrida #1 agora em andamento
[MOCK] Corrida #1 finalizada - Valor: R$ 24.87
```

---

## 💡 Extras

### Cancelar Corrida
- Estado "buscando" ou "aceita"
- Passageiro clica "Cancelar"
- Estado → **CANCELADA**

### Múltiplas Corridas
- Solicite várias corridas
- IDs: #1, #2, #3...
- Motorista vê todas "buscando"

### 2 Motoristas Competindo
- Abra 3ª aba como `moto2@mototaxi.local`
- Ambos online
- Primeiro que aceitar ganha

---

## 🎨 Estados Visuais

| Estado | Badge | Significado |
|--------|-------|-------------|
| 🟡 BUSCANDO | Amarelo | Aguardando motorista |
| 🔵 ACEITA | Azul | Motorista a caminho |
| 🟢 INICIADA | Verde | Preparando para sair |
| 🟢 EM_ANDAMENTO | Verde | Viagem acontecendo |
| ✅ FINALIZADA | Verde | Concluída |
| ❌ CANCELADA | Vermelho | Cancelada |

---

## ⚡ Recursos Mock

✅ BehaviorSubject sincroniza estados  
✅ Auto-atualização a cada 2s (passageiro) e 5s (motorista)  
✅ Dados persistem na memória (até refresh)  
✅ Delays simulam latência real (100-800ms)  
✅ Transições automáticas de estado  
✅ Localização com Haversine real  

---

**100% PT-BR 🇧🇷 | Mock Completo | Zero Backend**
   - Toggle o botão "Online/Offline" para **ONLINE**
   - ✅ Aparecerá: "Você está online! Aguardando chamadas..."
   - 🔍 O sistema começará a buscar chamadas a cada 5 segundos

5. **Deixe essa aba aberta** (ela ficará esperando chamadas)

### Parte 3: Login como Passageiro (Aba 1)

1. Na **Aba 1**, faça login:
   - **Email:** `passageiro1@mototaxi.local`
   - **Senha:** `123456`

2. Clique em **Entrar**

3. Você será redirecionado para `/passageiro/mapa`

### Parte 4: Solicitar Corrida (Aba 1 - Passageiro)

1. **Definir Origem:**
   - Clique em "Obter Minha Localização"
   - OU defina manualmente (ex: Lat -8.05, Lon -34.90)

2. **Definir Destino:**
   - Clique em "Definir Destino Manualmente"
   - Digite coordenadas diferentes (ex: Lat -8.06, Lon -34.88)

3. **Calcular Estimativa:**
   - Clique em "Calcular Estimativa"
   - ✅ Verá: distância, duração e preço estimado

4. **Solicitar Corrida:**
   - Clique em "Solicitar Corrida"
   - ✅ Mensagem: "Corrida solicitada! Procurando motorista..."
   - Você será redirecionado para `/passageiro/acompanhar/[ID]`
   - Estado inicial: **"BUSCANDO"**

### Parte 5: Motorista Aceita (Aba 2)

1. **Volte para Aba 2** (Motorista)

2. Em até 5 segundos, a corrida aparecerá na lista:
   - Você verá um CARD com:
     - Distância até o passageiro
     - Origem e Destino
     - Valor estimado da corrida

3. **Aceite a Corrida:**
   - Clique em "Aceitar Corrida"
   - ✅ Mensagem: "Corrida aceita! Navegue até o passageiro."
   - Você será redirecionado para `/motociclista/executar/[ID]`

### Parte 6: Passageiro Recebe Confirmação (Aba 1)

1. **Volte para Aba 1** (Passageiro)

2. A página de acompanhamento atualizará automaticamente:
   - ✅ Toast: "Carlos Moto aceitou sua corrida!"
   - Estado muda para: **"ACEITA"**
   - Aparecerão informações do motorista:
     - Nome: Carlos Moto
     - Telefone: (81) 99876-5432
     - Placa: ABC-1234

### Parte 7: Motorista Inicia a Corrida (Aba 2)

1. Na **Aba 2** (página `/motociclista/executar/[ID]`):

2. **Tirar Foto do Capacete:**
   - Clique em "Tirar Foto do Capacete"
   - ⚠️ No navegador, a câmera pode não funcionar
   - Mas o botão "Iniciar Corrida" será habilitado mesmo assim

3. **Iniciar Corrida:**
   - Clique em "Iniciar Corrida"
   - ✅ Estado muda para "INICIADA"
   - Após 2 segundos, muda automaticamente para "EM_ANDAMENTO"

### Parte 8: Passageiro Vê Início (Aba 1)

1. **Volte para Aba 1** (Passageiro)

2. A página atualizará:
   - ✅ Toast: "Corrida iniciada! Boa viagem!"
   - Estado: **"EM_ANDAMENTO"**
   - Badge fica VERDE

### Parte 9: Motorista Finaliza (Aba 2)

1. Na **Aba 2** (Motorista):

2. **Finalizar Corrida:**
   - Clique em "Finalizar Corrida"
   - ✅ Alert mostrará o valor final (ex: R$ 24.87)
   - Você voltará para `/motociclista/chamadas`

### Parte 10: Passageiro Avalia (Aba 1)

1. **Volte para Aba 1** (Passageiro)

2. A página atualizará:
   - ✅ Toast: "Corrida finalizada! Valor: R$ 24.87"
   - Estado: **"FINALIZADA"**
   - Aparece botão "Avaliar Motorista"

3. **Avaliar:**
   - Clique em "Avaliar Motorista"
   - Digite nota (1-5)
   - Adicione comentário (opcional)
   - Clique em "Enviar"
   - ✅ Mensagem: "Avaliação enviada!"

## 🎭 Contas Disponíveis

### Passageiros
- **Email:** `passageiro1@mototaxi.local` | **Senha:** `123456`
- **Email:** `passageiro2@mototaxi.local` | **Senha:** `123456`

### Motoristas
- **Email:** `moto1@mototaxi.local` | **Senha:** `123456`
- **Email:** `moto2@mototaxi.local` | **Senha:** `123456`

## 🔍 Monitoramento

### Console do Navegador
Abra o DevTools (F12) e veja o console:
```
[MOCK] Corrida #1 criada - Aguardando motorista aceitar
[MOCK] 1 chamadas encontradas em raio de 10km
[MOCK] Corrida #1 aceita por motorista #3
[MOCK] Corrida #1 iniciada
[MOCK] Corrida #1 agora em andamento
[MOCK] Corrida #1 finalizada - Valor: R$ 24.87
```

### Estados da Corrida
1. **buscando** → Passageiro aguardando motorista
2. **aceita** → Motorista aceitou, indo buscar
3. **iniciada** → Motorista chegou, preparando para sair
4. **em_andamento** → Viagem em andamento
5. **finalizada** → Corrida concluída
6. **cancelada** → Cancelada por alguma parte

## 💡 Dicas

### Testar Cancelamento
- No estado "buscando" ou "aceita", o passageiro pode cancelar
- Clique em "Cancelar Corrida" → confirme no alert
- Estado muda para "cancelada"

### Testar Múltiplas Corridas
- Você pode solicitar várias corridas
- Cada uma terá um ID único (#1, #2, #3...)
- Motorista verá todas as corridas "buscando" próximas

### Simular Dois Motoristas
- Abra uma **3ª aba** e faça login com `moto2@mototaxi.local`
- Fique online
- Crie múltiplas corridas na aba do passageiro
- Motoristas podem competir para aceitar primeiro

## 🐛 Troubleshooting

### Chamadas não aparecem para o motorista
- Verifique se o motorista está ONLINE (toggle verde)
- Verifique se há corridas em estado "buscando"
- Aguarde até 5 segundos (intervalo de polling)

### Página não atualiza automaticamente
- Modo mock usa polling a cada 2 segundos
- Atualize manualmente com F5 se necessário
- Verifique console por erros

### Geolocalização não funciona
- Permita acesso à localização no navegador
- Ou defina coordenadas manualmente
- Mock aceita ambos os métodos

## ✨ Recursos Mock

### Dados Persistentes (Memória)
- Corridas ficam salvas enquanto a página não recarregar
- Histórico acumula todas as corridas da sessão
- Usuários mock são fixos

### Auto-atualização
- Passageiro recebe updates a cada 2s
- Motorista busca chamadas a cada 5s
- BehaviorSubject sincroniza estados

### Simulações Realistas
- Delays simulam latência de rede (100-800ms)
- Transição "iniciada" → "em_andamento" (2s)
- Valor final tem pequena variação (±R$ 1,00)

---

**Desenvolvido 100% em PT-BR 🇧🇷**
