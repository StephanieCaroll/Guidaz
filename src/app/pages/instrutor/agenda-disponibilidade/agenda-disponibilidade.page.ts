import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-agenda-disponibilidade',
  templateUrl: './agenda-disponibilidade.page.html',
  styleUrls: ['./agenda-disponibilidade.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AgendaDisponibilidadePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
