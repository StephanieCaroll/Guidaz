import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, bookmarkOutline, bookmark, star, starOutline, timeOutline,
  pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
  calendarOutline, personOutline, closeCircleOutline, sendOutline,
  createOutline, locationOutline
} from 'ionicons/icons';

import { AulaHistoricoApi, AulaService, PerfilApi } from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

interface DetalheAula {
  id?: number;
  instrutorId?: number;
  alunoId?: number;
  statusRaw?: string;
  minhaNota: number | null;
  tipo: string;
  titulo: string;
  disponivel: boolean;
  nota: number;
  avaliacoes: number;
  categoria: string;
  duracaoMin: number;
  valor: number;
  dataIso: string;
  horaInicioIso: string;
  horaFimIso: string;
  localEncontro: string;
  observacoesRaw: string;
  dataFormatada: string;
  horarioFormatado: string;
  statusTexto: string;
  instrutor: { nome: string; funcao: string; foto?: string };
  descricao: string;
  inclusos: string[];
}

const PRAZO_CANCELAMENTO_HORAS = 24;

@Component({
  selector: 'app-detalhe-aula',
  templateUrl: './detalhe-aula.page.html',
  styleUrls: ['./detalhe-aula.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, BottomNavComponent]
})
export class DetalheAulaPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly aulaService = inject(AulaService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly alertController = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly favorito = signal(false);
  processando = false;
  enviandoAvaliacao = false;

  editando = false;
  salvandoEdicao = false;
  editDataAula = '';
  editHoraInicio = '';
  editHoraFim = '';
  editLocalEncontro = '';
  editObservacoes = '';

  notaSelecionada = 5;
  comentarioAvaliacao = '';
  readonly estrelas = [1, 2, 3, 4, 5];

  aula: DetalheAula = {
    minhaNota: null,
    tipo: 'Aula Prática',
    titulo: 'Aula Prática',
    disponivel: true,
    nota: 5.0,
    avaliacoes: 0,
    categoria: 'B',
    duracaoMin: 60,
    valor: 120,
    dataIso: '',
    horaInicioIso: '',
    horaFimIso: '',
    localEncontro: '',
    observacoesRaw: '',
    dataFormatada: '',
    horarioFormatado: '',
    statusTexto: 'Agendada',
    instrutor: { nome: 'Participante', funcao: 'Aula Prática' },
    descricao: 'Aula prática acompanhada.',
    inclusos: [
      'Veículo adequado e revisado',
      'Acompanhamento prático',
      'Orientações personalizadas',
      'Suporte para dúvidas após a aula'
    ]
  };

  constructor() {
    addIcons({
      arrowBackOutline, bookmarkOutline, bookmark, star, starOutline, timeOutline,
      pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
      calendarOutline, personOutline, closeCircleOutline, sendOutline,
      createOutline, locationOutline
    });
  }

  // Perfil e permissões
 
  get isInstrutor(): boolean {
    return this.router.url.startsWith('/instrutor') || this.authService.usuario()?.perfil === 'instrutor';
  }

  get perfilApi(): PerfilApi {
    return this.isInstrutor ? 'INSTRUTOR' : 'ALUNO';
  }

  get podeAlterarStatus(): boolean {
    return this.aula.statusRaw === 'AGENDADA';
  }

  // Somente o instrutor conclui, e apenas depois do início da aula. 
  get podeConcluir(): boolean {
    return this.isInstrutor && this.podeAlterarStatus && this.aulaJaIniciou();
  }

  get podeAvaliar(): boolean {
    return this.aula.statusRaw === 'CONCLUIDA' && this.aula.minhaNota === null;
  }

  get jaAvaliada(): boolean {
    return this.aula.statusRaw === 'CONCLUIDA' && this.aula.minhaNota !== null;
  }

  ionViewWillEnter(): void {
    this.carregarAula();
  }

  // Carga dos dados
 
  private carregarAula(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) return;

    this.aulaService.buscarPorId(id, this.perfilApi).subscribe({
      next: (dados: AulaHistoricoApi) => {
        const fotoPessoa = this.normalizarFoto(
          this.isInstrutor ? dados.alunoFoto : dados.instrutorFoto
        );
        const veiculoInfo = dados.veiculoModelo
          ? `Veículo: ${dados.veiculoModelo}${dados.veiculoPlaca ? ' (' + dados.veiculoPlaca + ')' : ''}`
          : 'Veículo adequado e revisado';

        const dataTxt = dados.dataAula
          ? dados.dataAula.split('-').reverse().join('/')
          : '';
        const horaInicioCurta = dados.horaInicio ? dados.horaInicio.slice(0, 5) : '';
        const horaFimCurta = dados.horaFim ? dados.horaFim.slice(0, 5) : '';
        const horaTxt = horaInicioCurta
          ? `${horaInicioCurta}${horaFimCurta ? ' às ' + horaFimCurta : ''}`
          : '';

        const statusMap: Record<string, string> = {
          AGENDADA: 'Agendada',
          CONCLUIDA: 'Concluída',
          CANCELADA: 'Cancelada',
          FALTA: 'Falta',
          FALTA_ALUNO: 'Falta'
        };

        const nomePessoa = this.isInstrutor
          ? (dados.alunoNome || 'Aluno')
          : (dados.instrutorNome || dados.nomeOutraPessoa || 'Instrutor');

        const papelPessoa = this.isInstrutor ? 'Aluno' : 'Instrutor de Direção';

        this.aula = {
          id: dados.id,
          instrutorId: dados.instrutorId,
          alunoId: dados.alunoId,
          statusRaw: dados.status,
          minhaNota: dados.minhaNota ?? null,
          tipo: 'Aula Prática',
          titulo: dados.titulo,
          disponivel: dados.status === 'AGENDADA',
          nota: dados.minhaNota ?? 5.0,
          avaliacoes: dados.minhaNota ? 1 : 0,
          categoria: dados.categoria || 'B',
          duracaoMin: this.minutosEntre(horaInicioCurta, horaFimCurta) || 60,
          valor: 120,
          dataIso: dados.dataAula || '',
          horaInicioIso: horaInicioCurta,
          horaFimIso: horaFimCurta,
          localEncontro: dados.localEncontro || '',
          observacoesRaw: dados.observacoes || '',
          dataFormatada: dataTxt,
          horarioFormatado: horaTxt,
          statusTexto: statusMap[dados.status] || dados.status,
          instrutor: {
            nome: nomePessoa,
            funcao: `${papelPessoa}${dataTxt ? ' • ' + dataTxt + (horaTxt ? ' às ' + horaTxt : '') : ''}`,
            foto: fotoPessoa
          },
          descricao: dados.observacoes || `Aula prática agendada para ${dataTxt || 'breve'}${horaTxt ? ' (' + horaTxt + ')' : ''}. Status: ${statusMap[dados.status] || dados.status}.`,
          inclusos: [
            veiculoInfo,
            ...(dados.localEncontro ? [`Ponto de encontro: ${dados.localEncontro}`] : []),
            'Acompanhamento prático',
            'Orientações personalizadas'
          ]
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da aula:', err);
        void this.toastService.mostrar(this.mensagemErro(err, 'Não foi possível carregar os detalhes da aula.'), 'erro');
      }
    });
  }

  private normalizarFoto(raw?: string): string | undefined {
    if (!raw) return undefined;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
  }

  voltar(): void {
    this.location.back();
  }

  alternarFavorito(): void {
    this.favorito.update(v => !v);
  }

  verPerfil(): void {
    if (this.isInstrutor) {
      void this.router.navigateByUrl('/instrutor/gestao-alunos');
      return;
    }
    const instrutorId = this.aula.instrutorId;
    if (instrutorId) {
      void this.router.navigate(['/aluno/perfil-instrutor', instrutorId]);
    } else {
      void this.router.navigateByUrl('/aluno/instrutores');
    }
  }

   // Reagendamento
  
  abrirEdicao(): void {
    if (!this.podeAlterarStatus) return;

    if (!this.isInstrutor && this.dentroDoPrazoCritico()) {
      void this.toastService.mostrar(
        `Reagendamentos devem ser feitos com pelo menos ${PRAZO_CANCELAMENTO_HORAS} horas de antecedência. Fale com o seu instrutor.`,
        'erro'
      );
      return;
    }

    this.editDataAula = this.aula.dataIso;
    this.editHoraInicio = this.aula.horaInicioIso;
    this.editHoraFim = this.aula.horaFimIso;
    this.editLocalEncontro = this.aula.localEncontro;
    this.editObservacoes = this.aula.observacoesRaw;
    this.editando = true;
  }

  cancelarEdicao(): void {
    this.editando = false;
  }

  salvarEdicao(): void {
    if (!this.aula.id || this.salvandoEdicao) return;

    if (!this.editDataAula || !this.editHoraInicio || !this.editHoraFim) {
      void this.toastService.mostrar('Preencha data, horário de início e término.', 'erro');
      return;
    }

    if (this.editHoraFim <= this.editHoraInicio) {
      void this.toastService.mostrar('O horário de término deve ser maior que o de início.', 'erro');
      return;
    }

    const horarioMudou =
      this.editDataAula !== this.aula.dataIso ||
      this.editHoraInicio !== this.aula.horaInicioIso ||
      this.editHoraFim !== this.aula.horaFimIso;

    if (horarioMudou && new Date(`${this.editDataAula}T${this.editHoraInicio}:00`).getTime() < Date.now()) {
      void this.toastService.mostrar('Escolha uma data e um horário futuros.', 'erro');
      return;
    }

    this.salvandoEdicao = true;
    this.aulaService.editarAula(this.aula.id, {
      dataAula: this.editDataAula,
      horaInicio: this.editHoraInicio,
      horaFim: this.editHoraFim,
      localEncontro: this.editLocalEncontro.trim() || undefined,
      observacoes: this.editObservacoes.trim() || undefined
    }, this.perfilApi).subscribe({
      next: () => {
        this.salvandoEdicao = false;
        this.editando = false;
        void this.toastService.mostrar('Aula atualizada com sucesso!', 'ok');
        this.carregarAula();
      },
      error: (err) => {
        this.salvandoEdicao = false;
        void this.toastService.mostrar(this.mensagemErro(err, 'Não foi possível editar a aula.'), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  // Conclusão e cancelamento
  
  async concluirAula(): Promise<void> {
    if (!this.aula.id || this.processando) return;

    if (!this.isInstrutor) {
      void this.toastService.mostrar('Apenas o instrutor pode concluir a aula.', 'erro');
      return;
    }
    if (!this.aulaJaIniciou()) {
      void this.toastService.mostrar('A aula só pode ser concluída após o horário de início.', 'erro');
      return;
    }

    const confirmou = await this.confirmar('Concluir aula', 'Confirmar a conclusão desta aula?', 'Concluir');
    if (!confirmou) return;

    this.processando = true;
    this.aulaService.concluirAula(this.aula.id).subscribe({
      next: () => {
        this.processando = false;
        void this.toastService.mostrar('Aula marcada como concluída!', 'ok');
        this.carregarAula();
      },
      error: (err) => {
        this.processando = false;
        void this.toastService.mostrar(this.mensagemErro(err, 'Não foi possível concluir a aula.'), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  async cancelarAula(): Promise<void> {
    if (!this.aula.id || this.processando) return;

    const tardio = !this.isInstrutor && this.dentroDoPrazoCritico();
    let mensagem: string;
    if (tardio) {
      mensagem = `Faltam menos de ${PRAZO_CANCELAMENTO_HORAS} horas para a aula. Ao cancelar agora, ela será registrada como falta e o crédito não será devolvido. Deseja continuar?`;
    } else if (this.isInstrutor) {
      mensagem = 'Tem certeza que deseja cancelar esta aula? O aluno será avisado e o crédito será devolvido.';
    } else {
      mensagem = 'Tem certeza que deseja cancelar esta aula? O crédito será devolvido e o horário liberado.';
    }

    const confirmou = await this.confirmar('Cancelar aula', mensagem, 'Cancelar aula');
    if (!confirmou) return;

    this.processando = true;
    this.aulaService.cancelarAula(this.aula.id, this.perfilApi).subscribe({
      next: (resposta) => {
        this.processando = false;
        const registradaComoFalta = resposta?.status === 'FALTA_ALUNO';
        void this.toastService.mostrar(
          registradaComoFalta
            ? 'Aula cancelada fora do prazo e registrada como falta.'
            : 'Aula cancelada com sucesso.',
          'ok'
        );
        this.location.back();
      },
      error: (err) => {
        this.processando = false;
        void this.toastService.mostrar(this.mensagemErro(err, 'Não foi possível cancelar a aula.'), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  // Avaliação
 
  selecionarNota(estrela: number): void {
    this.notaSelecionada = estrela;
  }

  enviarAvaliacao(): void {
    if (!this.aula.id || this.enviandoAvaliacao || !this.podeAvaliar) return;
    const usuario = this.authService.usuario();
    const usuarioId = Number(usuario?.id);

    this.enviandoAvaliacao = true;
    this.aulaService.avaliar(this.aula.id, {
      usuarioId: Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : undefined,
      tipoAvaliador: this.perfilApi,
      nota: this.notaSelecionada,
      comentario: this.comentarioAvaliacao.trim() || undefined
    }).subscribe({
      next: () => {
        this.enviandoAvaliacao = false;
        this.comentarioAvaliacao = '';
        void this.toastService.mostrar('Avaliação enviada! Obrigado pelo feedback.', 'ok');
        this.carregarAula();
      },
      error: (err) => {
        this.enviandoAvaliacao = false;
        void this.toastService.mostrar(this.mensagemErro(err, 'Não foi possível registrar sua avaliação.'), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  // Utilitários
  
  private inicioDaAula(): Date | null {
    if (!this.aula.dataIso || !this.aula.horaInicioIso) return null;
    const inicio = new Date(`${this.aula.dataIso}T${this.aula.horaInicioIso}:00`);
    return Number.isNaN(inicio.getTime()) ? null : inicio;
  }

  private aulaJaIniciou(): boolean {
    const inicio = this.inicioDaAula();
    return inicio !== null && inicio.getTime() <= Date.now();
  }

  private dentroDoPrazoCritico(): boolean {
    const inicio = this.inicioDaAula();
    return inicio !== null && inicio.getTime() - Date.now() < PRAZO_CANCELAMENTO_HORAS * 60 * 60 * 1000;
  }

  private minutosEntre(inicio: string, fim: string): number {
    if (!inicio || !fim) return 0;
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    const total = (hf * 60 + mf) - (hi * 60 + mi);
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  private async confirmar(header: string, message: string, confirmText: string): Promise<boolean> {
    const alerta = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        { text: confirmText, role: 'confirm' }
      ]
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    return role === 'confirm';
  }

  private mensagemErro(err: any, padrao: string): string {
    const corpo = err?.error;
    if (typeof corpo === 'string' && corpo.trim() && corpo.length < 200) {
      return corpo;
    }
    return corpo?.message || corpo?.erro || corpo?.mensagem || padrao;
  }
}