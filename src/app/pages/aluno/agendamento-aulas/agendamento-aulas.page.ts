import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronBackOutline, chevronForwardOutline, informationCircle, personOutline, star, timeOutline } from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { PedidoPacoteService } from '../../../core/services/pedido-pacote.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

interface InstrutorResumo {
  id: number;
  nome: string;
  categoriasLecionadas?: string;
  notaMedia?: number;
  totalAvaliacoes?: number;
}

interface DiaAgenda {
  data: string;
  nome: string;
  numero: number;
}

interface HorarioAgendamento {
  hora: string;
  horaFim?: string;
  disponivel?: boolean;
}

interface HorarioApi {
  hora: string;
  disponivel: boolean;
  status: string;
}

interface PacoteResumo {
  categoria: string;
  veiculo: string;
  aulas: number;
  preco: number;
}

@Component({
  selector: 'app-agendamento-aulas',
  templateUrl: './agendamento-aulas.page.html',
  styleUrls: ['./agendamento-aulas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BottomNavComponent],
})
export class AgendamentoAulasPage {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoPacoteService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = environment.apiUrl;

  @ViewChild('daysCarousel') private daysCarousel?: ElementRef<HTMLDivElement>;

  instrutorId: number | null = null;
  alunoId: number | null = null; // ID do aluno recebido via Gestão de Alunos
  instrutor: InstrutorResumo | null = null;
  instrutorNome: string | undefined;
  pacote: PacoteResumo | undefined;
  dataSelecionada = this.dataLocal(new Date());
  horarios: HorarioAgendamento[] = [];
  horarioReservando: string | null = null;
  carregando = false;
  reservando = false;
  carregandoInstrutor = false;
  erroHorarios = '';
  erroInstrutor = '';
  erroReserva = '';
  mensagemSucesso = '';

  readonly dataMinima = this.dataLocal(new Date());
  readonly diasDisponiveis = this.criarDiasDisponiveis();
  private requisicaoHorarios = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      chevronBackOutline,
      chevronForwardOutline,
      informationCircle,
      personOutline,
      star,
      timeOutline
    });
  }

  // Lê os parâmetros da rota (suportando tanto o fluxo do aluno quanto o fluxo do instrutor)
  ionViewWillEnter(): void {
    const queryAlunoId = Number(this.route.snapshot.queryParamMap.get('alunoId'));
    const stateAlunoId = Number(history.state?.['alunoId']);
    this.alunoId = Number.isInteger(queryAlunoId) && queryAlunoId > 0 
      ? queryAlunoId 
      : (Number.isInteger(stateAlunoId) && stateAlunoId > 0 ? stateAlunoId : null);

    // Se o fluxo partiu do instrutor gerenciando um aluno:
    if (this.alunoId) {
      console.log('Painel do Instrutor - Agendando para o Aluno ID:', this.alunoId);
      // Aqui o instrutor logado é o próprio utilizador atual do AuthService
      const usuarioLogado = this.auth.usuario();
      this.instrutorId = usuarioLogado ? Number(usuarioLogado.id) : 1; // Fallback seguro para o ID do instrutor
    } else {
      // Fluxo original do aluno escolhendo instrutor
      const queryId = Number(this.route.snapshot.queryParamMap.get('instrutorId'));
      const stateId = Number(history.state?.['instrutorId']);
      const id = Number.isInteger(queryId) && queryId > 0
        ? queryId
        : (Number.isInteger(stateId) && stateId > 0 ? stateId : 0);

      if (!Number.isInteger(id) || id <= 0) {
        this.instrutorId = null;
        void this.router.navigateByUrl('/aluno/instrutores', { replaceUrl: true });
        return;
      }

      this.instrutorId = id;
      if (typeof history.state?.['instrutorNome'] === 'string') {
        this.instrutorNome = history.state['instrutorNome'];
      }
      if (history.state?.['pacote']) {
        this.pacote = history.state['pacote'] as PacoteResumo;
      }

      if (!this.pacote) {
        void this.router.navigate(['/aluno/pacotes'], {
          queryParams: { instrutorId: this.instrutorId },
          state: { instrutorId: this.instrutorId, instrutorNome: this.instrutorNome },
          replaceUrl: true
        });
        return;
      }
    }

    if (this.instrutorId) {
      this.carregarInstrutor();
      this.carregarHorarios();
    }
  }

  private carregarInstrutor(): void {
    if (!this.instrutorId) return;

    this.carregandoInstrutor = true;
    this.erroInstrutor = '';
    this.http.get<InstrutorResumo>(`${this.apiUrl}/instrutores/${this.instrutorId}`).subscribe({
      next: (instrutor) => {
        this.instrutor = instrutor;
        this.carregandoInstrutor = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar dados do instrutor:', erro);
        this.instrutor = null;
        this.carregandoInstrutor = false;
      }
    });
  }

  trocarInstrutor(): void {
    void this.router.navigateByUrl('/aluno/instrutores');
  }

  get dataResumo(): string {
    const [ano, mes, dia] = this.dataSelecionada.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(data);
    return `${diaSemana}, dia ${dia}`;
  }

  carregarHorarios(): void {
    if (!this.instrutorId || !this.dataSelecionada) return;

    const requisicaoAtual = ++this.requisicaoHorarios;
    this.carregando = true;
    this.erroHorarios = '';
    this.erroReserva = '';
    this.mensagemSucesso = '';
    this.horarios = [];

    this.http.get<HorarioApi[]>(
      `${this.apiUrl}/disponibilidades/instrutor/${this.instrutorId}/slots`,
      { params: { data: this.dataSelecionada } }
    ).pipe(
      timeout(15000),
      finalize(() => {
        if (requisicaoAtual === this.requisicaoHorarios) {
          this.carregando = false;
          this.cdr.detectChanges();
        }
      })
    ).subscribe({
      next: (resposta) => {
        if (requisicaoAtual !== this.requisicaoHorarios) return;
        this.horarios = resposta
          .filter((item) => item.disponivel)
          .map((item) => ({ hora: this.valorHora(item.hora), disponivel: item.disponivel }))
          .filter((item) => item.hora.length > 0);
        this.horarios.sort((a, b) => a.hora.localeCompare(b.hora));
        this.cdr.detectChanges();
      },
      error: (erro) => {
        if (requisicaoAtual !== this.requisicaoHorarios) return;
        console.error('Erro ao carregar horários disponíveis:', erro);
        this.horarios = [];
        this.erroHorarios = 'Não foi possível carregar os horários. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }

  selecionarDia(data: string): void {
    if (this.dataSelecionada === data) return;
    this.dataSelecionada = data;
    this.carregarHorarios();
  }

  moverCarrossel(direcao: number): void {
    this.daysCarousel?.nativeElement.scrollBy({
      left: direcao * 180,
      behavior: 'smooth'
    });
  }

  selecionarData(event: CustomEvent): void {
    const data = event.detail?.value;
    if (typeof data !== 'string') return;
    this.selecionarDia(data.slice(0, 10));
  }

  reservar(horaInicio: string): void {
    if (!this.instrutorId || this.reservando) return;

    // Se estiver no fluxo do instrutor agendando para o aluno:
    if (this.alunoId) {
      this.reservando = true;
      this.horarioReservando = horaInicio;

      // Endpoint direto do instrutor para agendar a aula para o aluno selecionado
      const payload = {
        alunoId: this.alunoId,
        instrutorId: this.instrutorId,
        data: this.dataSelecionada,
        horaInicio: horaInicio,
        horaFim: this.calcularHoraFim(horaInicio)
      };

      this.http.post(`${this.apiUrl}/agendamentos/instrutor`, payload).pipe(
        finalize(() => {
          this.reservando = false;
          this.horarioReservando = null;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: () => {
          this.mensagemSucesso = 'Aula agendada com sucesso para o aluno!';
          // Redireciona de volta para a gestão de alunos ou para a agenda do instrutor após breve momento
          setTimeout(() => {
            void this.router.navigateByUrl('/instrutor/gestao-alunos');
          }, 1500);
        },
        error: (erro) => {
          console.error('Erro ao agendar aula pelo instrutor:', erro);
          this.erroReserva = 'Não foi possível concluir o agendamento. Tente novamente.';
        }
      });
      return;
    }

    // Fluxo original do Aluno (com pacote e Pix)
    if (!this.pacote) {
      void this.router.navigate(['/aluno/pacotes'], {
        queryParams: { instrutorId: this.instrutorId },
        state: { instrutorId: this.instrutorId, instrutorNome: this.instrutor?.nome || this.instrutorNome }
      });
      return;
    }

    const horaFim = this.calcularHoraFim(horaInicio);
    const instrutorNome = this.instrutor?.nome || this.instrutorNome;
    const alunoId = Number(this.auth.usuario()?.id);

    if (!Number.isInteger(alunoId) || alunoId <= 0) {
      this.erroReserva = 'Não foi possível identificar o aluno logado. Entre novamente.';
      return;
    }

    const instrutorId = this.instrutorId;
    const pacote = this.pacote;
    const data = this.dataSelecionada;

    this.erroReserva = '';
    this.mensagemSucesso = '';
    this.reservando = true;
    this.horarioReservando = horaInicio;

    this.pedidoService.criar(
      { alunoId, instrutorId, dataPrimeiraAula: data, horaInicio },
      pacote.categoria
    ).pipe(
      finalize(() => {
        this.reservando = false;
        this.horarioReservando = null;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (pedido) => {
        void this.router.navigate(['/aluno/pagamento-pix'], {
          queryParams: { instrutorId },
          state: {
            pacote,
            instrutorId,
            instrutorNome,
            data,
            horaInicio,
            horaFim,
            pedidoId: pedido.id,
            pedido
          }
        });
      },
      error: (erro: Error) => {
        console.error('Erro ao criar pedido do pacote:', erro);
        this.erroReserva = erro.message;
      }
    });
  }

  calcularHoraFim(horaInicio: string): string {
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const fim = new Date(2000, 0, 1, hora, minuto + 60);
    return `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;
  }

  voltar(): void {
    this.navCtrl.back();
  }

  private dataLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private criarDiasDisponiveis(): DiaAgenda[] {
    const [ano, mes, dia] = this.dataMinima.split('-').map(Number);
    const inicio = new Date(ano, mes - 1, dia);

    return Array.from({ length: 30 }, (_, indice) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + indice);
      return {
        data: this.dataLocal(data),
        nome: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
          .format(data)
          .replace('.', '')
          .replace(/^./, letra => letra.toUpperCase()),
        numero: data.getDate()
      };
    });
  }

  private valorHora(valor: unknown): string {
    return typeof valor === 'string' ? valor.slice(0, 5) : '';
  }
}