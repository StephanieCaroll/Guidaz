import { Component } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-saldo-aulas',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/aluno/home"></ion-back-button></ion-buttons>
        <ion-title>Saldo de aulas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p style="padding: 16px">Tela em construção — responsável: Gabriel Pacheco.</p>
    </ion-content>
  `,
})
export class SaldoAulasPage {}
