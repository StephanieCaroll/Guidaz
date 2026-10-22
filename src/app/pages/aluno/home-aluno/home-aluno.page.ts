import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-aluno',
  imports: [IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Início</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item [routerLink]="['/aluno/agendamento-aulas']" detail="true"><ion-label>Agendar aulas</ion-label></ion-item>
        <ion-item [routerLink]="['/aluno/pacotes']" detail="true"><ion-label>Pacotes de aulas</ion-label></ion-item>
        <ion-item [routerLink]="['/aluno/saldo-aulas']" detail="true"><ion-label>Saldo de aulas</ion-label></ion-item>
        <ion-item [routerLink]="['/aluno/historico-avaliacoes']" detail="true"><ion-label>Histórico e avaliações</ion-label></ion-item>
        <ion-item [routerLink]="['/perfil']" detail="true"><ion-label>Meu perfil</ion-label></ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class HomeAlunoPage {}
