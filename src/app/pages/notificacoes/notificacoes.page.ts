import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  closeOutline,
  calendarOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

interface Notificacao {
  id: number;
  tipo: 'cancelada' | 'agendada' | 'pagamento';
  titulo: string;
  descricao: string;
}

interface GrupoNotificacao {
  titulo: string;
  itens: Notificacao[];
}

@Component({
  selector: 'app-notificacoes',
  templateUrl: './notificacoes.page.html',
  styleUrls: ['./notificacoes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]
})
export class NotificacoesPage implements OnInit {

  grupos: GrupoNotificacao[] = [
    {
      titulo: 'HOJE',
      itens: [
        {
          id: 1,
          tipo: 'cancelada',
          titulo: 'Aula Cancelada',
          descricao: 'A aula de sexta-feira foi cancelada pelo instrutor'
        }
      ]
    },
    {
      titulo: 'ESTA SEMANA',
      itens: [
        {
          id: 2,
          tipo: 'agendada',
          titulo: 'Aula agendada para amanhã',
          descricao: 'Você tem uma aula marcada para amanhã, às 9:00h.'
        },
        {
          id: 3,
          tipo: 'pagamento',
          titulo: 'Pagamento confirmado',
          descricao: 'Recebemos o seu pagamento referente à Agosto.'
        }
      ]
    },
    {
      titulo: 'ANTERIORES',
      itens: [
        {
          id: 4,
          tipo: 'agendada',
          titulo: 'A sua aula começa em breve!',
          descricao: 'A aula com Paula começa às 14h. Prepare-se!'
        },
        {
          id: 5,
          tipo: 'cancelada',
          titulo: 'Aula Cancelada',
          descricao: 'A aula de sábado foi cancelada pelo instrutor'
        }
      ]
    }
  ];

  constructor(private location: Location) {
    addIcons({
      arrowBackOutline,
      closeOutline,
      calendarOutline,
      checkmarkOutline
    });
  }

  ngOnInit() {}

  voltar() {
    this.location.back();
  }
}