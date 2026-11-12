import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, 
  IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonAvatar, IonChip, IonLabel, IonButton, IonSearchbar, ToastController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-gestao-alunos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonAvatar, IonChip, IonLabel, IonButton, IonSearchbar
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/instrutor/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Gestão de Alunos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div style="margin-bottom: 16px;">
        <ion-searchbar 
          placeholder="Pesquisar por nome ou CPF..." 
          (ionInput)="filtrarAlunos($event)">
        </ion-searchbar>
      </div>

      <ion-list lines="none" *ngIf="alunosFiltrados.length > 0">
        <ion-card *ngFor="let aluno of alunosFiltrados" style="margin: 0 0 16px 0; border-radius: 12px;">
          <ion-card-header>
            <div style="display: flex; align-items: center; gap: 12px;">
              <ion-avatar>
                <img [src]="aluno.fotoUrl || 'https://ionicframework.com/docs/img/demos/avatar.ionic.png'" alt="Foto do aluno" />
              </ion-avatar>
              <div>
                <ion-card-title style="font-size: 1.1rem;">{{ aluno.nome }}</ion-card-title>
                <ion-card-subtitle>CPF: {{ aluno.cpf }}</ion-card-subtitle>
              </div>
            </div>
          </ion-card-header>

          <ion-card-content>
            <p><strong>Email:</strong> {{ aluno.email }}</p>
            <p><strong>Telefone:</strong> {{ aluno.telefone }}</p>
            
            <div style="margin-top: 10px;">
              <ion-chip color="success" *ngIf="aluno.pacote">
                <ion-label>{{ aluno.pacote }}</ion-label>
              </ion-chip>
              <ion-chip color="warning" *ngIf="!aluno.pacote">
                <ion-label>Sem Pacote Vinculado</ion-label>
              </ion-chip>
            </div>

            <div style="margin-top: 12px;">
              <ion-button expand="block" fill="outline" color="primary" (click)="vincularPacote(aluno)">
                Vincular Pacote
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-list>

      <div *ngIf="alunosFiltrados.length === 0" style="text-align: center; margin-top: 40px; color: #666;">
        <p>Nenhum aluno encontrado.</p>
      </div>
    </ion-content>
  `,
})
export class GestaoAlunosPage implements OnInit {
  alunos: any[] = [
    { id: 1, nome: 'Mariana Alves', cpf: '123.456.789-00', email: 'mariana.alves@email.com', telefone: '(81) 98888-1111', pacote: 'Categoria B - 10 Aulas' },
    { id: 2, nome: 'Lucas Lima', cpf: '987.654.321-11', email: 'lucas.lima@email.com', telefone: '(81) 97777-2222', pacote: null },
    { id: 3, nome: 'Beatriz Santos', cpf: '456.789.123-22', email: 'beatriz.santos@email.com', telefone: '(81) 99999-3333', pacote: 'Categoria A - 5 Aulas' },
    { id: 4, nome: 'Carlos Eduardo', cpf: '321.654.987-33', email: 'carlos.eduardo@email.com', telefone: '(81) 98111-4444', pacote: null }
  ];
  
  alunosFiltrados: any[] = [];

  constructor(private toastCtrl: ToastController) {}

  ngOnInit() {
    this.alunosFiltrados = this.alunos;
  }

  ionViewWillEnter() {
    this.alunosFiltrados = this.alunos;
  }

  filtrarAlunos(event: any) {
    const termo = event.detail.value ? event.detail.value.toLowerCase() : '';
    if (!termo) {
      this.alunosFiltrados = this.alunos;
      return;
    }
    this.alunosFiltrados = this.alunos.filter(a => 
      a.nome?.toLowerCase().includes(termo) || a.cpf?.includes(termo)
    );
  }

  async vincularPacote(aluno: any) {
    aluno.pacote = 'Pacote Categoria B (Vinculado)';
    const toast = await this.toastCtrl.create({
      message: `Pacote vinculado a ${aluno.nome} com sucesso!`,
      duration: 2500,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }
}