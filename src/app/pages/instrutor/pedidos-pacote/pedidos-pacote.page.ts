import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';

import { HorarioPedidoPacote, PedidoPacote } from '../../../core/models/pedido-pacote.model';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pedidos-pacote',
  templateUrl: './pedidos-pacote.page.html',
  styleUrls: ['./pedidos-pacote.page.scss'],
  imports: [FormsModule, IonBackButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar],
})
export class PedidosPacotePage {
  private readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoPacoteService);
  private readonly toast = inject(ToastService);

  readonly pedidos = signal<PedidoPacote[]>([]);
  readonly carregando = signal(false);
  readonly erroLista = signal('');
  /** Pedido em processamento (aprovando/rejeitando). */
  readonly processandoId = signal<number | null>(null);
  /** Pedido com o formulário de rejeição aberto. */
  readonly rejeitandoId = signal<number | null>(null);
  readonly erroAcao = signal('');
  readonly erroAcaoId = signal<number | null>(null);

  motivo = '';

  ionViewWillEnter(): void {
    this.carregar();
  }

  private instrutorId(): number {
    return Number(this.auth.usuario()?.id);
  }

  carregar(): void {
    const instrutorId = this.instrutorId();
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) {
      this.erroLista.set('Não foi possível identificar o instrutor logado. Entre novamente.');
      return;
    }

    this.carregando.set(true);
    this.erroLista.set('');
    this.pedidoService.listarPorInstrutor(instrutorId, 'EM_ANALISE').pipe(
      finalize(() => this.carregando.set(false))
    ).subscribe({
      next: (lista) => this.pedidos.set(lista),
      error: (erro: Error) => {
        console.error('Erro ao listar pedidos:', erro);
        this.pedidos.set([]);
        this.erroLista.set(erro.message);
      },
    });
  }

  aprovar(pedido: PedidoPacote): void {
    if (this.processandoId() !== null) return;
    this.executar(pedido, this.pedidoService.aprovar(pedido.id, this.instrutorId()), 'Pedido aprovado.');
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
    this.executar(pedido, this.pedidoService.rejeitar(pedido.id, this.instrutorId(), motivo), 'Pedido rejeitado.');
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
    chamada.pipe(finalize(() => this.processandoId.set(null))).subscribe({
      next: () => {
        // Só remove da lista depois que a API confirmou a decisão.
        this.pedidos.update((lista) => lista.filter((p) => p.id !== pedido.id));
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

  formatarPreco(valor?: number): string {
    return (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatarData(dataIso: string): string {
    const partes = dataIso.slice(0, 10).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataIso;
  }

  descreverHorario(h: HorarioPedidoPacote): string {
    return `${this.formatarData(h.data)} das ${h.horaInicio.slice(0, 5)} às ${h.horaFim.slice(0, 5)}`;
  }
}
