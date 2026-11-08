import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AulaHistorico, StatusAula } from '../../models/aula.model';

@Component({
  selector: 'app-historico-aulas',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: ` 
    <h2 class="titulo">Histórico de Aulas</h2>

    <div class="busca">
      <div class="campo">
        <ion-icon name="search-outline"></ion-icon>
        <input type="text" placeholder="Pesquisar por nome ou categoria"
               [(ngModel)]="termo" />
      </div>
      <button type="button" class="filtro" (click)="filtrar.emit()" aria-label="Filtrar">
        <ion-icon name="funnel-outline"></ion-icon>
      </button>
    </div>

    <article class="item" *ngFor="let aula of aulasFiltradas">
      <span class="data">
        <ion-icon name="calendar-outline"></ion-icon>
        {{ formatarData(aula.data) }}
      </span>
      <button type="button" class="mais" (click)="opcoes.emit(aula)" aria-label="Mais opções">
        <ion-icon name="ellipsis-vertical"></ion-icon>
      </button>
      <strong>{{ aula.titulo }}</strong>
      <small>{{ aula.pessoa }}</small>
      <span class="status">
        <i [ngClass]="aula.status"></i>{{ rotulo(aula.status) }}
      </span>
    </article>

    <p class="vazio" *ngIf="!aulasFiltradas.length">Nenhuma aula encontrada.</p>
  `,
  styles: [`
    :host { display: block; }
    .titulo { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #111; }
    .busca { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .campo {
      flex: 1; display: flex; align-items: center; gap: 8px;
      border: 1px solid #8a8f98; border-radius: 10px; padding: 8px 10px; background: #fff;
    }
    .campo input { border: 0; outline: 0; width: 100%; font-size: 13px; background: transparent; }
    .filtro, .mais { background: none; border: 0; color: inherit; }
    .filtro ion-icon { font-size: 22px; color: #444; }
    .item {
      position: relative; display: block; background: #f6f6fb; border-radius: 16px;
      padding: 12px 14px; margin-bottom: 12px; box-shadow: 0 3px 8px rgba(30,40,80,.14);
    }
    .item strong { display: block; margin-top: 8px; font-size: 14px; font-weight: 600; }
    .item small { display: block; color: #666; margin: 2px 0 6px; font-size: 12px; }
    .data {
      display: inline-flex; align-items: center; gap: 4px; background: #1a5cff; color: #fff;
      font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 10px;
    }
    .mais {
      position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-radius: 50%;
      background: #1a5cff; color: #fff; display: grid; place-items: center; font-size: 12px; padding: 0;
    }
    .status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }
    .status i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
    .status i.agendada  { background: #1a5cff; }
    .status i.concluida { background: #52d11a; }
    .status i.falta     { background: #e5252a; }
    .status i.cancelada { background: #f5a623; }
    .vazio { text-align: center; color: #777; font-size: 13px; }
  `]
})
export class HistoricoAulasComponent {
  @Input() aulas: AulaHistorico[] = [];
  @Output() filtrar = new EventEmitter<void>();
  @Output() opcoes = new EventEmitter<AulaHistorico>();

  termo = '';
  private meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  get aulasFiltradas(): AulaHistorico[] {
    const t = this.termo.trim().toLowerCase();
    if (!t) return this.aulas;
    return this.aulas.filter(a =>
      a.titulo.toLowerCase().includes(t) || a.pessoa.toLowerCase().includes(t));
  }

  formatarData(iso: string): string {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return `${String(dia).padStart(2, '0')} ${this.meses[mes - 1]} ${ano}`;
  }

  rotulo(s: StatusAula): string {
    return { agendada: 'Agendada', concluida: 'Concluída', falta: 'Falta', cancelada: 'Cancelada' }[s];
  }
}
