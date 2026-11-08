import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, bookmarkOutline, bookmark, star, timeOutline,
  pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
  calendarOutline, personOutline
} from 'ionicons/icons';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

interface DetalheAula {
  tipo: string;
  titulo: string;
  disponivel: boolean;
  nota: number;
  avaliacoes: number;
  categoria: string;
  duracaoMin: number;
  valor: number;
  instrutor: { nome: string; funcao: string; foto?: string };
  descricao: string;
  inclusos: string[];
}

@Component({
  selector: 'app-detalhe-aula',
  templateUrl: './detalhe-aula.page.html',
  styleUrls: ['./detalhe-aula.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, BottomNavComponent]
})
export class DetalheAulaPage {
  readonly favorito = signal(false);

  // TODO: trocar pelos dados reais (API / parâmetro da rota)
  readonly aula: DetalheAula = {
    tipo: 'Aula Prática',
    titulo: 'Aula Prática - Categoria B',
    disponivel: true,
    nota: 4.9,
    avaliacoes: 32,
    categoria: 'B',
    duracaoMin: 50,
    valor: 120,
    instrutor: { nome: 'Paula Fernandez', funcao: 'Instrutor de Direção' },
    descricao: 'Instrutor autônomo com 6 anos de experiência, aulas práticas e atendimento personalizado',
    inclusos: [
      'Veículo adequado e revisado',
      'Acompanhamento do instrutor',
      'Orientações personalizadas',
      'Suporte para dúvidas após a aula'
    ]
  };

  constructor(private router: Router, private location: Location) {
    addIcons({
      arrowBackOutline, bookmarkOutline, bookmark, star, timeOutline,
      pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
      calendarOutline, personOutline
    });
  }

  voltar(): void {
    this.location.back();
  }

  alternarFavorito(): void {
    this.favorito.update(v => !v);
  }

  verPerfil(): void {
    // TODO: ajuste para a rota real do perfil do instrutor
    void this.router.navigateByUrl('/aluno/perfil-instrutor');
  }

  agendar(): void {
    void this.router.navigateByUrl('/aluno/agendamento-aulas');
  }
}