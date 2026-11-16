import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, ellipsisVertical, personOutline,
  star, starOutline
} from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import {
  AulaService, AulaHistoricoApi, ResumoHoras
} from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';

type StatusAula = 'agendada' | 'concluida' | 'cancelada' | 'falta';
type FiltroStatus = 'todas' | StatusAula;

interface AulaHistorico {
  id: number;
  data: string;       // ISO: 2026-09-10
  titulo: string;
  instrutor: string;
  status: StatusAula;
  minhaNota: number | null;
}

const STATUS_LABEL: Record<StatusAula, string> = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  falta: 'Falta'
};

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-historico-aula',
  templateUrl: './historico-aula.page.html',
  styleUrls: ['./historico-aula.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, BottomNavComponent]
})
export class HistoricoAulaPage {
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

  readonly estrelas = [1, 2, 3, 4, 5];

  categoria = 'B';

  // Card azul: vem de GET /horas/aluno/{id}
  readonly resumo = signal<ResumoHoras>({
    horasContratadas: 0,
    horasRealizadas: 0,
    horasPendentes: 0,
    percentualConcluido: 0
  });

  // Lista: vem de GET /aulas/aluno/{id}
  readonly aulas = signal<AulaHistorico[]>([]);

  readonly aulasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const f = this.filtro();
    return this.aulas().filter(a =>
      (f === 'todas' || a.status === f) &&
      (!termo || a.titulo.toLowerCase().includes(termo) || a.instrutor.toLowerCase().includes(termo))
    );
  });

  constructor() {
    addIcons({
      searchOutline, calendarOutline, ellipsisVertical, personOutline,
      star, starOutline
    });
  }

  private get alunoId(): number {
    return Number(this.auth.usuario()?.id) || 0;
  }

  // Roda toda vez que a tela abre (mantém os dados atualizados)
  ionViewWillEnter(): void {
    const u: any = this.auth.usuario();
    if (u?.categoriaPretendida) {
      this.categoria = u.categoriaPretendida;
    }
    this.carregar();
  }

  private carregar(): void {
    const id = this.alunoId;
    if (!Number.isInteger(id) || id <= 0) {
      this.erro.set('Usuário não identificado. Faça login novamente.');
      return;
    }

    this.erro.set('');

    this.aulaService.resumoHoras(id).subscribe({
      next: r => {
        this.resumo.set(r);
        if (r.categoriaPrincipal) {
          this.categoria = r.categoriaPrincipal.replace(/Categoria\s*/i, '').trim() || 'B';
        }
        this.cdr.detectChanges();
      },
      error: () => this.erro.set('Não foi possível carregar o progresso.')
    });

    this.aulaService.historicoAluno(id).subscribe({
      next: lista => {
        this.aulas.set((lista || []).map(a => this.converter(a)));
        this.cdr.detectChanges();
      },
      error: () => this.erro.set('Não foi possível carregar as aulas.')
    });
  }

  // Converte o formato do back para o formato que a tela já usava
  private converter(a: AulaHistoricoApi): AulaHistorico {
    const rawStatus = (a.status || 'AGENDADA').toUpperCase();
    let status: StatusAula = 'agendada';
    if (rawStatus === 'CONCLUIDA') status = 'concluida';
    else if (rawStatus === 'CANCELADA') status = 'cancelada';
    else if (rawStatus === 'FALTA' || rawStatus === 'FALTA_ALUNO') status = 'falta';

    const iso = a.dataAula || (a.dataHora ? a.dataHora.substring(0, 10) : '2026-01-01');

    return {
      id: a.id,
      data: iso,
      titulo: a.titulo,
      instrutor: a.instrutorNome || a.nomeOutraPessoa || 'Instrutor',
      status,
      minhaNota: a.minhaNota
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

  avaliar(aula: AulaHistorico, nota: number, ev: Event): void {
    ev.stopPropagation(); // não abre o detalhe do card
    if (aula.status !== 'concluida') { return; }

    const id = this.alunoId;
    if (!Number.isInteger(id) || id <= 0) return;

    this.aulaService.avaliar(aula.id, {
      usuarioId: id,
      tipoAvaliador: 'ALUNO',
      nota
    }).subscribe({
      next: () => this.aulas.update(lista =>
        lista.map(a => a.id === aula.id ? { ...a, minhaNota: nota } : a)
      ),
      error: () => this.erro.set('Não foi possível enviar a avaliação.')
    });
  }

  abrirDetalhe(aula: AulaHistorico): void {
    void this.router.navigate(['/aluno/detalhe-aula'], {
      queryParams: { id: aula.id }
    });
  }

  trackAula(_: number, a: AulaHistorico): number {
    return a.id;
  }
}