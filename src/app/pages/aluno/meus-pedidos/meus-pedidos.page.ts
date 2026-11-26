import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AlertController,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cloudUploadOutline,
  hourglassOutline,
  layersOutline,
  personOutline,
  receiptOutline,
  timeOutline,
} from 'ionicons/icons';

import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { ToastService } from '../../../core/services/toast.service';
import { PedidoPacote, StatusPedidoPacote } from '../../../core/models/pedido-pacote.model';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

/** Mesma regra do back-end: em análise, o aluno só pode cancelar após 72h sem decisão. */
const HORAS_PARA_CANCELAR_EM_ANALISE = 72;

const VEICULO_POR_CATEGORIA: Record<string, string> = {
  A: 'Moto',
  B: 'Carro',
  AB: 'Moto e Carro',
  C: 'Caminhão',
  D: 'Ônibus',
  E: 'Carreta',
};

interface InfoStatus {
  rotulo: string;
  descricao: string;
  classe: string;
  icone: string;
}

const INFO_STATUS: Record<StatusPedidoPacote, InfoStatus> = {
  PENDENTE_PAGAMENTO: {
    rotulo: 'Aguardando pagamento',
    descricao: 'Faça o Pix e envie o comprovante para o instrutor analisar.',
    classe: 'pendente',
    icone: 'hourglass-outline',
  },
  EM_ANALISE: {
    rotulo: 'Em análise',
    descricao: 'Comprovante enviado. Aguarde a análise do instrutor.',
    classe: 'analise',
    icone: 'time-outline',
  },
  APROVADO: {
    rotulo: 'Aprovado',
    descricao: 'Pagamento confirmado. Suas aulas já estão agendadas.',
    classe: 'aprovado',
    icone: 'checkmark-circle-outline',
  },
  REJEITADO: {
    rotulo: 'Rejeitado',
    descricao: 'O instrutor não aprovou o pagamento. Os horários foram liberados.',
    classe: 'rejeitado',
    icone: 'close-circle-outline',
  },
  CANCELADO: {
    rotulo: 'Cancelado',
    descricao: 'Pedido cancelado. Os horários foram liberados.',
    classe: 'cancelado',
    icone: 'close-circle-outline',
  },
};

/** Etapas mostradas na linha do tempo de cada pedido. */
const ETAPAS: { status: StatusPedidoPacote; rotulo: string }[] = [
  { status: 'PENDENTE_PAGAMENTO', rotulo: 'Pedido' },
  { status: 'EM_ANALISE', rotulo: 'Comprovante' },
  { status: 'APROVADO', rotulo: 'Aprovado' },
];

