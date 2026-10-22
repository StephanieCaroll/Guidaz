import { Component } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pagamento-pix',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/aluno/home"></ion-back-button></ion-buttons>
        <ion-title>Pagamento via Pix</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p style="padding: 16px">Tela em construção — responsável: Carlos Gabriel.</p>
    </ion-content>
  `,
})
export class PagamentoPixPage {}
