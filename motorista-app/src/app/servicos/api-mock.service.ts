import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface MotoristaUsuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  papel: string;
  placa?: string;
}

export interface Corrida {
  id: number;
  passageiro_id: number;
  passageiro?: any;
  motorista_id?: number | null;
  motorista?: any;
  estado: string;
  origem_lat: number;
  origem_lon: number;
  origem_endereco: string;
  destino_lat: number;
  destino_lon: number;
  destino_endereco: string;
  distancia_km: number;
  duracao_min: number;
  preco_estimado: number;      // Valor que passageiro paga (100%)
  preco_motorista?: number;    // Valor que motorista recebe (55%)
  preco_final?: number;
  criada_em?: Date;
  motorista_lat?: number;
  motorista_lon?: number;
  distancia_motorista?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiMockService {
  private corridaIdCounter = 1;
  private corridas: Corrida[] = [];
  private corridasSubject = new BehaviorSubject<Corrida[]>([]);
  public corridas$ = this.corridasSubject.asObservable();

  private usuarios: MotoristaUsuario[] = [
    {
      id: 1,
      nome: 'João Motorista',
      email: 'moto1@mototaxi.local',
      telefone: '(81) 98765-4321',
      papel: 'motociclista',
      placa: 'ABC-1234'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'passageiro1@mototaxi.local', 
      telefone: '(81) 91234-5678',
      papel: 'passageiro'
    }
  ];

  private motoristasOnline = new Set<number>();
  private localizacoesMotoristas = new Map<number, any>();

  constructor() {
    this.criarCorridasMock();
    this.simularNovasCorridas();
  }

  private criarCorridasMock() {
    // Corrida exemplo em Recife
    const corridaMock: Corrida = {
      id: this.corridaIdCounter++,
      passageiro_id: 2,
      passageiro: this.usuarios.find(u => u.id === 2),
      motorista_id: null,
      motorista: null,
      estado: 'buscando',
      origem_lat: -8.0476,
      origem_lon: -34.877,
      origem_endereco: 'Rua da Aurora, 123 - Recife, PE',
      destino_lat: -8.0520,
      destino_lon: -34.8810,
      destino_endereco: 'Shopping Recife - Recife, PE',
      distancia_km: 6.2,
      duracao_min: 15,
      preco_estimado: 26.13,      // Passageiro paga: R$ 5 + (6.2 * 2.15) + (15 * 0.5) = 26.13
      preco_motorista: 14.37,     // Motorista recebe 55%: 26.13 * 0.55 = 14.37
      criada_em: new Date(),
      distancia_motorista: 2.1
    };

    this.corridas.push(corridaMock);
    this.corridasSubject.next([...this.corridas]);
  }

  private simularNovasCorridas() {
    // A cada 30 segundos, simula uma nova corrida se motorista estiver online
    setInterval(() => {
      if (this.motoristasOnline.size > 0) {
        this.criarCorridaAleatoria();
      }
    }, 30000);
  }

  private criarCorridaAleatoria() {
    const origens = [
      { lat: -8.0476, lon: -34.877, endereco: 'Rua da Aurora - Recife, PE' },
      { lat: -8.0600, lon: -34.8720, endereco: 'Av. Boa Viagem - Recife, PE' },
      { lat: -8.0390, lon: -34.9100, endereco: 'Casa Amarela - Recife, PE' }
    ];

    const destinos = [
      { lat: -8.0520, lon: -34.8810, endereco: 'Shopping Recife - Recife, PE' },
      { lat: -8.1180, lon: -34.9040, endereco: 'Aeroporto - Recife, PE' },
      { lat: -8.0500, lon: -34.8900, endereco: 'Marco Zero - Recife, PE' }
    ];

    const origem = origens[Math.floor(Math.random() * origens.length)];
    const destino = destinos[Math.floor(Math.random() * destinos.length)];

    const distancia = this.calcularDistancia(origem.lat, origem.lon, destino.lat, destino.lon);
    const duracao = (distancia / 30) * 60;
    // Passageiro paga: R$ 5,00 base + R$ 2,15/km + R$ 0,50/min
    const preco_passageiro = 5 + (distancia * 2.15) + (duracao * 0.5);
    // Motorista recebe 55% do valor total, com mínimo de R$ 7,00
    const preco_motorista = Math.max(preco_passageiro * 0.55, 7.0);

    const novaCorrida: Corrida = {
      id: this.corridaIdCounter++,
      passageiro_id: 2,
      passageiro: this.usuarios.find(u => u.id === 2),
      motorista_id: null,
      motorista: null,
      estado: 'buscando',
      origem_lat: origem.lat,
      origem_lon: origem.lon,
      origem_endereco: origem.endereco,
      destino_lat: destino.lat,
      destino_lon: destino.lon,
      destino_endereco: destino.endereco,
      distancia_km: parseFloat(distancia.toFixed(1)),
      duracao_min: parseFloat(duracao.toFixed(0)),
      preco_estimado: parseFloat(preco_passageiro.toFixed(2)), // Valor que passageiro paga
      preco_motorista: parseFloat(preco_motorista.toFixed(2)),  // Valor que motorista recebe (55%)
      criada_em: new Date(),
      distancia_motorista: Math.random() * 5 + 0.5 // 0.5 a 5.5 km
    };

    this.corridas.push(novaCorrida);
    this.corridasSubject.next([...this.corridas]);

    console.log(`[MOCK] Nova corrida disponível #${novaCorrida.id} - R$ ${novaCorrida.preco_estimado}`);
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Métodos públicos da API

  entrar(email: string, senha: string): Observable<any> {
    const usuario = this.usuarios.find(u => u.email === email && u.papel === 'motociclista');
    
    if (!usuario) {
      return throwError(() => ({ message: 'Usuário não encontrado ou não é motorista' })).pipe(delay(800));
    }
    
    if (senha !== '123456') {
      return throwError(() => ({ message: 'Senha incorreta' })).pipe(delay(800));
    }
    
    return of({
      access_token: 'mock-jwt-token-motorista',
      token_type: 'bearer',
      usuario: usuario
    }).pipe(delay(800));
  }

  statusOnline(online: boolean, motoristaId: number = 1): Observable<any> {
    if (online) {
      this.motoristasOnline.add(motoristaId);
      console.log(`[MOCK] Motorista #${motoristaId} está ONLINE`);
    } else {
      this.motoristasOnline.delete(motoristaId);
      console.log(`[MOCK] Motorista #${motoristaId} está OFFLINE`);
    }
    return of({ online, motorista_id: motoristaId }).pipe(delay(200));
  }

  atualizarLocalizacao(coords: any, motoristaId: number = 1): Observable<any> {
    this.localizacoesMotoristas.set(motoristaId, {
      lat: coords.lat,
      lon: coords.lon,
      timestamp: new Date()
    });
    return of({ ok: true }).pipe(delay(100));
  }

  buscarChamadasProximas(lat: number, lon: number, raioKm: number = 10): Observable<Corrida[]> {
    const corridasDisponiveis = this.corridas.filter(c => 
      c.estado === 'buscando' && 
      c.distancia_motorista && 
      c.distancia_motorista <= raioKm
    );
    
    return of(corridasDisponiveis).pipe(delay(300));
  }

  aceitarCorrida(id: number, motoristaId: number = 1): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida && corrida.estado === 'buscando') {
      corrida.estado = 'aceita';
      corrida.motorista_id = motoristaId;
      corrida.motorista = this.usuarios.find(u => u.id === motoristaId);
      
      this.corridasSubject.next([...this.corridas]);
      console.log(`[MOCK] Corrida #${id} aceita pelo motorista #${motoristaId}`);
      
      return of({ ok: true }).pipe(delay(300));
    }
    throw new Error('Corrida não disponível');
  }

