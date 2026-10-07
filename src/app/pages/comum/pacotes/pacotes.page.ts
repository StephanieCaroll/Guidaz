import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-pacotes',
  templateUrl: './pacotes.page.html',
  styleUrls: ['./pacotes.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PacotesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
