import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MotoristaAtivo {
  id: number;
  nome: string;
  lat: number;
  lon: number;
  distancia_km?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MotoristaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Lista motoristas ativos próximos ao passageiro
   */
  listarMotoristasAtivos(lat?: number, lon?: number, raioKm: number = 10): Observable<MotoristaAtivo[]> {
    let url = `${this.apiUrl}/motoristas/ativos`;
    const params: any = {};
    
    if (lat !== undefined && lon !== undefined) {
      params.lat = lat.toString();
      params.lon = lon.toString();
      params.raio_km = raioKm.toString();
    }
    
    return this.http.get<MotoristaAtivo[]>(url, { params });
  }

  /**
   * Atualiza status online do motorista
   */
  atualizarStatusOnline(online: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/motoristas/status-online`, { online });
  }

  /**
   * Atualiza localização do motorista
   */
  atualizarLocalizacao(lat: number, lon: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/motoristas/localizacao`, { lat, lon });
  }
}