  obterCorrida(id: number): Observable<Corrida> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida) {
      return of(corrida).pipe(delay(200));
    }
    throw new Error('Corrida não encontrada');
  }

  iniciarCorrida(id: number): Observable<any> {
    const corrida = this.corridas.find(c => c.id === id);
    if (corrida && corrida.estado === 'aceita') {
      corrida.estado = 'iniciada';
      
      // Simula mudança para "em_andamento" após 3 segundos
      setTimeout(() => {
        const c = this.corridas.find(x => x.id === id);
        if (c && c.estado === 'iniciada') {
          c.estado = 'em_andamento';
          this.corridasSubject.next([...this.corridas]);
          console.log(`[MOCK] Corrida #${id} agora em andamento`);
        }
      }, 3000);
      
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
      corrida.preco_final = corrida.preco_estimado + (Math.random() * 2 - 1);
      corrida.preco_final = parseFloat(corrida.preco_final.toFixed(2));
      
      this.corridasSubject.next([...this.corridas]);
      console.log(`[MOCK] Corrida #${id} finalizada - Valor: R$ ${corrida.preco_final}`);
      
      return of({ ok: true, preco_final: corrida.preco_final }).pipe(delay(300));
    }
    throw new Error('Corrida não pode ser finalizada');
  }
}