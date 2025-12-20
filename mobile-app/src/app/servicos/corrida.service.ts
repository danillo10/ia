import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiMockService } from './api-mock.service';
import { environment } from '../../environments/environment';

export interface Corrida {
  id?: number;
  estado?: string;
  origem?: { lat: number; lon: number };
  destino?: { lat: number; lon: number };
  origem_lat?: number;
  origem_lon?: number;
  destino_lat?: number;
  destino_lon?: number;
  origem_endereco?: string;
  destino_endereco?: string;
  distancia_km?: number;
  duracao_min?: number;
  preco_estimado?: number;
  preco_final?: number;
  passageiro_id?: number;
  motorista_id?: number;
  motorista?: any;
  passageiro?: any;
  motorista_lat?: number;
  motorista_lon?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CorridaService {
  constructor(private api: ApiService, private mockApi: ApiMockService) {}

  estimar(origem: any, destino: any): Observable<any> {
    return environment.useMock
      ? this.mockApi.estimar(origem, destino)
      : this.api.post('/corridas/estimar', { origem, destino });
  }

  criar(origem: any, destino: any): Observable<Corrida> {
    return environment.useMock
      ? this.mockApi.criarCorrida(origem, destino)
      : this.api.post<Corrida>('/corridas', { origem, destino });
  }

  obter(corridaId: number): Observable<Corrida> {
    return environment.useMock
      ? this.mockApi.obterCorrida(corridaId)
      : this.api.get<Corrida>(`/corridas/${corridaId}`);
  }

  cancelar(corridaId: number): Observable<any> {
    return environment.useMock
      ? this.mockApi.cancelarCorrida(corridaId)
      : this.api.post(`/corridas/${corridaId}/cancelar`, {});
  }

  aceitar(corridaId: number): Observable<any> {
    return environment.useMock
      ? this.mockApi.aceitarCorrida(corridaId)
      : this.api.post(`/corridas/${corridaId}/aceitar`, {});
  }

  iniciar(corridaId: number): Observable<any> {
    return environment.useMock
      ? this.mockApi.iniciarCorrida(corridaId)
      : this.api.post(`/corridas/${corridaId}/iniciar`, {});
  }

  finalizar(corridaId: number): Observable<any> {
    return environment.useMock
      ? this.mockApi.finalizarCorrida(corridaId)
      : this.api.post(`/corridas/${corridaId}/finalizar`, {});
  }
}
