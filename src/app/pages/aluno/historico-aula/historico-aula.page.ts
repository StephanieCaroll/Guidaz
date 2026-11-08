import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, ellipsisVertical, personOutline,
  star, starOutline
} from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import {
  AulaService, AulaHistoricoApi, ResumoHoras
} from '../../../core/services/aula.service';

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
  // TODO: trocar pelo id do aluno logado quando o login estiver pronto
  private readonly alunoId = 1;

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

  // Categoria ainda não vem do back (fica fixa por enquanto)
  readonly categoria = 'B';

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

  constructor(private router: Router, private aulaService: AulaService) {
    addIcons({
      searchOutline, calendarOutline, ellipsisVertical, personOutline,
      star, starOutline
    });
  }

  // Roda toda vez que a tela abre (mantém os dados atualizados)
  ionViewWillEnter(): void {
    this.carregar();
  }

  private carregar(): void {
    this.erro.set('');

    this.aulaService.resumoHoras(this.alunoId).subscribe({
      next: r => this.resumo.set(r),
      error: () => this.erro.set('Não foi possível carregar o progresso.')
    });

    this.aulaService.historicoAluno(this.alunoId).subscribe({
      next: lista => this.aulas.set(lista.map(a => this.converter(a))),
      error: () => this.erro.set('Não foi possível carregar as aulas.')
    });
  }

  // Converte o formato do back para o formato que a tela já usava
  private converter(a: AulaHistoricoApi): AulaHistorico {
    return {
      id: a.id,
      data: a.dataHora.substring(0, 10), // "2023-09-18T09:00:00" -> "2023-09-18"
      titulo: a.titulo,
      instrutor: a.nomeOutraPessoa,
      status: a.status.toLowerCase() as StatusAula,
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
    if (aula.status !== 'concluida' ) { return; } // só 1 vez

    this.aulaService.avaliar(aula.id, {
      usuarioId: this.alunoId,
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
    // TODO: confira se essa rota existe no app.routes.ts
    void this.router.navigateByUrl('/aluno/historico-aula');
  }

  trackAula(_: number, a: AulaHistorico): number {
    return a.id;
  }
}