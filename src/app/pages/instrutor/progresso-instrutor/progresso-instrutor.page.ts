import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, ellipsisVertical,
  peopleOutline, starOutline, personOutline, chevronForward, arrowUndo } from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

type StatusAula = 'agendada' | 'concluida' | 'cancelada' | 'falta';

interface AulaHistorico {
  id: number;
  data: string;    
  titulo: string;
  aluno: string;
  status: StatusAula;
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
  readonly busca = signal('');

  // TODO: trocar pelos dados reais da API
  readonly resumo = { total: 41, realizadas: 35, canceladas: 4, faltas: 3, alunosAtivos: 18 };

  readonly aulas = signal<AulaHistorico[]>([
    { id: 1, data: '2026-09-10', titulo: 'Aula Prática - Categoria B', aluno: 'Paula Fernandez', status: 'agendada' },
    { id: 2, data: '2023-09-18', titulo: 'Baliza e Estacionamento', aluno: 'Paula Fernandez', status: 'concluida' },
    { id: 3, data: '2021-12-10', titulo: 'Direção Urbana', aluno: 'Carlos Henrique', status: 'falta' }
  ]);

  readonly aulasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.aulas();
    return this.aulas().filter(a =>
      a.titulo.toLowerCase().includes(termo) ||
      a.aluno.toLowerCase().includes(termo)
    );
  });

  constructor(private router: Router) {
    addIcons({arrowUndo,peopleOutline,chevronForward,starOutline,searchOutline,calendarOutline,ellipsisVertical,personOutline});
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

  irPara(rota: string): void {
    void this.router.navigateByUrl(rota);
  }

  trackAula(_: number, a: AulaHistorico): number {
    return a.id;
  }
}