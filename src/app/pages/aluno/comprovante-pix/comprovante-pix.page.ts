import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  closeCircleOutline,
  cloudUploadOutline,
  documentTextOutline,
  homeOutline,
  layersOutline,
  personOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';

interface PacoteResumo {
  categoria: string;
  veiculo: string;
  aulas: number;
  preco: number;
}

type StatusComprovante = 'selecionar' | 'analise' | 'aprovado' | 'rejeitado';

@Component({
  selector: 'app-comprovante-pix',
  templateUrl: './comprovante-pix.page.html',
  styleUrls: ['./comprovante-pix.page.scss'],
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
export class ComprovantePixPage {
  pacote = history.state?.['pacote'] as PacoteResumo | undefined;
  instrutorId = history.state?.['instrutorId'] as number | undefined;
  instrutorNome = history.state?.['instrutorNome'] as string | undefined;
  data = history.state?.['data'] as string | undefined;
  horaInicio = history.state?.['horaInicio'] as string | undefined;
  horaFim = history.state?.['horaFim'] as string | undefined;

  readonly arquivo = signal<File | null>(null);
  readonly status = signal<StatusComprovante>('selecionar');
  readonly erroArquivo = signal('');

  constructor() {
    addIcons({
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      cloudUploadOutline,
      documentTextOutline,
      homeOutline,
      layersOutline,
      personOutline,
      timeOutline,
      walletOutline,
    });
  }

  ionViewWillEnter(): void {
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

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    this.erroArquivo.set('');

    if (!arquivo) {
      return;
    }

    const tipoAceito = arquivo.type.startsWith('image/') || arquivo.type === 'application/pdf';
    if (!tipoAceito) {
      this.erroArquivo.set('Escolha uma imagem ou um arquivo PDF.');
      input.value = '';
      return;
    }

    const limiteBytes = 10 * 1024 * 1024;
    if (arquivo.size > limiteBytes) {
      this.erroArquivo.set('O arquivo deve ter no máximo 10 MB.');
      input.value = '';
      return;
    }

    this.arquivo.set(arquivo);
  }

  enviarComprovante(): void {
    if (this.arquivo()) {
      this.status.set('analise');
    }
  }

  simularResultado(resultado: 'aprovado' | 'rejeitado'): void {
    this.status.set(resultado);
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatarData(dataIso: string): string {
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}
