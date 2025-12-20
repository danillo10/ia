import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../servicos/api.service';

interface Corrida {
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

@Component({
  selector: 'app-corridas',
  templateUrl: './corridas.page.html',
  styleUrls: ['./corridas.page.scss']
})
export class CorridasPage implements OnInit, OnDestroy {
  corridas: Corrida[] = [];
  corridasFiltradas: Corrida[] = [];
  filtroEstado: string = 'todas';
  carregando = false;
  erro: string | null = null;
  intervaloAtualizacao: any;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.carregarCorridas();
    
    // Atualiza a cada 5 segundos
    this.intervaloAtualizacao = setInterval(() => {
      this.carregarCorridas();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
  }

  async carregarCorridas() {
    this.carregando = true;
    this.erro = null;

    try {
      this.corridas = await this.apiService.listarTodasCorridas();
      this.aplicarFiltro();
    } catch (erro: any) {
      console.error('Erro ao carregar corridas:', erro);
      this.erro = 'Erro ao carregar corridas';
    } finally {
      this.carregando = false;
    }
  }

  filtrarPor(estado: string) {
    this.filtroEstado = estado;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (this.filtroEstado === 'todas') {
      this.corridasFiltradas = [...this.corridas];
    } else if (this.filtroEstado === 'ativas') {
      this.corridasFiltradas = this.corridas.filter(c => 
        c.estado === 'aceita' || c.estado === 'iniciada' || c.estado === 'em_andamento'
      );
    } else {
      this.corridasFiltradas = this.corridas.filter(c => c.estado === this.filtroEstado);
    }
  }

  obterTextoEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'buscando': 'Em Chamada',
      'aceita': 'Aceita',
      'iniciada': 'Iniciada',
      'em_andamento': 'Em Andamento',
      'finalizada': 'Finalizada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  formatarCoordenadas(lat: number, lon: number): string {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
