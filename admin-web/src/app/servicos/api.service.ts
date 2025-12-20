import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MotoristaOnline {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  placa?: string;
  online: boolean;
  lat: number;
  lon: number;
  ultima_localizacao_em: string;
}

export interface Corrida {
  id: number;
  passageiro_id: number;
  motorista_id?: number;
  estado: string;
  origem_lat: number;
  origem_lon: number;
  destino_lat: number;
  destino_lon: number;
  origem_endereco?: string;
  destino_endereco?: string;
  distancia_km: number;
  duracao_min: number;
  preco_estimado: number;
  preco_motorista?: number;
  preco_final?: number;
  criado_em: string;
  aceito_em?: string;
  iniciado_em?: string;
  finalizado_em?: string;
  passageiro?: { nome: string };
  motorista?: { nome: string };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarMotoristasOnline(): Observable<MotoristaOnline[]> {
    return this.http.get<MotoristaOnline[]>(`${this.baseUrl}/motoristas/ativos`);
  }

  listarCorridas(): Observable<Corrida[]> {
    return this.http.get<Corrida[]>(`${this.baseUrl}/admin/corridas`);
  }

  async listarTodasCorridas(): Promise<Corrida[]> {
    return this.http.get<Corrida[]>(`${this.baseUrl}/corridas`).toPromise() as Promise<Corrida[]>;
  }

  obterEstatisticas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/estatisticas`);
  }
}
