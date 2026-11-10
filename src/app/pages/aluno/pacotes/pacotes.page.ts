import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
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
  instrutorId: number | null = null;
  instrutorNome: string | undefined;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      homeOutline,
      layersOutline,
      walletOutline,
      personOutline,
    });
    this.lerDadosNavegacao();
  }

  ionViewWillEnter(): void {
    this.lerDadosNavegacao();
  }

  private lerDadosNavegacao(): void {
    const queryId = Number(this.route.snapshot.queryParamMap.get('instrutorId'));
    const stateId = Number(history.state?.['instrutorId']);
    const idValido = Number.isInteger(queryId) && queryId > 0
      ? queryId
      : (Number.isInteger(stateId) && stateId > 0 ? stateId : null);

    this.instrutorId = idValido;

    if (typeof history.state?.['instrutorNome'] === 'string') {
      this.instrutorNome = history.state['instrutorNome'];
    }

    const pacoteAnterior = history.state?.['pacote'] as PacoteAula | undefined;
    if (pacoteAnterior?.categoria) {
      const encontrado = this.pacotes.find((p) => p.categoria === pacoteAnterior.categoria);
      if (encontrado) {
        this.pacoteSelecionado.set(encontrado);
      }
    }
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

    if (!this.instrutorId) {
      void this.router.navigate(['/aluno/instrutores']);
      return;
    }

    void this.router.navigate(['/aluno/agendamento-aulas'], {
      queryParams: { instrutorId: this.instrutorId },
      state: {
        pacote,
        instrutorId: this.instrutorId,
        instrutorNome: this.instrutorNome,
      },
    });
  }
}
