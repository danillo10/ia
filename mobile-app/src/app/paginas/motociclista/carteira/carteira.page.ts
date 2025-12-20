import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-carteira',
  templateUrl: './carteira.page.html',
  styleUrls: ['./carteira.page.scss'],
})
export class CarteiraPage implements OnInit {
  saldo = 1250.75;
  historico = [
    { data: '01/12/2025', descricao: 'Corrida #45', valor: 22.50, tipo: 'credito' },
    { data: '01/12/2025', descricao: 'Corrida #44', valor: 18.00, tipo: 'credito' },
    { data: '30/11/2025', descricao: 'Saque Banco', valor: -500.00, tipo: 'debito' },
    { data: '30/11/2025', descricao: 'Corrida #43', valor: 30.25, tipo: 'credito' },
  ];

  constructor() {}

  ngOnInit() {}
}
