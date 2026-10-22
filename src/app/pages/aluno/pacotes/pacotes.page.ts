import { Component } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pacotes',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/aluno/home"></ion-back-button></ion-buttons>
        <ion-title>Pacotes de aulas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p style="padding: 16px">Tela em construção — responsável: Carlos Gabriel.</p>
    </ion-content>
  `,
})
export class PacotesPage {}
