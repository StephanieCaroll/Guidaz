import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-gestao-alunos',
  templateUrl: './gestao-alunos.page.html',
  styleUrls: ['./gestao-alunos.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GestaoAlunosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
