import { Component } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gestao-alunos',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/instrutor/home"></ion-back-button></ion-buttons>
        <ion-title>Gestão de alunos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p style="padding: 16px">Tela em construção — responsável: Lucas Gabriel.</p>
    </ion-content>
  `,
})
export class GestaoAlunosPage {}
