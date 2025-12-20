import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EnderecoSugestao {
  nome: string;
  nomeCompleto: string;
  lat: number;
  lon: number;
  tipo: string;
  placeId?: string;
}

export interface Coordenadas {
  lat: number;
  lon: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodificacaoService {
  private readonly API_KEY = environment.googleMapsApiKey;
  private localizacaoUsuario: { lat: number; lon: number } | null = null;

  constructor(private http: HttpClient) {}

  definirLocalizacaoUsuario(lat: number, lon: number) {
    this.localizacaoUsuario = { lat, lon };
    console.log('Localização do usuário definida:', this.localizacaoUsuario);
  }

  buscarEnderecos(texto: string, limite: number = 10): Observable<EnderecoSugestao[]> {
    if (!texto || texto.trim().length < 3) {
      return of([]);
    }



    const params: any = {
      input: texto.trim(),
      language: 'pt-BR',
      components: 'country:br'
    };

    if (this.localizacaoUsuario) {
      params.location = `${this.localizacaoUsuario.lat},${this.localizacaoUsuario.lon}`;
      params.radius = 50000;
    }

    const url = `http://localhost:8000/api/v1/geocodificacao/autocomplete`;

    return this.http.get<any>(url, { params }).pipe(
      switchMap(response => {
        if (response.status !== 'OK' || !response.predictions || response.predictions.length === 0) {
          console.warn('Google Places:', response.status);
          return of([]);
        }

        const detalhes$ = response.predictions
          .slice(0, limite)
          .map((pred: any) => this.obterDetalhesLugar(pred.place_id, pred.description));

        if (detalhes$.length === 0) {
          return of([]);
        }

        return (forkJoin(detalhes$) as Observable<(EnderecoSugestao | null)[]>).pipe(
          map(resultados => resultados.filter((r): r is EnderecoSugestao => r !== null)),
          map(resultados => this.ordenarPorProximidade(resultados))
        );
      }),
      catchError(erro => {
        console.error('Erro Google Places:', erro);
        return of([]);
      })
    );
  }









  private obterDetalhesLugar(placeId: string, descricao: string): Observable<EnderecoSugestao | null> {
    const params = {
      place_id: placeId,
      fields: 'geometry,name,formatted_address,types',
      language: 'pt-BR'
    };

    const url = `http://localhost:8000/api/v1/geocodificacao/place-details`;

    return this.http.get<any>(url, { params }).pipe(
      map(response => {
        if (response.status !== 'OK' || !response.result) return null;

        const result = response.result;
        const location = result.geometry?.location;

        if (!location) return null;

        return {
          nome: result.name || descricao.split(',')[0],
          nomeCompleto: result.formatted_address || descricao,
          lat: location.lat,
          lon: location.lng,
          tipo: this.determinarTipo(result.types || []),
          placeId: placeId
        };
      }),
      catchError(() => of(null))
    );
  }

  buscarEnderecoPorCoordenadas(lat: number, lon: number): Observable<string> {


    const params = { latlng: `${lat},${lon}`, language: 'pt-BR' };
    const url = `http://localhost:8000/api/v1/geocodificacao/geocode`;

    return this.http.get<any>(url, { params }).pipe(
      map(response => {
        if (response?.results && response.results.length > 0) {
          // Pega o endereço mais específico (primeiro resultado)
          const endereco = response.results[0].formatted_address;
          // Remove informações redundantes e retorna endereço limpo
          return endereco.replace(/, Brasil$/, '').replace(/ - [A-Z]{2},/, ',');
        }
        // Se não houver resultados, retorna mensagem
        return '';
      }),
      catchError(erro => {
        console.error('Erro ao buscar endereço:', erro);
        return of('');
      })
    );
  }



  private ordenarPorProximidade(resultados: EnderecoSugestao[]): EnderecoSugestao[] {
    if (!this.localizacaoUsuario || resultados.length === 0) {
      return resultados;
    }

    const userLat = this.localizacaoUsuario.lat;
    const userLon = this.localizacaoUsuario.lon;

    return resultados
      .map(r => ({
        ...r,
        distancia: this.calcularDistancia(userLat, userLon, r.lat, r.lon)
      }))
      .sort((a, b) => a.distancia - b.distancia)
      .map(({ distancia, ...resto }) => resto);
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private determinarTipo(types: string[]): string {
    if (types.includes('route') || types.includes('street_address')) return 'street';
    if (types.includes('locality')) return 'city';
    if (types.includes('point_of_interest') || types.includes('establishment')) return 'poi';
    if (types.includes('premise')) return 'building';
    return 'other';
  }

  obterIconePorTipo(tipo: string): string {
    const icones: Record<string, string> = {
      'street': 'navigate-outline',
      'city': 'location-outline',
      'poi': 'business-outline',
      'building': 'home-outline',
      'other': 'location-outline'
    };
    return icones[tipo] || 'location-outline';
  }
}