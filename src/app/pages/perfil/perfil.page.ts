import { Component, inject } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login"></ion-back-button></ion-buttons>
        <ion-title>Meu perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (auth.usuario(); as u) {
        <ion-list>
          <ion-item><ion-label><p>Nome</p>{{ u.nome }}</ion-label></ion-item>
          <ion-item><ion-label><p>E-mail</p>{{ u.email }}</ion-label></ion-item>
          <ion-item><ion-label><p>Perfil</p>{{ u.perfil === 'instrutor' ? 'Instrutor' : 'Aluno' }}</ion-label></ion-item>
          <ion-item><ion-label><p>Telefone</p>{{ u.telefone }}</ion-label></ion-item>
        </ion-list>
      }
      <ion-button expand="block" color="danger" class="ion-margin" (click)="auth.logout()">Sair</ion-button>
    </ion-content>
  `,
})
export class PerfilPage {
  readonly auth = inject(AuthService);
}
