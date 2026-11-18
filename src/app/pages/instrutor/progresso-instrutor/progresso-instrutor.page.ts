import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, ellipsisVertical,
  peopleOutline, starOutline, star, personOutline, chevronForward, arrowUndo
} from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { AuthService } from '../../../core/services/auth.service';
import {
  AulaService, AulaHistoricoApi, ResumoInstrutor
} from '../../../core/services/aula.service';
import { environment } from '../../../../environments/environment';

type StatusAula = 'agendada' | 'concluida' | 'cancelada' | 'falta';

interface AulaHistorico {
  id: number;
  data: string;
  titulo: string;
  aluno: string;
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
  selector: 'app-progresso-instrutor',
  templateUrl: './progresso-instrutor.page.html',
  styleUrls: ['./progresso-instrutor.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, BottomNavComponent]
})
export class ProgressoInstrutorPage {
  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private instrutorId = 1;

  readonly busca = signal('');
  readonly erro = signal('');
  readonly estrelas = [1, 2, 3, 4, 5];
  readonly alunosAtivos = signal(0);

  readonly resumo = signal<ResumoInstrutor>({
    totalAulas: 0, realizadas: 0, canceladas: 0, faltas: 0, agendadas: 0,
    horasRealizadas: 0, horasPendentes: 0, mediaAvaliacoes: null
  });

  readonly aulas = signal<AulaHistorico[]>([]);

  readonly aulasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.aulas();
    return this.aulas().filter(a =>
      a.titulo.toLowerCase().includes(termo) ||
      a.aluno.toLowerCase().includes(termo)
    );
  });

  readonly subtituloAvaliacoes = computed(() => {
    const m = this.resumo().mediaAvaliacoes;
    return m == null ? 'Feedbacks' : `Média ${m.toFixed(1).replace('.', ',')}`;
  });

  constructor() {
    addIcons({
      arrowUndo, peopleOutline, chevronForward, starOutline, star,
      searchOutline, calendarOutline, ellipsisVertical, personOutline
    });
  }

  ionViewWillEnter(): void {
    const u: any = this.auth.usuario();
    this.instrutorId = Number(u?.id) || 1;
    this.carregar();
  }

  private carregar(): void {
    this.erro.set('');

    this.aulaService.resumoInstrutor(this.instrutorId).subscribe({
      next: r => this.resumo.set(r),
      error: () => this.erro.set('Não foi possível carregar o resumo do mês.')
    });

    this.aulaService.historicoInstrutor(this.instrutorId).subscribe({
      next: lista => this.aulas.set((lista || []).map(a => this.converter(a))),
      error: () => this.erro.set('Não foi possível carregar as aulas.')
    });

    this.http.get<unknown[]>(`${this.apiUrl}/instrutores/${this.instrutorId}/alunos`).subscribe({
      next: (lista: unknown[]) => {
        this.alunosAtivos.set(Array.isArray(lista) ? lista.length : 0);
      },
      error: () => {}
    });
  }

  private converter(a: AulaHistoricoApi): AulaHistorico {
    return {
      id: a.id,
      data: (a.dataHora || a.dataAula || '').substring(0, 10),
      titulo: a.titulo,
      aluno: a.alunoNome || a.nomeOutraPessoa || 'Aluno',
      status: (a.status || 'AGENDADA').toLowerCase() as StatusAula,
      minhaNota: a.minhaNota
    };
  }

  onBusca(ev: Event): void {
    this.busca.set((ev.target as HTMLInputElement).value ?? '');
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-').map(Number);
    if (!ano || !mes || !dia) return iso;
    return `${dia} ${MESES[mes - 1]} ${ano}`;
  }

  labelStatus(s: StatusAula): string {
    return STATUS_LABEL[s] || s;
  }

  avaliar(aula: AulaHistorico, nota: number, ev: Event): void {
    ev.stopPropagation();
    if (aula.status !== 'concluida') { return; }

    this.aulaService.avaliar(aula.id, {
      usuarioId: this.instrutorId,
      tipoAvaliador: 'INSTRUTOR',
      nota
    }).subscribe({
      next: () => this.aulas.update(lista =>
        lista.map(a => a.id === aula.id ? { ...a, minhaNota: nota } : a)
      ),
      error: () => this.erro.set('Não foi possível enviar a avaliação.')
    });
  }

  abrirDetalhesAula(aulaId: number): void {
    void this.router.navigate(['/instrutor/detalhe-aula'], {
      queryParams: { id: aulaId }
    });
  }

  irPara(rota: string): void {
    void this.router.navigateByUrl(rota);
  }

  trackAula(_: number, a: AulaHistorico): number {
    return a.id;
  }
}