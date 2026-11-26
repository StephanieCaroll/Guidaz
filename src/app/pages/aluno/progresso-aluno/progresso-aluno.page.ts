import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { BottomNavComponent } from '../../../core/components/bottom-nav/bottom-nav.component';
import { HistoricoAulasComponent } from '../../../core/components/historico-aulas/historico-aulas.component';
import { AulaHistorico } from '../../../core/models/aula.model';

@Component({
  selector: 'app-progresso-aluno',
  templateUrl: './progresso-aluno.page.html',
  styleUrls: ['./progresso-aluno.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BottomNavComponent, HistoricoAulasComponent],
})
export class ProgressoAlunoPage {
  categoria = 'B';
  contratadas = 10;
  realizadas = 6;

  // TODO: trocar por dados da API
  aulas: AulaHistorico[] = [
    { id: 1, data: '2026-09-10', titulo: 'Aula Prática - Categoria B', pessoa: 'Paula Fernandez', status: 'agendada' },
    { id: 2, data: '2023-09-18', titulo: 'Baliza e Estacionamento',    pessoa: 'Paula Fernandez', status: 'concluida' },
    { id: 3, data: '2021-12-10', titulo: 'Direção Urbana',             pessoa: 'Carlos Henrique', status: 'falta' },
  ];

  constructor(private nav: NavController) {}

  get restantes(): number { return Math.max(this.contratadas - this.realizadas, 0); }
  get percentual(): number {
    return this.contratadas ? Math.round((this.realizadas / this.contratadas) * 100) : 0;
  }

  voltar() { this.nav.back(); }
  abrirFiltro() { /* TODO: abrir modal de filtro */ }
  abrirOpcoes(aula: AulaHistorico) { /* TODO: action sheet com opções da aula */ }
}
