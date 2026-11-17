import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ActionSheetController,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  funnelOutline,
  searchOutline,
  closeCircle,
  calendarOutline,
  listOutline,
  logoWhatsapp,
  addCircleOutline,
  peopleOutline,
  closeOutline
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
import { ToastService } from '../../../core/services/toast.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

export interface AlunoInstrutor {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  fotoUrl?: string;
  fotoResolvida?: string;
  categoria: string;
  status: 'Ativo' | 'Concluído' | 'Pendente' | 'Inativo';
  aulasConcluidas: number;
  aulasAgendadas: number;
  aulasContratadas: number;
  aulasRestantes: number;
  progressoPercentual: number;
  proximaAula: string | null;
}

@Component({
  selector: 'app-gestao-alunos',
  templateUrl: './gestao-alunos.page.html',
  styleUrls: ['./gestao-alunos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonSpinner,
    IonToolbar,
    BottomNavComponent
  ]
})
export class GestaoAlunosPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = environment.apiUrl;

  alunos: AlunoInstrutor[] = [];
  alunosFiltrados: AlunoInstrutor[] = [];
  todasAulasInstrutor: AulaHistoricoApi[] = [];

  termoBusca = '';
  filtroStatus = 'todos';
  carregando = false;
  erro = '';

  modalAulasAberto = false;
  alunoSelecionado: AlunoInstrutor | null = null;
  aulasDoAlunoSelecionado: AulaHistoricoApi[] = [];

  constructor() {
    console.log('[GESTAO] constructor executou');
    addIcons({
      arrowBackOutline,
      funnelOutline,
      searchOutline,
      closeCircle,
      calendarOutline,
      listOutline,
      logoWhatsapp,
      addCircleOutline,
      peopleOutline,
      closeOutline
    });
  }

  // Dispara toda vez que a página entra em tela (a primeira vez inclusive)
  ionViewWillEnter(): void {
    console.log('[GESTAO] ionViewWillEnter');
    this.carregarAlunos();
  }

  get totalAtivos(): number {
    return this.alunos.filter(a => a.status === 'Ativo').length;
  }

  get totalConcluidos(): number {
    return this.alunos.filter(a => a.status === 'Concluído').length;
  }

  carregarAlunos(): void {
    const instrutorId = Number(this.auth.usuario()?.id);
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) {
      this.erro = 'Instrutor não identificado. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.http.get<AlunoInstrutor[]>(`${this.apiUrl}/instrutores/${instrutorId}/alunos`).subscribe({
      next: (lista) => {
        this.alunos = (lista || []).map(a => ({
          ...a,
          fotoResolvida: this.resolverFoto(a.fotoUrl)
        }));
        this.aplicarFiltros();
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar alunos do instrutor:', err);
        this.carregando = false;
        this.erro = 'Não foi possível carregar seus alunos.';
        this.cdr.detectChanges();
      }
    });

    // Pré-carrega o histórico de aulas para abrir instantaneamente ao clicar em "Aulas"
    this.aulaService.historicoInstrutor(instrutorId).subscribe({
      next: (aulas) => {
        this.todasAulasInstrutor = aulas || [];
      },
      error: () => {}
    });
  }

  private resolverFoto(raw?: string): string | undefined {
    if (!raw) return undefined;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
  }

  iniciais(nome: string): string {
    if (!nome) return 'A';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  normalizarClasseStatus(status: string): string {
    return status
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  selecionarFiltro(status: string): void {
    this.filtroStatus = status;
    this.aplicarFiltros();
  }

  limparBusca(): void {
    this.termoBusca = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const termo = this.termoBusca.trim().toLowerCase();
    this.alunosFiltrados = this.alunos.filter(a => {
      const bateTermo =
        !termo ||
        a.nome?.toLowerCase().includes(termo) ||
        a.categoria?.toLowerCase().includes(termo);
      const bateStatus =
        this.filtroStatus === 'todos' ||
        a.status.toLowerCase() === this.filtroStatus;
      return bateTermo && bateStatus;
    });
  }

  async abrirFiltros(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Filtrar Meus Alunos',
      buttons: [
        {
          text: `Todos (${this.alunos.length})`,
          handler: () => this.selecionarFiltro('todos')
        },
        {
          text: `Ativos (${this.totalAtivos})`,
          handler: () => this.selecionarFiltro('ativo')
        },
        {
          text: `Concluídos (${this.totalConcluidos})`,
          handler: () => this.selecionarFiltro('concluído')
        },
        {
          text: 'Pendentes',
          handler: () => this.selecionarFiltro('pendente')
        },
        {
          text: 'Inativos',
          handler: () => this.selecionarFiltro('inativo')
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  agendarAula(aluno: AlunoInstrutor): void {
    void this.router.navigate(['/aluno/agendamento-aulas'], {
      queryParams: {
        alunoId: aluno.id
      },
      state: {
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        alunoCategoria: aluno.categoria
      }
    });
  }

  abrirHistoricoAluno(aluno: AlunoInstrutor): void {
    this.alunoSelecionado = aluno;
    this.aulasDoAlunoSelecionado = this.todasAulasInstrutor.filter(
      a => Number(a.alunoId) === Number(aluno.id)
    );
    this.modalAulasAberto = true;
  }

  fecharModalAulas(): void {
    this.modalAulasAberto = false;
  }

  abrirDetalheAula(aulaId: number): void {
    this.modalAulasAberto = false;
    void this.router.navigate(['/instrutor/detalhe-aula'], {
      queryParams: { id: aulaId }
    });
  }

  formatarDataAula(aula: AulaHistoricoApi): string {
    const data = aula.dataAula ? aula.dataAula.split('-').reverse().join('/') : '';
    const hora = aula.horaInicio ? aula.horaInicio.slice(0, 5) : '';
    return hora ? `${data} às ${hora}` : data;
  }

  labelStatusAula(status: string): string {
    const mapa: Record<string, string> = {
      AGENDADA: 'Agendada',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
      FALTA_ALUNO: 'Falta'
    };
    return mapa[status] || status;
  }

  abrirWhatsApp(aluno: AlunoInstrutor): void {
    const digitos = (aluno.telefone || '').replace(/\D/g, '');
    if (!digitos) {
      void this.toastService.mostrar('Aluno sem telefone cadastrado.', 'erro');
      return;
    }
    const numero = digitos.startsWith('55') ? digitos : `55${digitos}`;
    const msg = encodeURIComponent(`Olá ${aluno.nome}, tudo bem? Aqui é seu instrutor do Guidaz.`);
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank');
  }

  voltar(): void {
    void this.router.navigateByUrl('/instrutor/home');
  }
}