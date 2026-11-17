import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  layersOutline,
  personOutline,
  receiptOutline,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';
import { finalize } from 'rxjs';

import { HorarioPedidoPacote, PedidoPacote } from '../../../core/models/pedido-pacote.model';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { ToastService } from '../../../core/services/toast.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

type FiltroStatusPedido = 'EM_ANALISE' | 'PENDENTE_PAGAMENTO' | 'APROVADO' | 'TODOS';

@Component({
  selector: 'app-pedidos-pacote',
  templateUrl: './pedidos-pacote.page.html',
  styleUrls: ['./pedidos-pacote.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonTitle,
    IonToolbar,
    BottomNavComponent,
  ],
})
export class PedidosPacotePage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoPacoteService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly todosPedidos = signal<PedidoPacote[]>([]);
  readonly filtroAtivo = signal<FiltroStatusPedido>('EM_ANALISE');
  readonly pedidoDestaqueId = signal<number | null>(null);

  readonly carregando = signal(false);
  readonly erroLista = signal('');
  readonly processandoId = signal<number | null>(null);
  readonly rejeitandoId = signal<number | null>(null);
  readonly erroAcao = signal('');
  readonly erroAcaoId = signal<number | null>(null);

  motivo = '';

  readonly pedidosFiltrados = computed(() => {
    const filtro = this.filtroAtivo();
    const lista = this.todosPedidos();
    if (filtro === 'TODOS') return lista;
    return lista.filter((p) => p.status === filtro);
  });

  readonly contagemEmAnalise = computed(
    () => this.todosPedidos().filter((p) => p.status === 'EM_ANALISE').length
  );

  readonly contagemPendente = computed(
    () => this.todosPedidos().filter((p) => p.status === 'PENDENTE_PAGAMENTO').length
  );

  constructor() {
    addIcons({
      calendarOutline,
      cashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      layersOutline,
      personOutline,
      receiptOutline,
      refreshOutline,
      timeOutline,
    });
  }

  ionViewWillEnter(): void {
    const paramId = Number(this.route.snapshot.queryParamMap.get('pedidoId'));
    this.pedidoDestaqueId.set(Number.isInteger(paramId) && paramId > 0 ? paramId : null);
    this.carregar();
  }

  private instrutorId(): number {
    return Number(this.auth.usuario()?.id);
  }

  selecionarFiltro(filtro: FiltroStatusPedido): void {
    this.filtroAtivo.set(filtro);
    this.rejeitandoId.set(null);
    this.erroAcao.set('');
  }

  recarregar(event?: CustomEvent): void {
    this.carregar(() => event?.detail?.complete?.());
  }

  carregar(aoFinalizar?: () => void): void {
    const instrutorId = this.instrutorId();
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) {
      this.erroLista.set('Não foi possível identificar o instrutor logado. Entre novamente.');
      aoFinalizar?.();
      return;
    }

    this.carregando.set(true);
    this.erroLista.set('');
    this.pedidoService
      .listarPorInstrutor(instrutorId, 'TODOS')
      .pipe(
        finalize(() => {
          this.carregando.set(false);
          this.cdr.detectChanges();
          aoFinalizar?.();
        })
      )
      .subscribe({
        next: (lista) => {
          this.todosPedidos.set(lista);
          const destaqueId = this.pedidoDestaqueId();
          if (destaqueId) {
            const encontrado = lista.find((p) => p.id === destaqueId);
            if (encontrado && (encontrado.status === 'EM_ANALISE' || encontrado.status === 'PENDENTE_PAGAMENTO' || encontrado.status === 'APROVADO')) {
              this.filtroAtivo.set(encontrado.status);
            } else if (encontrado) {
              this.filtroAtivo.set('TODOS');
            }
          }
        },
        error: (erro: Error) => {
          console.error('Erro ao listar pedidos:', erro);
          this.todosPedidos.set([]);
          this.erroLista.set(erro.message);
        },
      });
  }

  aprovar(pedido: PedidoPacote): void {
    if (this.processandoId() !== null) return;
    this.executar(
      pedido,
      this.pedidoService.aprovar(pedido.id, this.instrutorId()),
      'Pagamento aprovado e aulas agendadas!'
    );
  }

  abrirRejeicao(pedido: PedidoPacote): void {
    this.erroAcao.set('');
    this.motivo = '';
    this.rejeitandoId.set(pedido.id);
  }

  cancelarRejeicao(): void {
    this.rejeitandoId.set(null);
    this.motivo = '';
    this.erroAcao.set('');
  }

  confirmarRejeicao(pedido: PedidoPacote): void {
    if (this.processandoId() !== null) return;
    const motivo = this.motivo.trim();
    if (!motivo) {
      this.erroAcaoId.set(pedido.id);
      this.erroAcao.set('Informe o motivo da rejeição.');
      return;
    }
    this.executar(
      pedido,
      this.pedidoService.rejeitar(pedido.id, this.instrutorId(), motivo),
      'Pedido rejeitado e horários liberados.'
    );
  }

  private executar(pedido: PedidoPacote, chamada: ReturnType<PedidoPacoteService['aprovar']>, sucesso: string): void {
    const instrutorId = this.instrutorId();
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) {
      this.erroAcao.set('Não foi possível identificar o instrutor logado. Entre novamente.');
      return;
    }

    this.erroAcao.set('');
    this.erroAcaoId.set(null);
    this.processandoId.set(pedido.id);
    chamada
      .pipe(
        finalize(() => {
          this.processandoId.set(null);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (atualizado) => {
          this.todosPedidos.update((lista) =>
            lista.map((p) => (p.id === pedido.id ? atualizado : p))
          );
          this.rejeitandoId.set(null);
          this.motivo = '';
          void this.toast.mostrar(sucesso, 'ok');
        },
        error: (erro: Error) => {
          console.error('Erro ao decidir pedido:', erro);
          this.erroAcaoId.set(pedido.id);
          this.erroAcao.set(erro.message);
        },
      });
  }

  traduzirStatus(status: string): string {
    switch (status) {
      case 'EM_ANALISE':
        return 'Comprovante em análise';
      case 'PENDENTE_PAGAMENTO':
        return 'Aguardando comprovante';
      case 'APROVADO':
        return 'Aprovado';
      case 'REJEITADO':
        return 'Rejeitado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  }

  formatarPreco(valor?: number): string {
    return (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatarData(dataIso: string): string {
    const partes = dataIso.slice(0, 10).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataIso;
  }

  formatarDataHora(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  descreverHorario(h: HorarioPedidoPacote): string {
    return `${this.formatarData(h.data)} • ${h.horaInicio.slice(0, 5)} às ${h.horaFim.slice(0, 5)}`;
  }
}