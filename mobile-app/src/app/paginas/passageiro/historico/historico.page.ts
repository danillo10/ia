import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
})
export class HistoricoPage implements OnInit {
  corridas: any[] = [
    { id: 1, data: '01/12/2025', valor: 15.50, estado: 'finalizada' },
    { id: 2, data: '28/11/2025', valor: 22.00, estado: 'finalizada' },
    { id: 3, data: '25/11/2025', valor: 18.75, estado: 'cancelada' },
  ];

  constructor() {}

  ngOnInit() {}
}
