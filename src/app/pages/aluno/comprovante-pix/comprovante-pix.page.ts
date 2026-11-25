import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { HorarioPedidoPacote, PedidoPacote } from '../../../core/models/pedido-pacote.model';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  calendarOutline,
  carSportOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cloudUploadOutline,
  documentTextOutline,
  layersOutline,
  personOutline,
  receiptOutline,
  ribbonOutline,
  timeOutline,
} from 'ionicons/icons';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

interface PacoteResumo {
  categoria: string;
  veiculo: string;
  aulas: number;
  preco: number;
}

type StatusComprovante = 'selecionar' | 'analise';

@Component({
  selector: 'app-comprovante-pix',
  templateUrl: './comprovante-pix.page.html',
  styleUrls: ['./comprovante-pix.page.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    BottomNavComponent,
  ],
})
export class ComprovantePixPage {
  private readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoPacoteService);

  pedidoId = history.state?.['pedidoId'] as number | undefined;
  pedido = history.state?.['pedido'] as PedidoPacote | undefined;
  pacote = history.state?.['pacote'] as PacoteResumo | undefined;
  instrutorId = history.state?.['instrutorId'] as number | undefined;
  instrutorNome = history.state?.['instrutorNome'] as string | undefined;
  data = history.state?.['data'] as string | undefined;
  horaInicio = history.state?.['horaInicio'] as string | undefined;
  horaFim = history.state?.['horaFim'] as string | undefined;

  readonly enviando = signal(false);
  readonly erroEnvio = signal('');
  readonly status = signal<StatusComprovante>('selecionar');
  readonly arquivo = signal<File | null>(null);
  readonly erroArquivo = signal('');

  constructor() {
    addIcons({
      alertCircle,
      calendarOutline,
      carSportOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      cloudUploadOutline,
      documentTextOutline,
      layersOutline,
      personOutline,
      receiptOutline,
      ribbonOutline,
      timeOutline,
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

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    this.erroArquivo.set('');

    if (!arquivo) return;

    const tipoAceito = arquivo.type.startsWith('image/') || arquivo.type === 'application/pdf';
    if (!tipoAceito) {
      this.erroArquivo.set('Escolha uma imagem ou um arquivo PDF.');
      this.arquivo.set(null);
      input.value = '';
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      this.erroArquivo.set('O arquivo deve ter no máximo 10 MB.');
      this.arquivo.set(null);
      input.value = '';
      return;
    }

    this.arquivo.set(arquivo);
  }

  private lerArquivoComoDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Não foi possível ler o arquivo selecionado.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo do comprovante.'));
      reader.readAsDataURL(file);
    });
  }

  async enviarComprovante(): Promise<void> {
    if (this.enviando() || !this.pedidoId) {
      return;
    }

    const arquivoSelecionado = this.arquivo();
    if (!arquivoSelecionado) {
      this.erroArquivo.set('Selecione o comprovante antes de continuar.');
      return;
    }

    const alunoId = Number(this.auth.usuario()?.id);
    if (!Number.isInteger(alunoId) || alunoId <= 0) {
      this.erroEnvio.set('Não foi possível identificar o aluno logado. Entre novamente.');
      return;
    }

    this.erroEnvio.set('');
    this.enviando.set(true);

    try {
      const comprovanteBase64 = await this.lerArquivoComoDataUrl(arquivoSelecionado);

      this.pedidoService
        .informarComprovante(this.pedidoId, alunoId, {
          comprovanteUrl: comprovanteBase64,
          comprovanteNome: arquivoSelecionado.name,
        })
        .pipe(finalize(() => this.enviando.set(false)))
        .subscribe({
          next: (pedido) => {
            if (pedido?.status === 'EM_ANALISE') {
              const pedidoComArquivo = {
                ...pedido,
                comprovanteUrl:
                  (pedido as PedidoPacote & { comprovanteUrl?: string }).comprovanteUrl ||
                  comprovanteBase64,
              };
              this.pedido = pedidoComArquivo;
              this.status.set('analise');
            } else {
              this.erroEnvio.set(
                `A API retornou um status inesperado (${pedido?.status ?? 'vazio'}). Tente novamente.`
              );
            }
          },
          error: (erro: Error) => {
            console.error('Erro ao informar comprovante:', erro);
            this.erroEnvio.set(erro.message);
          },
        });
    } catch (erro) {
      this.enviando.set(false);
      this.erroEnvio.set(
        erro instanceof Error ? erro.message : 'Erro ao processar o arquivo do comprovante.'
      );
    }
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

  descreverHorario(horario: HorarioPedidoPacote): string {
    return `${this.formatarData(horario.data)} das ${horario.horaInicio.slice(0, 5)} às ${horario.horaFim.slice(0, 5)}`;
  }
}