import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  homeOutline,
  layersOutline,
  personOutline,
  walletOutline,
} from 'ionicons/icons';

export interface PacoteAula {
  categoria: 'A' | 'B' | 'AB' | 'C' | 'D' | 'E';
  veiculo: string;
  aulas: number;
  preco: number;
}

@Component({
  selector: 'app-pacotes',
  templateUrl: './pacotes.page.html',
  styleUrls: ['./pacotes.page.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export class PacotesPage {
  private readonly router = inject(Router);

  readonly pacotes: PacoteAula[] = [
    { categoria: 'A', veiculo: 'Moto', aulas: 2, preco: 220 },
    { categoria: 'B', veiculo: 'Carro', aulas: 2, preco: 280 },
    { categoria: 'AB', veiculo: 'Moto e Carro', aulas: 4, preco: 500 },
    { categoria: 'C', veiculo: 'Caminhão', aulas: 10, preco: 1500 },
    { categoria: 'D', veiculo: 'Ônibus', aulas: 10, preco: 1400 },
    { categoria: 'E', veiculo: 'Carreta', aulas: 15, preco: 2510 },
  ];

  readonly pacoteSelecionado = signal<PacoteAula>(this.pacotes[1]);

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      homeOutline,
      layersOutline,
      walletOutline,
      personOutline,
    });
  }

  selecionarPacote(pacote: PacoteAula): void {
    this.pacoteSelecionado.set(pacote);
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  confirmarPacote(): void {
    const pacote = this.pacoteSelecionado();
    void this.router.navigate(['/aluno/pagamento-pix'], { state: { pacote } });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 3a2a546a9cffcaa7e40d9c0d43211f30046ac45d
