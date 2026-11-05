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

  readonly pacote = history.state['pacote'] as PacoteResumo | undefined;
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

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
    void this.router.navigate(['/aluno/pacotes']);
  }

  informarComprovante(): void {
    if (!this.pacote) {
      return;
    }

    void this.router.navigate(['/aluno/comprovante-pix'], {
      state: { pacote: this.pacote },
    });
  }
}