@Component({
  selector: 'app-meus-pedidos',
  templateUrl: './meus-pedidos.page.html',
  styleUrls: ['./meus-pedidos.page.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonTitle,
    IonToolbar,
    BottomNavComponent,
  ],
})
export class MeusPedidosPage {
  private readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoPacoteService);
  private readonly alertController = inject(AlertController);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly agendaService = inject(AgendaService);

  readonly etapas = ETAPAS;
  /** A API do pedido só devolve instrutorId; o nome é buscado à parte (um por instrutor). */
  readonly nomesInstrutores = signal<Record<number, string>>({});
  readonly pedidos = signal<PedidoPacote[]>([]);
  readonly carregando = signal(false);
  /** Só vira true depois da primeira resposta da API; evita mostrar "sem pedidos" antes da hora. */
  readonly carregado = signal(false);
  readonly erro = signal('');
  readonly cancelandoId = signal<number | null>(null);

  constructor() {
    addIcons({
      alertCircle,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      cloudUploadOutline,
      hourglassOutline,
      layersOutline,
      personOutline,
      receiptOutline,
      timeOutline,
    });
  }

  /**
   * Carrega ao criar a página. O ionViewWillEnter nem sempre dispara quando a
   * página é aberta direto pela URL ou recarregada, então não dá para depender só dele.
   */
  ngOnInit(): void {
    this.carregar();
  }

  /** Ao voltar para a tela (já criada), atualiza a lista. */
  ionViewWillEnter(): void {
    if (this.carregado()) {
      this.carregar();
    }
  }

  carregar(evento?: CustomEvent): void {
    const alunoId = this.alunoLogadoId();
    if (!alunoId) {
      this.erro.set('Não foi possível identificar o aluno logado. Entre novamente.');
      this.carregado.set(true);
      (evento?.target as HTMLIonRefresherElement | undefined)?.complete();
      return;
    }

    this.erro.set('');
    this.carregando.set(true);

    this.pedidoService
      .listarPorAluno(alunoId)
      .pipe(
        finalize(() => {
          this.carregando.set(false);
          (evento?.target as HTMLIonRefresherElement | undefined)?.complete();
        })
      )
      .subscribe({
        next: (lista) => {
          this.pedidos.set(lista);
          this.carregado.set(true);
          this.carregarNomesInstrutores(lista);
        },
        error: (erro: Error) => {
          this.erro.set(erro.message);
          this.carregado.set(true);
        },
      });
  }

  nomeInstrutor(pedido: PedidoPacote): string {
    const id = pedido.instrutorId;
    return pedido.instrutorNome || (id ? this.nomesInstrutores()[id] : '') || `Instrutor #${id ?? '?'}`;
  }

  private carregarNomesInstrutores(lista: PedidoPacote[]): void {
    const conhecidos = this.nomesInstrutores();
    const faltando = [...new Set(lista.map((p) => p.instrutorId))].filter(
      (id): id is number => !!id && !conhecidos[id]
    );

    for (const id of faltando) {
      this.agendaService.getInstrutorInfo(id).subscribe((info) => {
        if (info?.nome) {
          this.nomesInstrutores.update((nomes) => ({ ...nomes, [id]: info.nome }));
        }
      });
    }
  }

  info(pedido: PedidoPacote): InfoStatus {
    return INFO_STATUS[pedido.status] ?? INFO_STATUS.PENDENTE_PAGAMENTO;
  }

  /** Marca as etapas da linha do tempo que o pedido já alcançou. */
  etapaConcluida(pedido: PedidoPacote, indice: number): boolean {
    switch (pedido.status) {
      case 'APROVADO':
        return true;
      case 'EM_ANALISE':
        return indice <= 1;
      case 'PENDENTE_PAGAMENTO':
        return indice === 0;
      case 'REJEITADO':
        return indice <= 1;
      case 'CANCELADO':
        return indice === 0 || (indice === 1 && !!pedido.comprovanteInformadoEm);
      default:
        return false;
    }
  }

  encerrado(pedido: PedidoPacote): boolean {
    return pedido.status === 'REJEITADO' || pedido.status === 'CANCELADO';
  }

  podeEnviarComprovante(pedido: PedidoPacote): boolean {
    return pedido.status === 'PENDENTE_PAGAMENTO';
  }

  podeCancelar(pedido: PedidoPacote): boolean {
    if (pedido.status === 'PENDENTE_PAGAMENTO') return true;
    if (pedido.status !== 'EM_ANALISE' || !pedido.comprovanteInformadoEm) return false;
    const informadoEm = new Date(pedido.comprovanteInformadoEm).getTime();
    if (Number.isNaN(informadoEm)) return false;
    return Date.now() >= informadoEm + HORAS_PARA_CANCELAR_EM_ANALISE * 60 * 60 * 1000;
  }

  /** Reabre a tela do comprovante com os dados do pedido, como o fluxo normal faz. */
  enviarComprovante(pedido: PedidoPacote): void {
    const categoria = String(pedido.categoria ?? '').toUpperCase();
    const primeiro = pedido.horarios?.[0];

    void this.router.navigate(['/aluno/comprovante-pix'], {
      state: {
        pedidoId: pedido.id,
        pedido,
        pacote: {
          categoria,
          veiculo: VEICULO_POR_CATEGORIA[categoria] ?? categoria,
          aulas: pedido.quantidadeAulas ?? pedido.horarios?.length ?? 0,
          preco: Number(pedido.precoTotal ?? 0),
        },
        instrutorId: pedido.instrutorId,
        instrutorNome: this.nomeInstrutor(pedido),
        data: primeiro?.data,
        horaInicio: primeiro?.horaInicio?.slice(0, 5),
        horaFim: primeiro?.horaFim?.slice(0, 5),
      },
    });
  }

  async cancelar(pedido: PedidoPacote): Promise<void> {
    const alunoId = this.alunoLogadoId();
    if (!alunoId || this.cancelandoId() !== null) return;

    const alerta = await this.alertController.create({
      header: 'Cancelar pedido?',
      message: `O pedido #${pedido.id} será cancelado e os horários reservados serão liberados. Essa ação não pode ser desfeita.`,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        { text: 'Cancelar pedido', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'confirm') return;

    this.cancelandoId.set(pedido.id);
    this.pedidoService
      .cancelar(pedido.id, alunoId)
      .pipe(finalize(() => this.cancelandoId.set(null)))
      .subscribe({
        next: (atualizado) => {
          this.pedidos.update((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)));
          void this.toast.mostrar('Pedido cancelado. Os horários foram liberados.', 'ok');
        },
        error: (erro: Error) => {
          void this.toast.mostrar(erro.message, 'erro');
        },
      });
  }

  formatarPreco(valor: number | undefined): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatarData(dataIso: string | undefined | null): string {
    if (!dataIso) return '';
    const [data] = dataIso.split('T');
    const partes = data.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataIso;
  }

  formatarDataHora(dataHoraIso: string | undefined | null): string {
    if (!dataHoraIso) return '';
    const hora = dataHoraIso.split('T')[1]?.slice(0, 5);
    return hora ? `${this.formatarData(dataHoraIso)} às ${hora}` : this.formatarData(dataHoraIso);
  }

  private alunoLogadoId(): number | null {
    const id = Number(this.auth.usuario()?.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
