import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  busOutline,
  carSportOutline,
  checkmarkCircleOutline,
  createOutline,
  homeOutline,
  layersOutline,
  personOutline,
  saveOutline,
  sparklesOutline,
  walletOutline,
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { ToastService } from '../../../core/services/toast.service';
import { PacoteApi } from '../../../core/models/pedido-pacote.model';

export interface PacoteAula {
  id?: number;
  categoria: 'A' | 'B' | 'AB' | 'C' | 'D' | 'E';
  veiculo: string;
  nomeExibicao: string;
  aulas: number;
  preco: number;
  personalizado: boolean;
}

const VEICULO_POR_CATEGORIA: Record<string, string> = {
  A: 'Moto',
  B: 'Carro',
  AB: 'Moto e Carro',
  C: 'Caminhão',
  D: 'Ônibus',
  E: 'Carreta',
};

@Component({
  selector: 'app-pacotes',
  templateUrl: './pacotes.page.html',
  styleUrls: ['./pacotes.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class PacotesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly pedidoPacoteService = inject(PedidoPacoteService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pacotes = signal<PacoteAula[]>([]);
  readonly pacoteSelecionado = signal<PacoteAula>({
    categoria: 'B',
    veiculo: 'Carro',
    nomeExibicao: 'B / Carro',
    aulas: 2,
    preco: 280,
    personalizado: false,
  });

  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly modoEdicao = signal(false);

  editNome = 'B / Carro';
  editAulas = 2;
  editPreco = 280;

  instrutorId: number | null = null;
  instrutorNome: string | undefined;

  readonly isInstrutor = computed(() => {
    const user = this.authService.usuario();
    return user?.perfil === 'instrutor';
  });

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      createOutline,
      saveOutline,
      sparklesOutline,
      carSportOutline,
      bicycleOutline,
      busOutline,
      homeOutline,
      layersOutline,
      walletOutline,
      personOutline,
    });
    this.lerDadosNavegacao();
  }

  ionViewWillEnter(): void {
    this.lerDadosNavegacao();
    this.carregarPacotesDaApi();
  }

  private lerDadosNavegacao(): void {
    const queryId = Number(this.route.snapshot.queryParamMap.get('instrutorId'));
    const stateId = Number(history.state?.['instrutorId']);
    const user = this.authService.usuario();

    if (this.isInstrutor() && user?.id) {
      this.instrutorId = Number(user.id);
    } else {
      this.instrutorId = Number.isInteger(queryId) && queryId > 0
        ? queryId
        : (Number.isInteger(stateId) && stateId > 0 ? stateId : null);
    }

    if (typeof history.state?.['instrutorNome'] === 'string') {
      this.instrutorNome = history.state['instrutorNome'];
    }
  }

  private carregarPacotesDaApi(): void {
    this.carregando.set(true);
    this.pedidoPacoteService.listarPacotes(this.instrutorId).subscribe({
      next: (listaApi: PacoteApi[]) => {
        const convertidos: PacoteAula[] = listaApi.map((item) => {
          const cat = String(item.categoria ?? 'B').toUpperCase() as PacoteAula['categoria'];
          const veiculoPadrao = VEICULO_POR_CATEGORIA[cat] ?? cat;
          const nomeBanco = typeof item.nome === 'string' && item.nome.trim() ? item.nome.trim() : `${cat} / ${veiculoPadrao}`;
          return {
            id: item.id,
            categoria: cat,
            veiculo: veiculoPadrao,
            nomeExibicao: nomeBanco,
            aulas: Number(item.quantidadeAulas ?? 2),
            preco: Number(item.preco ?? 0),
            personalizado: item.instrutorId != null,
          };
        });

        this.pacotes.set(convertidos);

        const pacoteAnterior = history.state?.['pacote'] as PacoteAula | undefined;
        const atual = pacoteAnterior?.categoria
          ? convertidos.find((p) => p.categoria === pacoteAnterior.categoria)
          : convertidos.find((p) => p.categoria === this.pacoteSelecionado().categoria) ?? convertidos[0];

        if (atual) {
          this.selecionarPacote(atual);
        }
        this.carregando.set(false);
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        this.carregando.set(false);
        this.cdr.detectChanges();
        void this.toastService.mostrar(err.message, 'erro');
      },
    });
  }

  iconeCategoria(categoria: string): string {
    if (categoria === 'A') return 'bicycle-outline';
    if (categoria === 'C' || categoria === 'D' || categoria === 'E') return 'bus-outline';
    return 'car-sport-outline';
  }

  precoPorAula(pacote: PacoteAula): number {
    if (!pacote.aulas || pacote.aulas <= 0) return pacote.preco;
    return pacote.preco / pacote.aulas;
  }

  selecionarPacote(pacote: PacoteAula): void {
    this.pacoteSelecionado.set(pacote);
    this.editNome = pacote.nomeExibicao;
    this.editAulas = pacote.aulas;
    this.editPreco = pacote.preco;
    this.modoEdicao.set(false);
  }

  editarCardDireto(event: Event, pacote: PacoteAula): void {
    event.stopPropagation();
    this.selecionarPacote(pacote);
    this.ativarEdicao();
  }

  ativarEdicao(): void {
    const atual = this.pacoteSelecionado();
    this.editNome = atual.nomeExibicao;
    this.editAulas = atual.aulas;
    this.editPreco = atual.preco;
    this.modoEdicao.set(true);
  }

  salvarEdicaoPacote(): void {
    const atual = this.pacoteSelecionado();
    if (!this.instrutorId || !atual.id) {
      void this.toastService.mostrar('Não foi possível identificar o instrutor ou o pacote.', 'erro');
      return;
    }

    const nomeLimpo = this.editNome.trim();
    if (!nomeLimpo) {
      void this.toastService.mostrar('Informe um nome ou descrição para o pacote.', 'erro');
      return;
    }

    if (!this.editAulas || this.editAulas < 1 || this.editAulas > 50) {
      void this.toastService.mostrar('Informe entre 1 e 50 aulas.', 'erro');
      return;
    }

    if (!this.editPreco || this.editPreco <= 0) {
      void this.toastService.mostrar('Informe um valor válido maior que zero.', 'erro');
      return;
    }

    this.salvando.set(true);
    this.pedidoPacoteService
      .atualizarPacote(atual.id, {
        instrutorId: this.instrutorId,
        nome: nomeLimpo,
        categoria: atual.categoria,
        quantidadeAulas: Number(this.editAulas),
        preco: Number(this.editPreco),
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.modoEdicao.set(false);
          void this.toastService.mostrar('Pacote personalizado salvo com sucesso!', 'ok');
          this.carregarPacotesDaApi();
        },
        error: (err: Error) => {
          this.salvando.set(false);
          this.cdr.detectChanges();
          void this.toastService.mostrar(err.message, 'erro');
        },
      });
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