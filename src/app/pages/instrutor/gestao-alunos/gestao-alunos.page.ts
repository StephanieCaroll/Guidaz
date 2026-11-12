import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonAvatar, IonButton, IonSearchbar, IonIcon,
  ActionSheetController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, funnelOutline } from 'ionicons/icons';

@Component({
  selector: 'app-gestao-alunos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonAvatar, IonButton, IonSearchbar, IonIcon
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" style="--background: #2563eb; padding: 12px 16px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <button type="button" routerLink="/instrutor/home" style="background: rgba(255, 255, 255, 0.2); border: none; border-radius: 50%; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
            <ion-icon name="arrow-back-outline" style="font-size: 20px;"></ion-icon>
          </button>
          <div style="display: flex; flex-direction: column;">
            <h1 style="margin: 0; font-size: 1.4rem; font-weight: 700; color: white; line-height: 1.2;">Alunos</h1>
            <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.85);">Gerenciamento de alunos e turmas</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: white; border-radius: 12px; display: flex; align-items: center; height: 44px; padding: 0 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <ion-searchbar 
              placeholder="Pesquisar por nome ou categoria" 
              (ionInput)="filtrarAlunos($event)"
              style="--box-shadow: none; --background: transparent; padding: 0; height: 40px; font-size: 0.9rem;">
            </ion-searchbar>
          </div>
          <!-- Botão de Filtro Clicável -->
          <div (click)="abrirFiltros()" style="background: white; border-radius: 50%; width: 44px; height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <ion-icon name="funnel-outline" color="primary" style="font-size: 18px;"></ion-icon>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content style="--background: #f4f6f9;" class="ion-padding">
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 600px; margin: 0 auto; padding-top: 8px;">
        
        <div *ngFor="let aluno of alunosFiltrados" style="background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
          
          <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
            <ion-avatar style="width: 48px; height: 48px; min-width: 48px;">
              <img src="https://ionicframework.com/docs/img/demos/avatar.ionic.png" alt="Avatar" />
            </ion-avatar>

            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 2px;">
                {{ aluno.nome }}
              </div>
              
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #64748b; margin-bottom: 2px;">
                <span [style.background]="aluno.statusCor" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                <span>{{ aluno.status }}</span>
              </div>

              <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">
                Categoria: {{ aluno.categoria }}
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex: 1; background: #e2e8f0; height: 6px; border-radius: 4px; overflow: hidden; max-width: 180px;">
                  <div [style.width]="aluno.progressoPorcentagem + '%'" style="background: #22c55e; height: 100%; border-radius: 4px;"></div>
                </div>
                <span style="color: #94a3b8; font-weight: 500; font-size: 11px;">{{ aluno.progressoAtual }}/10</span>
              </div>
            </div>
          </div>

          <div style="margin-left: 8px;">
            <ion-button 
              mode="ios" 
              shape="round" 
              color="primary" 
              size="small" 
              (click)="agendarAula(aluno)" 
              style="font-size: 0.75rem; font-weight: 600; text-transform: none; height: 32px; padding: 0 8px;">
              Agendar aula
            </ion-button>
          </div>

        </div>

        <div *ngIf="alunosFiltrados.length === 0" style="text-align: center; margin-top: 40px; color: #64748b;">
          <p>Nenhum aluno encontrado com este filtro.</p>
        </div>

      </div>
    </ion-content>
  `,
})
export class GestaoAlunosPage implements OnInit {
  alunos = [
    { id: 1, nome: 'José Maria', status: 'Ativo', statusCor: '#22c55e', categoria: 'A, B', progressoAtual: 4, progressoPorcentagem: 40 },
    { id: 2, nome: 'João Silva', status: 'Concluído', statusCor: '#3b82f6', categoria: 'B', progressoAtual: 10, progressoPorcentagem: 100 },
    { id: 3, nome: 'Maria Santos', status: 'Ativo', statusCor: '#22c55e', categoria: 'A', progressoAtual: 1, progressoPorcentagem: 10 },
    { id: 4, nome: 'Pedro Costa', status: 'Ativo', statusCor: '#22c55e', categoria: 'B', progressoAtual: 5, progressoPorcentagem: 50 },
    { id: 5, nome: 'Ana Oliveira', status: 'Concluído', statusCor: '#3b82f6', categoria: 'A, B', progressoAtual: 10, progressoPorcentagem: 100 },
    { id: 6, nome: 'Lucas Pereira', status: 'Inativo', statusCor: '#ef4444', categoria: 'B', progressoAtual: 2, progressoPorcentagem: 20 },
    { id: 7, nome: 'Júlia Rodrigues', status: 'Ativo', statusCor: '#22c55e', categoria: 'C', progressoAtual: 2, progressoPorcentagem: 20 },
    { id: 8, nome: 'Marcos Almeida', status: 'Concluído', statusCor: '#3b82f6', categoria: 'D', progressoAtual: 10, progressoPorcentagem: 100 }
  ];

  alunosFiltrados: any[] = [];
  filtroAtual: string = 'todos';

  constructor(private router: Router, private actionSheetController: ActionSheetController) {
    addIcons({ arrowBackOutline, funnelOutline });
  }

  ngOnInit() {
    this.alunosFiltrados = this.alunos;
  }

  ionViewWillEnter() {
    this.alunosFiltrados = this.alunos;
  }

  filtrarAlunos(event: any) {
    const termo = event.detail.value ? event.detail.value.toLowerCase() : '';
    if (!termo) {
      this.aplicarFiltroPorStatus(this.filtroAtual);
      return;
    }
    this.alunosFiltrados = this.alunos.filter(a => 
      (a.nome?.toLowerCase().includes(termo) || a.categoria?.toLowerCase().includes(termo)) &&
      (this.filtroAtual === 'todos' || a.status.toLowerCase() === this.filtroAtual)
    );
  }

  async abrirFiltros() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Filtrar Alunos',
      buttons: [
        {
          text: 'Mostrar Todos',
          handler: () => {
            this.filtroAtual = 'todos';
            this.alunosFiltrados = this.alunos;
          }
        },
        {
          text: 'Apenas Ativos',
          handler: () => {
            this.filtroAtual = 'ativo';
            this.alunosFiltrados = this.alunos.filter(a => a.status === 'Ativo');
          }
        },
        {
          text: 'Apenas Concluídos',
          handler: () => {
            this.filtroAtual = 'concluído';
            this.alunosFiltrados = this.alunos.filter(a => a.status === 'Concluído');
          }
        },
        {
          text: 'Apenas Inativos',
          handler: () => {
            this.filtroAtual = 'inativo';
            this.alunosFiltrados = this.alunos.filter(a => a.status === 'Inativo');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  aplicarFiltroPorStatus(status: string) {
    if (status === 'todos') {
      this.alunosFiltrados = this.alunos;
    } else {
      this.alunosFiltrados = this.alunos.filter(a => a.status.toLowerCase() === status);
    }
  }

  agendarAula(aluno: any) {
    this.router.navigate(['/instrutor/agenda-disponibilidade'], { 
      queryParams: { 
        alunoId: aluno.id, 
        alunoNome: aluno.nome,
        alunoCategoria: aluno.categoria 
      } 
    });
  }
}