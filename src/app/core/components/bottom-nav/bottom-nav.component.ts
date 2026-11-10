import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface ItemNav { label: string; icone: string; rota: string; }

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a *ngFor="let item of itens" [routerLink]="item.rota" routerLinkActive="ativo">
        <ion-icon [name]="item.icone"></ion-icon>
        <span>{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex; justify-content: space-around; align-items: center;
      background: #1a5cff; padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
    }
    a {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      color: rgba(255,255,255,.75); text-decoration: none;
      font-size: 10px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase;
      min-width: 64px;
    }
    a ion-icon { font-size: 22px; }
    a.ativo { color: #fff; }
  `]
})
export class BottomNavComponent {
  /** Troque as rotas abaixo pelas rotas reais do seu app-routing */
  @Input() perfil: 'aluno' | 'instrutor' = 'aluno';

  get itens(): ItemNav[] {
  return this.perfil === 'aluno'
    ? [
        { label: 'Início',    icone: 'home-outline',     rota: '/aluno/home' },
        { label: 'Agenda',    icone: 'calendar-outline', rota: '/aluno/instrutores' },
        { label: 'Historico', icone: 'trending-up',      rota: '/aluno/historico-aula' },
        { label: 'Perfil',    icone: 'person-outline',   rota: '/perfil' },
      ]
    : [
        { label: 'Início',    icone: 'home-outline',     rota: '/instrutor/home' },
        { label: 'Agenda',    icone: 'calendar-outline', rota: '/instrutor/agenda-disponibilidade' },
        { label: 'Historico', icone: 'trending-up',      rota: '/instrutor/progresso-instrutor' },
        { label: 'Perfil',    icone: 'person-outline',   rota: '/perfil' },
      ];
}
}
