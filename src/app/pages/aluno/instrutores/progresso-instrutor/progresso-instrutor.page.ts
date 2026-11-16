import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, ellipsisVertical, personOutline,
  star, checkmarkCircleOutline
} from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import {
  AulaService, AulaHistoricoApi, ResumoInstrutor
} from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';

type StatusAula = 'agendada' | 'concluida' | 'cancelada' | 'falta';
type FiltroStatus = 'todas' | StatusAula;

interface AulaInstrutorHistorico {
  id: number;
  data: string;
  titulo: string;
  aluno: string;
  status: StatusAula;
  notaRecebida: number | null;
}

const STATUS_LABEL: Record<StatusAula, string> = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  falta: 'Falta'
};

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-progresso-instrutor',
  templateUrl: './progresso-instrutor.page.html',
  styleUrls: ['./progresso-instrutor.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, BottomNavComponent]
})
export class ProgressoInstrutorPage {
  private readonly router = inject(Router);
  private readonly aulaService = inject(AulaService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly busca = signal('');
  readonly filtro = signal<FiltroStatus>('todas');
  readonly erro = signal('');

  readonly filtros: { id: FiltroStatus; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'agendada', label: 'Agendadas' },
    { id: 'concluida', label: 'Concluídas' },
    { id: 'cancelada', label: 'Canceladas' }
  ];

  readonly resumo = signal<ResumoInstrutor>({
    totalAulas: 0,
    realizadas: 0,
    canceladas: 0,
    faltas: 0,
    agendadas: 0,
    horasRealizadas: 0,
    horasPendentes: 0,
    mediaAvaliacoes: 5.0,
    totalAlunos: 0,
    pedidosPendentes: 0
  });

  readonly aulas = signal<AulaInstrutorHistorico[]>([]);

  readonly aulasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const f = this.filtro();
    return this.aulas().filter(a =>
      (f === 'todas' || a.status === f) &&
      (!termo || a.titulo.toLowerCase().includes(termo) || a.aluno.toLowerCase().includes(termo))
    );
  });

  readonly percentualConclusao = computed(() => {
    const r = this.resumo();
    const total = (r.realizadas || 0) + (r.agendadas || 0);
    if (!total) return 0;
    return Math.min(100, Math.round(((r.realizadas || 0) / total) * 100));
  });

  constructor() {
    addIcons({
      searchOutline, calendarOutline, ellipsisVertical, personOutline,
      star, checkmarkCircleOutline
    });
  }

  private get instrutorId(): number {
    return Number(this.auth.usuario()?.id) || 0;
  }

  ionViewWillEnter(): void {
    this.carregar();
  }

  private carregar(): void {
    const id = this.instrutorId;
    if (!Number.isInteger(id) || id <= 0) {
      this.erro.set('Instrutor não identificado. Faça login novamente.');
      return;
    }

    this.erro.set('');

    this.aulaService.resumoInstrutor(id).subscribe({
      next: r => {
        this.resumo.set(r);
        this.cdr.detectChanges();
      },
      error: () => this.erro.set('Não foi possível carregar o resumo de progresso.')
    });

    this.aulaService.historicoInstrutor(id).subscribe({
      next: lista => {
        this.aulas.set((lista || []).map(a => this.converter(a)));
        this.cdr.detectChanges();
      },
      error: () => this.erro.set('Não foi possível carregar o histórico de aulas.')
    });
  }

  private converter(a: AulaHistoricoApi): AulaInstrutorHistorico {
    const rawStatus = (a.status || 'AGENDADA').toUpperCase();
    let status: StatusAula = 'agendada';
    if (rawStatus === 'CONCLUIDA') status = 'concluida';
    else if (rawStatus === 'CANCELADA') status = 'cancelada';
    else if (rawStatus === 'FALTA' || rawStatus === 'FALTA_ALUNO') status = 'falta';

    const iso = a.dataAula || (a.dataHora ? a.dataHora.substring(0, 10) : '2026-01-01');
    const hora = a.horaInicio ? a.horaInicio.slice(0, 5) : '';

    return {
      id: a.id,
      data: iso,
      titulo: hora ? `${a.titulo} (${hora})` : a.titulo,
      aluno: a.alunoNome || a.nomeOutraPessoa || 'Aluno',
      status,
      notaRecebida: a.minhaNota
    };
  }

  onBusca(ev: Event): void {
    this.busca.set((ev.target as HTMLInputElement).value ?? '');
  }

  formatarData(iso: string): string {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return `${dia} ${MESES[mes - 1]} ${ano}`;
  }

  labelStatus(s: StatusAula): string {
    return STATUS_LABEL[s];
  }

  abrirDetalhe(aula: AulaInstrutorHistorico): void {
    void this.router.navigate(['/instrutor/detalhe-aula'], {
      queryParams: { id: aula.id }
    });
  }

  trackAula(_: number, a: AulaInstrutorHistorico): number {
    return a.id;
  }
}