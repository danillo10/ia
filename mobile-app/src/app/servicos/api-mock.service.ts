import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiMockService {
  // Gerenciamento de estado global para sincronizar entre "apps"
  private corridasSubject = new BehaviorSubject<any[]>([]);
  public corridas$ = this.corridasSubject.asObservable();
  
  private motoristasOnline: Set<number> = new Set();
  
  private usuarios = [
    { id: 1, nome: 'Admin', email: 'admin@mototaxi.local', papel: 'admin', senha: 'admin123' },
    { id: 2, nome: 'João Silva', email: 'passageiro1@mototaxi.local', papel: 'passageiro', senha: '123456', telefone: '(81) 98765-4321' },
    { id: 3, nome: 'Carlos Moto', email: 'moto1@mototaxi.local', papel: 'motociclista', senha: '123456', telefone: '(81) 99876-5432', placa: 'ABC-1234' },
    { id: 4, nome: 'Maria Santos', email: 'passageiro2@mototaxi.local', papel: 'passageiro', senha: '123456', telefone: '(81) 98888-9999' },
    { id: 5, nome: 'Pedro Rider', email: 'moto2@mototaxi.local', papel: 'motociclista', senha: '123456', telefone: '(81) 97777-6666', placa: 'XYZ-9876' }
  ];

  private corridas: any[] = [];
  private corridaIdCounter = 1;
  
  private localizacoesMotoristas: Map<number, { lat: number, lon: number, timestamp: Date }> = new Map();

  entrar(email: string, senha: string): Observable<any> {
    const usuario = this.usuarios.find(u => u.email === email && u.senha === senha);
    
    if (usuario) {
      const { senha: _, ...usuarioSemSenha } = usuario;
      return of({
        token: 'mock_token_' + Math.random().toString(36).substr(2, 9),
        usuario: usuarioSemSenha
      }).pipe(delay(500));
    }
    
    throw new Error('Credenciais inválidas');
  }

  registrar(dados: any): Observable<any> {
    const novoId = this.usuarios.length + 1;
    const novoUsuario = {
      id: novoId,
      nome: dados.nome,
      email: dados.email,
      papel: dados.papel || 'passageiro',
      senha: dados.senha
    };
    this.usuarios.push(novoUsuario);
    
    return of({ mensagem: 'Usuário criado com sucesso' }).pipe(delay(500));
  }

  estimar(origem: any, destino: any): Observable<any> {
    const distancia = this.calcularDistancia(origem.lat, origem.lon, destino.lat, destino.lon);
    const duracao = (distancia / 30) * 60; // 30 km/h
    const preco_passageiro = 5 + (distancia * 2.15) + (duracao * 0.5);
    const preco_motorista = preco_passageiro * 0.55;
    
    return of({
      rota: {
        distancia_km: parseFloat(distancia.toFixed(1)),
        duracao_min: parseFloat(duracao.toFixed(0))
      },
      preco_estimado: parseFloat(preco_passageiro.toFixed(2)),
      preco_motorista: parseFloat(preco_motorista.toFixed(2)),
      taxa_app: parseFloat((preco_passageiro - preco_motorista).toFixed(2)),
      taxa_app_percentual: 45.0,
      percentual_motorista: 55.0
    }).pipe(delay(800));
  }

  criarCorrida(origem: any, destino: any, passageiroId: number = 2): Observable<any> {
    const distancia = this.calcularDistancia(origem.lat, origem.lon, destino.lat, destino.lon);
    const duracao = (distancia / 30) * 60;
    // Passageiro paga: R$ 5,00 base + R$ 2,15/km + R$ 0,50/min
    const preco_passageiro = 5 + (distancia * 2.15) + (duracao * 0.5);
    // Motorista recebe 55% do valor total, com mínimo de R$ 7,00
    const preco_motorista = Math.max(preco_passageiro * 0.55, 7.0);
    
    // Usa endereços se fornecidos, senão usa coordenadas formatadas
    const origemEndereco = origem.endereco || `${origem.lat.toFixed(4)}, ${origem.lon.toFixed(4)}`;
    const destinoEndereco = destino.endereco || `${destino.lat.toFixed(4)}, ${destino.lon.toFixed(4)}`;
    
    const corrida = {
      id: this.corridaIdCounter++,
      passageiro_id: passageiroId,
      passageiro: this.usuarios.find(u => u.id === passageiroId),
      motorista_id: null,
      motorista: null,
      estado: 'buscando',
      origem_lat: origem.lat,
      origem_lon: origem.lon,
      origem_endereco: origemEndereco,
      destino_lat: destino.lat,
      destino_lon: destino.lon,
      destino_endereco: destinoEndereco,
      distancia_km: parseFloat(distancia.toFixed(1)),
      duracao_min: parseFloat(duracao.toFixed(0)),
      preco_estimado: parseFloat(preco_passageiro.toFixed(2)),  // Valor que passageiro paga
      preco_motorista: parseFloat(preco_motorista.toFixed(2)),  // Valor que motorista recebe (55%)
      preco_final: 0,
      criada_em: new Date(),
      motorista_lat: null,
      motorista_lon: null
    };
    
    this.corridas.push(corrida);
    this.corridasSubject.next([...this.corridas]);
    
    // NÃO auto-aceita mais - motorista deve aceitar manualmente
    console.log(`[MOCK] Corrida #${corrida.id} criada - Aguardando motorista aceitar`);
    
    return of(corrida).pipe(delay(500));
  }

  obterCorrida(id: number): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida) {
      return of(corrida).pipe(delay(300));
    }
    throw new Error('Corrida não encontrada');
  }

  cancelarCorrida(id: number): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida) {
      corrida.estado = 'cancelada';
      return of({ ok: true }).pipe(delay(300));
    }
    throw new Error('Corrida não encontrada');
  }

  aceitarCorrida(id: number, motocistaId: number = 3): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida && corrida.estado === 'buscando') {
      corrida.motorista_id = motocistaId;
      corrida.motorista = this.usuarios.find(u => u.id === motocistaId);
      corrida.estado = 'aceita';
      corrida.aceita_em = new Date();
      
      // Define localização inicial do motorista
      const motoristaLoc = this.localizacoesMotoristas.get(motocistaId);
      if (motoristaLoc) {
        corrida.motorista_lat = motoristaLoc.lat;
        corrida.motorista_lon = motoristaLoc.lon;
      }
      
      this.corridasSubject.next([...this.corridas]);
      console.log(`[MOCK] Corrida #${id} aceita por motorista #${motocistaId}`);
      
      return of({ ok: true, corrida }).pipe(delay(300));
    }
    throw new Error('Corrida já aceita ou não encontrada');
  }

  iniciarCorrida(id: number): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida && corrida.estado === 'aceita') {
      corrida.estado = 'iniciada';
      corrida.iniciada_em = new Date();
      
      // Simula início da viagem - muda para "em andamento" após 2 segundos
      setTimeout(() => {
        const c = this.corridas.find(x => x.id === id);
        if (c && c.estado === 'iniciada') {
          c.estado = 'em_andamento';
          this.corridasSubject.next([...this.corridas]);
          console.log(`[MOCK] Corrida #${id} agora em andamento`);
        }
      }, 2000);
      
      this.corridasSubject.next([...this.corridas]);
      console.log(`[MOCK] Corrida #${id} iniciada`);
      
      return of({ ok: true }).pipe(delay(300));
    }
    throw new Error('Corrida não pode ser iniciada');
  }

  finalizarCorrida(id: number): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida && (corrida.estado === 'em_andamento' || corrida.estado === 'iniciada')) {
      corrida.estado = 'finalizada';
      corrida.preco_final = corrida.preco_estimado + (Math.random() * 2 - 1); // Pequena variação
      corrida.preco_final = parseFloat(corrida.preco_final.toFixed(2));
      corrida.finalizada_em = new Date();
      
      this.corridasSubject.next([...this.corridas]);
      console.log(`[MOCK] Corrida #${id} finalizada - Valor: R$ ${corrida.preco_final}`);
      
      return of({ ok: true, preco_final: corrida.preco_final }).pipe(delay(300));
    }
    throw new Error('Corrida não pode ser finalizada');
  }

  statusOnline(online: boolean, motoristaId: number = 3): Observable<any> {
    if (online) {
      this.motoristasOnline.add(motoristaId);
      console.log(`[MOCK] Motorista #${motoristaId} está ONLINE`);
    } else {
      this.motoristasOnline.delete(motoristaId);
      console.log(`[MOCK] Motorista #${motoristaId} está OFFLINE`);
    }
    return of({ online, motorista_id: motoristaId }).pipe(delay(200));
  }

  atualizarLocalizacao(coords: any, motoristaId: number = 3): Observable<any> {
    this.localizacoesMotoristas.set(motoristaId, {
      lat: coords.lat,
      lon: coords.lon,
      timestamp: new Date()
    });
    
    // Atualiza localização do motorista em corridas ativas
    const corridaAtiva = this.corridas.find(c => 
      c.motorista_id === motoristaId && 
      ['aceita', 'iniciada', 'em_andamento'].includes(c.estado)
    );
    
    if (corridaAtiva) {
      corridaAtiva.motorista_lat = coords.lat;
      corridaAtiva.motorista_lon = coords.lon;
      this.corridasSubject.next([...this.corridas]);
    }
    
    return of({ ok: true }).pipe(delay(100));
  }

  buscarChamadasProximas(motoristaLat: number, motoristaLon: number, raioKm: number = 5): Observable<any[]> {
    const chamadasProximas = this.corridas
      .filter(c => c.estado === 'buscando')
      .map(c => {
        const distancia = this.calcularDistancia(motoristaLat, motoristaLon, c.origem_lat, c.origem_lon);
        return { ...c, distancia_motorista: parseFloat(distancia.toFixed(2)) };
      })
      .filter(c => c.distancia_motorista <= raioKm)
      .sort((a, b) => a.distancia_motorista - b.distancia_motorista);
    
    console.log(`[MOCK] ${chamadasProximas.length} chamadas encontradas em raio de ${raioKm}km`);
    return of(chamadasProximas).pipe(delay(500));
  }

  obterHistorico(usuarioId: number, papel: string): Observable<any[]> {
    let historico = [];
    
    if (papel === 'passageiro') {
      historico = this.corridas.filter(c => c.passageiro_id === usuarioId);
    } else if (papel === 'motociclista') {
      historico = this.corridas.filter(c => c.motorista_id === usuarioId);
    }
    
    return of(historico.reverse()).pipe(delay(400));
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
