import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-historico-avaliacoes',
  templateUrl: './historico-avaliacoes.page.html',
  styleUrls: ['./historico-avaliacoes.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistoricoAvaliacoesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
