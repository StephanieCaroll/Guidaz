import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, calendarOutline, statsChartOutline, personOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

export type AbaNav = 'inicio' | 'agenda' | 'historico' | 'perfil';

interface ItemNav {
  id: AbaNav;
  chaveLabel: string;
  icone: string;
  rota: string;
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class BottomNavComponent {
  @Input() activeTab: AbaNav = 'inicio';

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly settingsService = inject(SettingsService);

  /** Os itens mudam conforme o perfil logado (instrutor ou aluno) */
  readonly itens = computed<ItemNav[]>(() => {
    const instrutor = this.authService.usuario()?.perfil === 'instrutor';

    return [
      {
        id: 'inicio',
        chaveLabel: 'navInicio',
        icone: 'home-outline',
        rota: instrutor ? '/instrutor/home' : '/aluno/home'
      },
      {
        id: 'agenda',
        chaveLabel: 'navAgenda',
        icone: 'calendar-outline',
        rota: instrutor ? '/instrutor/agenda-disponibilidade' : '/aluno/agendamento-aulas'
      },
      {
        id: 'historico',
        chaveLabel: 'navHistorico',
        icone: 'stats-chart-outline',
        rota: instrutor ? '/instrutor/progresso-instrutor' : '/aluno/historico-aula'
      },
      {
        id: 'perfil',
        chaveLabel: 'navPerfil',
        icone: 'person-outline',
        rota: '/perfil'
      }
    ];
  });

  constructor() {
    addIcons({ homeOutline, calendarOutline, statsChartOutline, personOutline });
  }

  navegar(item: ItemNav): void {
    if (this.router.url === item.rota) return;
    void this.router.navigateByUrl(item.rota);
  }

  trackItem(_: number, item: ItemNav): string {
    return item.id;
  }
}