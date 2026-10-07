import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-avaliacao-aula',
  templateUrl: './avaliacao-aula.page.html',
  styleUrls: ['./avaliacao-aula.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AvaliacaoAulaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
