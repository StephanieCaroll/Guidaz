import { Component, inject } from '@angular/core';
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
  calendarOutline,
  checkmarkCircleOutline,
  copyOutline,
  homeOutline,
  layersOutline,
  personOutline,
  qrCodeOutline,
  walletOutline,
} from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';
import { HorarioPedidoPacote, PedidoPacote } from '../../../core/models/pedido-pacote.model';

interface PacoteResumo {
  categoria: string;
  veiculo: string;
  aulas: number;
  preco: number;
}

@Component({
  selector: 'app-pagamento-pix',
  templateUrl: './pagamento-pix.page.html',
  styleUrls: ['./pagamento-pix.page.scss'],
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
export class PagamentoPixPage {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  pacote = history.state?.['pacote'] as PacoteResumo | undefined;
  instrutorId = history.state?.['instrutorId'] as number | undefined;
  instrutorNome = history.state?.['instrutorNome'] as string | undefined;
  data = history.state?.['data'] as string | undefined;
  horaInicio = history.state?.['horaInicio'] as string | undefined;
  horaFim = history.state?.['horaFim'] as string | undefined;

  pedidoId = history.state?.['pedidoId'] as number | undefined;
  pedido = history.state?.['pedido'] as PedidoPacote | undefined;

  readonly chavePix = 'guidaz@exemplo.com';

  constructor() {
    addIcons({
      calendarOutline,
      checkmarkCircleOutline,
      copyOutline,
      homeOutline,
      layersOutline,
      personOutline,
      qrCodeOutline,
      walletOutline,
    });
  }

  ionViewWillEnter(): void {
    if (history.state?.['pedidoId']) {
      this.pedidoId = Number(history.state['pedidoId']);
      this.pedido = history.state['pedido'] as PedidoPacote | undefined;
    }
    if (history.state?.['pacote']) {
      this.pacote = history.state['pacote'] as PacoteResumo;
    }
    if (history.state?.['instrutorId']) {
      this.instrutorId = Number(history.state['instrutorId']);
    }
    if (typeof history.state?.['instrutorNome'] === 'string') {
      this.instrutorNome = history.state['instrutorNome'];
    }
    if (typeof history.state?.['data'] === 'string') {
      this.data = history.state['data'];
    }
    if (typeof history.state?.['horaInicio'] === 'string') {
      this.horaInicio = history.state['horaInicio'];
    }
    if (typeof history.state?.['horaFim'] === 'string') {
      this.horaFim = history.state['horaFim'];
    }
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  horariosDoPedido(): HorarioPedidoPacote[] {
    return this.pedido?.horarios ?? [];
  }

  descreverHorario(h: HorarioPedidoPacote): string {
    return `${this.formatarData(h.data)} das ${h.horaInicio.slice(0, 5)} às ${h.horaFim.slice(0, 5)}`;
  }
  formatarData(dataIso: string): string {
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  async copiarChavePix(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.chavePix);
      await this.toast.mostrar('Chave Pix copiada.', 'ok');
    } catch {
      await this.toast.mostrar('Não foi possível copiar a chave neste navegador.', 'erro');
    }
  }

  voltarParaPacotes(): void {
    void this.router.navigate(['/aluno/pacotes'], {
      queryParams: this.instrutorId ? { instrutorId: this.instrutorId } : undefined,
      state: {
        instrutorId: this.instrutorId,
        instrutorNome: this.instrutorNome,
      },
    });
  }

  informarComprovante(): void {
    if (!this.pacote || !this.pedidoId) {
      return;
    }

    void this.router.navigate(['/aluno/comprovante-pix'], {
      state: {
        pedidoId: this.pedidoId,
        pedido: this.pedido,
        pacote: this.pacote,
        instrutorId: this.instrutorId,
        instrutorNome: this.instrutorNome,
        data: this.data,
        horaInicio: this.horaInicio,
        horaFim: this.horaFim,
      },
    });
  }
}
