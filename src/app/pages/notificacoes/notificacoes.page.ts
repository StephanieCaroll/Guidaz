import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  closeOutline,
  calendarOutline,
  checkmarkOutline,
  notificationsOffOutline,
  refreshOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  receiptOutline,
  personOutline,
  cashOutline,
  timeOutline
} from 'ionicons/icons';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificacaoApi, NotificacaoService } from '../../core/services/notificacao.service';
import { PedidoPacoteService } from '../../core/services/pedido-pacote.service';
import { ToastService } from '../../core/services/toast.service';
import { PedidoPacote } from '../../core/models/pedido-pacote.model';

interface Notificacao {
  id: number;
  tipo: 'cancelada' | 'agendada' | 'pagamento';
  titulo: string;
  descricao: string;
  referenciaTipo?: string | null;
  referenciaId?: number | null;
  lida: boolean;
  horaTexto: string;
}

interface GrupoNotificacao {
  titulo: string;
  itens: Notificacao[];
}

@Component({
  selector: 'app-notificacoes',
  templateUrl: './notificacoes.page.html',
  styleUrls: ['./notificacoes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class NotificacoesPage implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificacaoService = inject(NotificacaoService);
  private readonly pedidoPacoteService = inject(PedidoPacoteService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  grupos: GrupoNotificacao[] = [];
  carregando = true;

  modalPedidoAberto = false;
  carregandoPedido = false;
  processandoAcao = false;
  pedidoSelecionado: PedidoPacote | null = null;
  exibirCampoRejeicao = false;
  motivoRejeicao = '';

  constructor() {
    addIcons({
      arrowBackOutline,
      closeOutline,
      calendarOutline,
      checkmarkOutline,
      notificationsOffOutline,
      refreshOutline,
      chevronForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      receiptOutline,
      personOutline,
      cashOutline,
      timeOutline
    });
  }

  ngOnInit() {
    this.carregarNotificacoes();
  }

  ionViewWillEnter() {
    this.carregarNotificacoes();
  }

  ionViewDidEnter() {
    this.carregarNotificacoes();
  }

  recarregar(event?: CustomEvent): void {
    this.carregarNotificacoes(() => {
      event?.detail?.complete?.();
    });
  }

  carregarNotificacoes(aoFinalizar?: () => void): void {
    const user = this.authService.usuario();
    const id = Number(user?.id);
    const perfil = String(user?.perfil ?? '').trim();

    if (!id || !perfil) {
      this.grupos = [];
      this.carregando = false;
      this.cdr.detectChanges();
      aoFinalizar?.();
      return;
    }

    this.carregando = this.grupos.length === 0;
    this.cdr.detectChanges();

    this.notificacaoService.listar(id, perfil).subscribe({
      next: (lista) => {
        this.grupos = this.agruparPorPeriodo(lista);
        this.carregando = false;
        this.cdr.detectChanges();
        aoFinalizar?.();
      },
      error: () => {
        this.grupos = [];
        this.carregando = false;
        this.cdr.detectChanges();
        aoFinalizar?.();
      }
    });
  }

  aoClicarNotificacao(item: Notificacao): void {
    if (!item.lida) {
      item.lida = true;
      this.cdr.detectChanges();
      this.notificacaoService.marcarComoLida(item.id).subscribe();
    }

    const perfilNormalizado = String(this.authService.usuario()?.perfil ?? '').trim().toLowerCase();
    const isInstrutor = perfilNormalizado === 'instrutor';
    const refTipo = String(item.referenciaTipo ?? '').trim().toUpperCase();
    const refId = item.referenciaId ? Number(item.referenciaId) : null;
    const textoBusca = `${item.titulo} ${item.descricao}`.toLowerCase();

    const isSobrePedidoOuPix =
      refTipo === 'PEDIDO' ||
      textoBusca.includes('pix') ||
      textoBusca.includes('pacote') ||
      textoBusca.includes('comprovante');

    if (isInstrutor) {
      if (isSobrePedidoOuPix) {
        this.abrirModalPedidoInstrutor(refId);
        return;
      }

      if (refTipo === 'AULA' && refId) {
        void this.router.navigate(['/instrutor/detalhe-aula'], { queryParams: { id: refId } });
        return;
      }

      void this.router.navigate(['/instrutor/calendario']);
      return;
    }

    if (isSobrePedidoOuPix) {
      if (textoBusca.includes('envie o comprovante') || textoBusca.includes('pedido de pacote criado')) {
        void this.router.navigate(['/aluno/pagamento-pix'], {
          queryParams: refId ? { pedidoId: refId } : undefined
        });
      } else {
        void this.router.navigate(['/aluno/historico-aula']);
      }
      return;
    }

    if (refTipo === 'AULA' && refId) {
      void this.router.navigate(['/aluno/detalhe-aula'], { queryParams: { id: refId } });
      return;
    }

    void this.router.navigate(['/aluno/calendario']);
  }

  private abrirModalPedidoInstrutor(pedidoId: number | null): void {
    const instrutorId = Number(this.authService.usuario()?.id);
    if (!instrutorId) {
      void this.router.navigate(['/instrutor/pedidos-pacote']);
      return;
    }

    this.modalPedidoAberto = true;
    this.carregandoPedido = true;
    this.pedidoSelecionado = null;
    this.exibirCampoRejeicao = false;
    this.motivoRejeicao = '';
    this.cdr.detectChanges();

    if (pedidoId) {
      this.pedidoPacoteService.buscarPorId(pedidoId).subscribe({
        next: (pedido: PedidoPacote) => {
          this.pedidoSelecionado = pedido;
          this.carregandoPedido = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.carregarUltimoPedidoInstrutor(instrutorId);
        }
      });
      return;
    }

    this.carregarUltimoPedidoInstrutor(instrutorId);
  }

  private carregarUltimoPedidoInstrutor(instrutorId: number): void {
    this.pedidoPacoteService.listarPorInstrutor(instrutorId, 'TODOS').subscribe({
      next: (pedidos: PedidoPacote[]) => {
        const emAnalise = pedidos.find((p) => p.status === 'EM_ANALISE');
        this.pedidoSelecionado = emAnalise ?? pedidos[0] ?? null;
        this.carregandoPedido = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoPedido = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModalPedido(): void {
    this.modalPedidoAberto = false;
    this.exibirCampoRejeicao = false;
    this.motivoRejeicao = '';
    this.cdr.detectChanges();
  }

  irParaTodosPedidos(): void {
    const pedidoId = this.pedidoSelecionado?.id;
    this.fecharModalPedido();
    void this.router.navigate(['/instrutor/pedidos-pacote'], {
      queryParams: pedidoId ? { pedidoId } : undefined
    });
  }

  aprovarPedidoSelecionado(): void {
    const instrutorId = Number(this.authService.usuario()?.id);
    const pedido = this.pedidoSelecionado;
    if (!instrutorId || !pedido?.id || this.processandoAcao) return;

    this.processandoAcao = true;
    this.cdr.detectChanges();

    this.pedidoPacoteService.aprovar(pedido.id, instrutorId).subscribe({
      next: (atualizado: PedidoPacote) => {
        this.pedidoSelecionado = atualizado;
        this.processandoAcao = false;
        this.cdr.detectChanges();
        void this.toastService.mostrar('Pagamento aprovado e aulas agendadas!', 'ok');
        this.carregarNotificacoes();
      },
      error: (err: Error) => {
        this.processandoAcao = false;
        this.cdr.detectChanges();
        void this.toastService.mostrar(err.message || 'Erro ao aprovar pedido.', 'erro');
      }
    });
  }

  confirmarRejeicaoPedido(): void {
    const instrutorId = Number(this.authService.usuario()?.id);
    const pedido = this.pedidoSelecionado;
    if (!instrutorId || !pedido?.id || this.processandoAcao) return;

    const motivo = this.motivoRejeicao.trim();
    if (!motivo) {
      void this.toastService.mostrar('Informe o motivo da rejeição para avisar o aluno.', 'erro');
      return;
    }

    this.processandoAcao = true;
    this.cdr.detectChanges();

    this.pedidoPacoteService.rejeitar(pedido.id, instrutorId, motivo).subscribe({
      next: (atualizado: PedidoPacote) => {
        this.pedidoSelecionado = atualizado;
        this.exibirCampoRejeicao = false;
        this.processandoAcao = false;
        this.cdr.detectChanges();
        void this.toastService.mostrar('Pedido rejeitado e horários liberados.', 'ok');
        this.carregarNotificacoes();
      },
      error: (err: Error) => {
        this.processandoAcao = false;
        this.cdr.detectChanges();
        void this.toastService.mostrar(err.message || 'Erro ao rejeitar pedido.', 'erro');
      }
    });
  }

  traduzirStatusPedido(status?: string): string {
    switch (status) {
      case 'PENDENTE_PAGAMENTO':
        return 'Aguardando aluno enviar comprovante Pix';
      case 'EM_ANALISE':
        return 'Comprovante enviado • Aguardando sua aprovação';
      case 'APROVADO':
        return 'Pagamento aprovado • Aulas agendadas';
      case 'REJEITADO':
        return 'Pedido rejeitado';
      case 'CANCELADO':
        return 'Pedido cancelado';
      default:
        return status ?? '';
    }
  }

  formatarPreco(valor?: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatarDataBr(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private agruparPorPeriodo(lista: NotificacaoApi[]): GrupoNotificacao[] {
    const hojeItens: Notificacao[] = [];
    const semanaItens: Notificacao[] = [];
    const anterioresItens: Notificacao[] = [];

    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const seteDiasAtras = new Date(inicioHoje);
    seteDiasAtras.setDate(inicioHoje.getDate() - 7);

    for (const n of lista) {
      const dataItem = n.criadaEm ? new Date(n.criadaEm) : agora;
      const tipoValido: Notificacao['tipo'] =
        n.tipo === 'cancelada' || n.tipo === 'pagamento' || n.tipo === 'agendada'
          ? n.tipo
          : 'agendada';

      const horaTexto = !Number.isNaN(dataItem.getTime())
        ? dataItem.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '';

      const card: Notificacao = {
        id: n.id,
        tipo: tipoValido,
        titulo: n.titulo,
        descricao: n.descricao,
        referenciaTipo: n.referenciaTipo,
        referenciaId: n.referenciaId,
        lida: Boolean(n.lida),
        horaTexto
      };

      if (dataItem >= inicioHoje) {
        hojeItens.push(card);
      } else if (dataItem >= seteDiasAtras) {
        semanaItens.push(card);
      } else {
        anterioresItens.push(card);
      }
    }

    const resultado: GrupoNotificacao[] = [];
    if (hojeItens.length > 0) resultado.push({ titulo: 'HOJE', itens: hojeItens });
    if (semanaItens.length > 0) resultado.push({ titulo: 'ESTA SEMANA', itens: semanaItens });
    if (anterioresItens.length > 0) resultado.push({ titulo: 'ANTERIORES', itens: anterioresItens });
    return resultado;
  }

  voltar() {
    const perfil = String(this.authService.usuario()?.perfil ?? '').trim().toLowerCase();
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl(perfil === 'instrutor' ? '/instrutor/home' : '/aluno/home');
  }
}