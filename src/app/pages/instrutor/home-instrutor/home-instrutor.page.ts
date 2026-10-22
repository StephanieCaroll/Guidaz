import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-instrutor',
  imports: [IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Início</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item [routerLink]="['/instrutor/agenda-disponibilidade']" detail="true"><ion-label>Agenda e disponibilidade</ion-label></ion-item>
        <ion-item [routerLink]="['/instrutor/gestao-alunos']" detail="true"><ion-label>Gestão de alunos</ion-label></ion-item>
        <ion-item [routerLink]="['/perfil']" detail="true"><ion-label>Meu perfil</ion-label></ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class HomeInstrutorPage {}
