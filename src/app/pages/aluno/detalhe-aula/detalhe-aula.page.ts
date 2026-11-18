import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, bookmarkOutline, bookmark, star, starOutline, timeOutline,
  pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
  calendarOutline, personOutline, closeCircleOutline, sendOutline,
  createOutline, locationOutline
} from 'ionicons/icons';

import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
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

@Component({
  selector: 'app-detalhe-aula',
  templateUrl: './detalhe-aula.page.html',
  styleUrls: ['./detalhe-aula.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, BottomNavComponent]
})
export class DetalheAulaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly aulaService = inject(AulaService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
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

  get isInstrutor(): boolean {
    return this.router.url.startsWith('/instrutor') || this.authService.usuario()?.perfil === 'instrutor';
  }

  get podeAlterarStatus(): boolean {
    return this.aula.statusRaw === 'AGENDADA';
  }

  get podeAvaliar(): boolean {
    return this.aula.statusRaw === 'CONCLUIDA' && this.aula.minhaNota === null;
  }

  get jaAvaliada(): boolean {
    return this.aula.statusRaw === 'CONCLUIDA' && this.aula.minhaNota !== null;
  }

  ngOnInit(): void {
    this.carregarAula();
  }

  ionViewWillEnter(): void {
    this.carregarAula();
  }

  private carregarAula(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) return;

    const perfil = this.isInstrutor ? 'INSTRUTOR' : 'ALUNO';
    this.aulaService.buscarPorId(id, perfil).subscribe({
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
          duracaoMin: 60,
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
      error: (err) => console.error('Erro ao carregar detalhes da aula:', err)
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

  abrirEdicao(): void {
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

    this.salvandoEdicao = true;
    this.aulaService.editarAula(this.aula.id, {
      dataAula: this.editDataAula,
      horaInicio: this.editHoraInicio,
      horaFim: this.editHoraFim,
      localEncontro: this.editLocalEncontro.trim() || undefined,
      observacoes: this.editObservacoes.trim() || undefined
    }).subscribe({
      next: () => {
        this.salvandoEdicao = false;
        this.editando = false;
        void this.toastService.mostrar('Aula atualizada com sucesso!', 'ok');
        this.carregarAula();
      },
      error: (err) => {
        this.salvandoEdicao = false;
        const msg = err?.error?.message || err?.error?.erro || 'Não foi possível editar a aula.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }

  concluirAula(): void {
    if (!this.aula.id || this.processando) return;
    if (!window.confirm('Confirmar conclusão desta aula?')) return;

    this.processando = true;
    this.aulaService.concluirAula(this.aula.id).subscribe({
      next: () => {
        this.processando = false;
        void this.toastService.mostrar('Aula marcada como concluída!', 'ok');
        this.carregarAula();
      },
      error: (err) => {
        this.processando = false;
        const msg = err?.error?.message || 'Não foi possível concluir a aula.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }

  cancelarAula(): void {
    if (!this.aula.id || this.processando) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta aula?')) return;

    this.processando = true;
    this.aulaService.cancelarAula(this.aula.id).subscribe({
      next: () => {
        this.processando = false;
        void this.toastService.mostrar('Aula cancelada com sucesso.', 'ok');
        this.location.back();
      },
      error: (err) => {
        this.processando = false;
        const msg = err?.error?.message || 'Não foi possível cancelar a aula.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }

  selecionarNota(estrela: number): void {
    this.notaSelecionada = estrela;
  }

  enviarAvaliacao(): void {
    if (!this.aula.id || this.enviandoAvaliacao) return;
    const usuario = this.authService.usuario();
    const usuarioId = Number(usuario?.id);

    this.enviandoAvaliacao = true;
    this.aulaService.avaliar(this.aula.id, {
      usuarioId: Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : undefined,
      tipoAvaliador: this.isInstrutor ? 'INSTRUTOR' : 'ALUNO',
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
        const msg = err?.error?.message || 'Não foi possível registrar sua avaliação.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }
}