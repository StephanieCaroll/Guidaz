import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonContent,
  IonIcon,
  IonAvatar,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  notificationsOutline,
  calendarOutline,
  calendarNumberOutline,
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  banOutline,
  trashOutline,
  informationCircleOutline
} from 'ionicons/icons';

import {
  AgendaService,
  DisponibilidadeInstrutor,
  BloqueioAgenda,
  InstrutorInfo,
  horaCurta
} from '../../../core/services/agenda.service';
import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

export interface DiaSemanaItem {
  valor: string;
  nome: string;
  nomeCompleto: string;
  selecionado: boolean;
}

export interface DiaCalendarioMes {
  chave: string;
  numero: number;
  data: Date;
  noMesAtual: boolean;
  temAula: boolean;
  temDisponibilidade: boolean;
  temBloqueio: boolean;
}

export interface AulaDiaAgenda {
  horario: string;
  titulo: string;
  aluno: string;
  status: string;
}

@Component({
  selector: 'app-agenda-disponibilidade',
  templateUrl: './agenda-disponibilidade.page.html',
  styleUrls: ['./agenda-disponibilidade.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonAvatar,
    IonSpinner
  ]
})
export class AgendaDisponibilidadePage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);

  instrutorId: number | null = null;
  alunoIdSelecionado: number | null = null;
  alunoNomeSelecionado: string = '';
  alunoCategoriaSelecionada: string = '';

  focoSelecionado: string = 'vias';

  nomeInstrutor: string = 'Instrutor';
  instrutorEspecialidade: string = 'Instrutor de Direção';
  notaInstrutor: number = 5.0;
  instrutorQtdAvaliacoes: number = 0;

  // Cabeçalho e calendário mensal
  temNotificacao: boolean = false;
  mesAtualReferencia: Date = new Date();
  diaSelecionadoData: Date = new Date();
  diaSelecionadoChave: string = '';
  mesAnoLabel: string = '';
  diasDoMes: DiaCalendarioMes[] = [];
  aulasDoDia: AulaDiaAgenda[] = [];

  diasSemana: DiaSemanaItem[] = [
    { valor: 'MONDAY', nome: 'Seg', nomeCompleto: 'Segunda-feira', selecionado: false },
    { valor: 'TUESDAY', nome: 'Ter', nomeCompleto: 'Terça-feira', selecionado: false },
    { valor: 'WEDNESDAY', nome: 'Qua', nomeCompleto: 'Quarta-feira', selecionado: false },
    { valor: 'THURSDAY', nome: 'Qui', nomeCompleto: 'Quinta-feira', selecionado: false },
    { valor: 'FRIDAY', nome: 'Sex', nomeCompleto: 'Sexta-feira', selecionado: false },
    { valor: 'SATURDAY', nome: 'Sáb', nomeCompleto: 'Sábado', selecionado: false },
    { valor: 'SUNDAY', nome: 'Dom', nomeCompleto: 'Domingo', selecionado: false }
  ];

  private mapaDias: { [key: string]: string } = {
    'MONDAY': 'Segunda-feira',
    'TUESDAY': 'Terça-feira',
    'WEDNESDAY': 'Quarta-feira',
    'THURSDAY': 'Quinta-feira',
    'FRIDAY': 'Sexta-feira',
    'SATURDAY': 'Sábado',
    'SUNDAY': 'Domingo'
  };

  private readonly valoresDiaPorJsIndex: string[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
  ];

  bloqueios: BloqueioAgenda[] = [];
  horariosOcupados: BloqueioAgenda[] = [];
  disponabilidadesSalvas: DisponibilidadeInstrutor[] = [];
  disponabilidades: DisponibilidadeInstrutor[] = [];
  private aulasInstrutor: AulaHistoricoApi[] = [];

  carregando: boolean = false;
  salvando: boolean = false;
  bloqueando: boolean = false;
  alteracoesPendentes: boolean = false;

  mostrarFormularioDisponibilidade: boolean = false;
  mostrarFormularioBloqueio: boolean = false;

  /** Índice do horário em edição; null quando o formulário está adicionando um novo. */
  indiceEdicao: number | null = null;

  novoHorarioDia: string = 'MONDAY';
  horaInicio: string = '08:00';
  horaFim: string = '12:00';

  novoBloqueioData: string = this.formatarChaveData(new Date());
  horaBloqueioInicio: string = '10:00';
  horaBloqueioFim: string = '11:00';
  motivoBloqueio: string = 'Compromisso Pessoal';

  constructor() {
    addIcons({
      arrowBackOutline,
      notificationsOutline,
      calendarOutline,
      calendarNumberOutline,
      chevronBackOutline,
      chevronForwardOutline,
      addOutline,
      banOutline,
      trashOutline,
      informationCircleOutline
    });
    this.gerarCalendarioMes(this.mesAtualReferencia);
  }

  ionViewWillEnter() {
    this.inicializarTela();
    this.auth.buscarDoBanco().subscribe({
      next: () => {
        this.resolverInstrutorLogado();
        this.carregarPerfilInstrutor();
      },
      error: () => { /* mantém dados da sessão local */ }
    });
  }

  // ------------------------------------------------------------------
  // Getters de apoio ao template
  // ------------------------------------------------------------------

  get rotuloBotaoHorario(): string {
    return this.indiceEdicao !== null ? 'Atualizar horário' : 'Adicionar horário';
  }

  get bloqueiosDoDia(): BloqueioAgenda[] {
    return this.bloqueios.filter(b => b.data === this.diaSelecionadoChave);
  }

  // ------------------------------------------------------------------
  // Calendário
  // ------------------------------------------------------------------

  private formatarChaveData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private dataDaAula(aula: AulaHistoricoApi): string {
    return aula.dataAula || (aula.dataHora ? aula.dataHora.slice(0, 10) : '');
  }

  private horaInicioDaAula(aula: AulaHistoricoApi): string {
    return horaCurta(aula.horaInicio) || (aula.dataHora ? aula.dataHora.slice(11, 16) : '');
  }

  gerarCalendarioMes(referencia: Date) {
    const ano = referencia.getFullYear();
    const mes = referencia.getMonth();

    const formatado = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(ano, mes, 1));
    this.mesAnoLabel = formatado.charAt(0).toUpperCase() + formatado.slice(1);

    if (!this.diaSelecionadoChave) {
      this.diaSelecionadoChave = this.formatarChaveData(this.diaSelecionadoData);
    }

    const primeiroDiaMes = new Date(ano, mes, 1);
    const offsetSegunda = (primeiroDiaMes.getDay() + 6) % 7; // 0 = Seg ... 6 = Dom
    const dataInicioGrade = new Date(ano, mes, 1 - offsetSegunda);

    const diasAtivos = new Set(
      this.disponabilidadesSalvas.filter(d => d.ativo).map(d => d.diaSemana)
    );
    const diasComAula = new Set(this.aulasInstrutor.map(a => this.dataDaAula(a)));
    const diasComBloqueio = new Set(this.bloqueios.map(b => b.data));

    const celulas: DiaCalendarioMes[] = [];
    for (let i = 0; i < 42; i++) {
      const atual = new Date(
        dataInicioGrade.getFullYear(),
        dataInicioGrade.getMonth(),
        dataInicioGrade.getDate() + i
      );
      const chave = this.formatarChaveData(atual);
      const diaValor = this.valoresDiaPorJsIndex[atual.getDay()];

      celulas.push({
        chave,
        numero: atual.getDate(),
        data: atual,
        noMesAtual: atual.getMonth() === mes,
        temAula: diasComAula.has(chave),
        temDisponibilidade: diasAtivos.has(diaValor),
        temBloqueio: diasComBloqueio.has(chave)
      });
    }

    this.diasDoMes = celulas;
  }

  mesAnterior() {
    this.mesAtualReferencia = new Date(
      this.mesAtualReferencia.getFullYear(),
      this.mesAtualReferencia.getMonth() - 1,
      1
    );
    this.gerarCalendarioMes(this.mesAtualReferencia);
    this.cdr.detectChanges();
  }

  proximoMes() {
    this.mesAtualReferencia = new Date(
      this.mesAtualReferencia.getFullYear(),
      this.mesAtualReferencia.getMonth() + 1,
      1
    );
    this.gerarCalendarioMes(this.mesAtualReferencia);
    this.cdr.detectChanges();
  }

  selecionarDiaCalendario(dia: DiaCalendarioMes) {
    this.diaSelecionadoData = dia.data;
    this.diaSelecionadoChave = dia.chave;
    this.novoBloqueioData = dia.chave;

    if (!dia.noMesAtual) {
      this.mesAtualReferencia = new Date(dia.data.getFullYear(), dia.data.getMonth(), 1);
      this.gerarCalendarioMes(this.mesAtualReferencia);
    }

    this.atualizarAulasDoDia();
    this.cdr.detectChanges();
  }

  private atualizarAulasDoDia() {
    const statusTexto: Record<string, string> = {
      AGENDADA: 'Agendada',
      CONCLUIDA: 'Concluída'
    };

    this.aulasDoDia = this.aulasInstrutor
      .filter(a => this.dataDaAula(a) === this.diaSelecionadoChave)
      .sort((a, b) => this.horaInicioDaAula(a).localeCompare(this.horaInicioDaAula(b)))
      .map(a => {
        const inicio = this.horaInicioDaAula(a);
        const fim = horaCurta(a.horaFim);
        return {
          horario: fim ? `${inicio} - ${fim}` : inicio,
          titulo: a.titulo,
          aluno: a.alunoNome || a.nomeOutraPessoa || '',
          status: statusTexto[a.status] || a.status
        };
      });
  }

  abrirNotificacoes() {
    this.temNotificacao = false;
    this.toastService.mostrar('Nenhuma nova notificação no momento.', 'ok');
  }

  // ------------------------------------------------------------------
  // Inicialização e carga de dados
  // ------------------------------------------------------------------

  private inicializarTela() {
    this.resolverInstrutorLogado();
    this.capturarParametrosRota();

    if (!this.instrutorId) {
      this.toastService.mostrar('Sessão do instrutor não encontrada. Faça login novamente.', 'erro');
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.carregarPerfilInstrutor();
    this.carregarDados();
  }

  private resolverInstrutorLogado() {
    const usuario: any = this.auth.usuario();
    const idLogado = Number(usuario?.id);

    if (Number.isInteger(idLogado) && idLogado > 0) {
      this.instrutorId = idLogado;
    } else {
      this.instrutorId = null;
    }

    if (!this.alunoNomeSelecionado && usuario) {
      this.nomeInstrutor = usuario.nome || usuario.nomeCompleto || 'Instrutor';
      if (usuario.categoriasLecionadas) {
        this.instrutorEspecialidade = `Categorias: ${usuario.categoriasLecionadas}`;
      }
    }
  }

  private capturarParametrosRota() {
    const alunoIdParam = this.route.snapshot.queryParamMap.get('alunoId');
    const alunoNomeParam = this.route.snapshot.queryParamMap.get('alunoNome');
    const alunoCategoriaParam = this.route.snapshot.queryParamMap.get('alunoCategoria');

    this.alunoIdSelecionado = alunoIdParam ? Number(alunoIdParam) : null;
    this.alunoNomeSelecionado = alunoNomeParam || '';
    this.alunoCategoriaSelecionada = alunoCategoriaParam || '';

    if (this.alunoNomeSelecionado) {
      this.nomeInstrutor = `Aluno: ${this.alunoNomeSelecionado}`;
    }

    if (this.alunoCategoriaSelecionada) {
      this.instrutorEspecialidade = `Categoria: ${this.alunoCategoriaSelecionada}`;
    }
  }

  selecionarFoco(foco: string) {
    this.focoSelecionado = foco;
    this.cdr.detectChanges();
  }

  voltar() {
    if (this.alteracoesPendentes &&
        !window.confirm('Você tem alterações de disponibilidade não salvas. Deseja sair mesmo assim?')) {
      return;
    }
    this.location.back();
  }

  carregarPerfilInstrutor() {
    if (!this.instrutorId || this.alunoNomeSelecionado) {
      return;
    }

    this.agendaService.getInstrutorInfo(this.instrutorId).subscribe({
      next: (info: InstrutorInfo) => {
        if (info && info.nome) {
          this.nomeInstrutor = info.nome;
          this.instrutorEspecialidade = info.especialidade || this.instrutorEspecialidade;
          this.notaInstrutor = info.avaliacao || 5.0;
          this.instrutorQtdAvaliacoes = info.qtdAvaliacoes || 0;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  carregarDados() {
    if (!this.instrutorId) return;
    this.carregarDisponibilidades();
    this.carregarBloqueios();
    this.carregarAulas();
  }

  carregarDisponibilidades() {
    if (!this.instrutorId) return;

    this.carregando = true;
    this.cdr.detectChanges();

    this.agendaService.getDisponibilidades(this.instrutorId).subscribe({
      next: (res: DisponibilidadeInstrutor[]) => {
        this.aplicarListaDoServidor(res);
        this.alteracoesPendentes = false;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar disponibilidades:', err);
        this.toastService.mostrar(this.mensagemErro(err, 'Erro ao carregar disponibilidades.'), 'erro');
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarBloqueios() {
    if (!this.instrutorId) return;

    this.agendaService.getBloqueios(this.instrutorId).subscribe({
      next: (res: BloqueioAgenda[]) => {
        const hoje = this.formatarChaveData(new Date());
        this.bloqueios = (res ?? [])
          .map(b => ({ ...b, horaInicio: horaCurta(b.horaInicio), horaFim: horaCurta(b.horaFim) }))
          .filter(b => b.data >= hoje)
          .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio));
        this.horariosOcupados = [...this.bloqueios];
        this.gerarCalendarioMes(this.mesAtualReferencia);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar bloqueios:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private carregarAulas() {
    if (!this.instrutorId) return;

    this.aulaService.historicoInstrutor(this.instrutorId).subscribe({
      next: (lista) => {
        this.aulasInstrutor = (lista ?? []).filter(a => a.status === 'AGENDADA' || a.status === 'CONCLUIDA');
        this.atualizarAulasDoDia();
        this.gerarCalendarioMes(this.mesAtualReferencia);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar aulas do instrutor:', err);
      }
    });
  }

  private aplicarListaDoServidor(lista: DisponibilidadeInstrutor[]) {
    this.disponabilidadesSalvas = (lista ?? []).map(d => ({
      ...d,
      horaInicio: horaCurta(d.horaInicio),
      horaFim: horaCurta(d.horaFim)
    }));
    this.disponabilidades = [...this.disponabilidadesSalvas];
    this.sincronizarBotoesDias();
  }

  // ------------------------------------------------------------------
  // Disponibilidade recorrente
  // ------------------------------------------------------------------

  sincronizarBotoesDias() {
    const diasComDisponibilidade = new Set(this.disponabilidadesSalvas.filter(d => d.ativo).map(d => d.diaSemana));
    this.diasSemana.forEach(dia => {
      dia.selecionado = diasComDisponibilidade.has(dia.valor);
    });
    this.gerarCalendarioMes(this.mesAtualReferencia);
    this.cdr.detectChanges();
  }

  diaEstaSelecionado(valor: string): boolean {
    const dia = this.diasSemana.find(d => d.valor === valor);
    return dia ? dia.selecionado : false;
  }

  selecionarDia(valor: string) {
    const dia = this.diasSemana.find(d => d.valor === valor);
    if (dia) {
      this.toggleDiaSemana(dia);
    }
  }

  /**
   * Liga/desliga o dia da semana sem perder os horários cadastrados:
   * desativa os existentes, reativa os desativados ou cria um horário padrão.
   */
  toggleDiaSemana(dia: DiaSemanaItem) {
    if (!this.instrutorId) return;

    const doDia = this.disponabilidadesSalvas.filter(d => d.diaSemana === dia.valor);

    if (doDia.some(d => d.ativo)) {
      doDia.forEach(d => (d.ativo = false));
    } else if (doDia.length > 0) {
      doDia.forEach(d => (d.ativo = true));
    } else {
      this.disponabilidadesSalvas.push({
        instrutorId: this.instrutorId,
        diaSemana: dia.valor,
        horaInicio: '08:00',
        horaFim: '12:00',
        ativo: true
      });
    }

    this.aplicarAlteracaoDisponibilidade();
  }

  private aplicarAlteracaoDisponibilidade() {
    this.disponabilidades = [...this.disponabilidadesSalvas];
    this.alteracoesPendentes = true;
    this.sincronizarBotoesDias();
  }

  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  private existeConflitoHorario(inicio1: string, fim1: string, inicio2: string, fim2: string): boolean {
    const start1 = this.timeToMinutes(inicio1);
    const end1 = this.timeToMinutes(fim1);
    const start2 = this.timeToMinutes(inicio2);
    const end2 = this.timeToMinutes(fim2);

    return start1 < end2 && end1 > start2;
  }

  private existeConflitoDisponibilidade(dia: string, inicio: string, fim: string, ignorarIndice: number | null): boolean {
    return this.disponabilidadesSalvas.some((d, i) =>
      i !== ignorarIndice &&
      d.ativo &&
      d.diaSemana === dia &&
      this.existeConflitoHorario(inicio, fim, d.horaInicio, d.horaFim)
    );
  }

  private formatarTimeParaBackend(hora: string): string {
    if (!hora) return '00:00:00';
    const clean = hora.trim();
    if (clean.length === 5) {
      return `${clean}:00`;
    }
    return clean;
  }

  abrirFormularioDisponibilidade() {
    if (this.mostrarFormularioDisponibilidade) {
      this.cancelarFormularioDisponibilidade();
      return;
    }
    this.indiceEdicao = null;
    this.mostrarFormularioDisponibilidade = true;
    this.mostrarFormularioBloqueio = false;
    this.cdr.detectChanges();
  }

  cancelarFormularioDisponibilidade() {
    this.mostrarFormularioDisponibilidade = false;
    this.indiceEdicao = null;
    this.cdr.detectChanges();
  }

  /** Carrega um horário existente no formulário para edição. */
  editarHorarioCadastrado(index: number) {
    const item = this.disponabilidadesSalvas[index];
    if (!item) return;

    this.indiceEdicao = index;
    this.novoHorarioDia = item.diaSemana;
    this.horaInicio = horaCurta(item.horaInicio);
    this.horaFim = horaCurta(item.horaFim);
    this.mostrarFormularioDisponibilidade = true;
    this.mostrarFormularioBloqueio = false;
    this.cdr.detectChanges();
  }

  /** Cria um novo horário ou atualiza o que está em edição. */
  confirmarAdicionarHorario() {
    if (!this.instrutorId) return;

    if (this.timeToMinutes(this.horaInicio) >= this.timeToMinutes(this.horaFim)) {
      this.toastService.mostrar('A hora de início deve ser anterior à hora de término.', 'erro');
      return;
    }

    const emEdicao = this.indiceEdicao !== null ? this.disponabilidadesSalvas[this.indiceEdicao] : null;
    const ficaAtivo = emEdicao ? emEdicao.ativo : true;

    if (ficaAtivo && this.existeConflitoDisponibilidade(this.novoHorarioDia, this.horaInicio, this.horaFim, this.indiceEdicao)) {
      this.toastService.mostrar('Já existe um horário ativo que entra em conflito neste dia!', 'erro');
      return;
    }

    if (emEdicao) {
      emEdicao.diaSemana = this.novoHorarioDia;
      emEdicao.horaInicio = this.horaInicio;
      emEdicao.horaFim = this.horaFim;
    } else {
      this.disponabilidadesSalvas.push({
        instrutorId: this.instrutorId,
        diaSemana: this.novoHorarioDia,
        horaInicio: this.horaInicio,
        horaFim: this.horaFim,
        ativo: true
      });
    }

    this.indiceEdicao = null;
    this.mostrarFormularioDisponibilidade = false;
    this.aplicarAlteracaoDisponibilidade();
    this.toastService.mostrar(
      emEdicao
        ? 'Horário atualizado! Clique em Salvar Alterações para confirmar.'
        : 'Horário adicionado! Clique em Salvar Alterações para confirmar.',
      'ok'
    );
  }

  /** Ativa ou desativa um horário sem removê-lo. */
  alternarAtivoHorario(index: number) {
    const item = this.disponabilidadesSalvas[index];
    if (!item) return;

    const novoEstado = !item.ativo;
    if (novoEstado && this.existeConflitoDisponibilidade(item.diaSemana, item.horaInicio, item.horaFim, index)) {
      this.toastService.mostrar('Não é possível ativar: há outro horário ativo em conflito neste dia.', 'erro');
      return;
    }

    item.ativo = novoEstado;
    this.aplicarAlteracaoDisponibilidade();
  }

  removerHorarioCadastrado(index: number) {
    if (index < 0 || index >= this.disponabilidadesSalvas.length) return;

    this.disponabilidadesSalvas.splice(index, 1);

    if (this.indiceEdicao === index) {
      this.mostrarFormularioDisponibilidade = false;
      this.indiceEdicao = null;
    } else if (this.indiceEdicao !== null && this.indiceEdicao > index) {
      this.indiceEdicao--;
    }

    this.aplicarAlteracaoDisponibilidade();
  }

  private validarDisponibilidadesLocais(): string | null {
    for (let i = 0; i < this.disponabilidadesSalvas.length; i++) {
      const d = this.disponabilidadesSalvas[i];
      if (this.timeToMinutes(d.horaInicio) >= this.timeToMinutes(d.horaFim)) {
        return `${this.getNomeDia(d.diaSemana)}: a hora de início deve ser anterior à hora de término.`;
      }
      if (d.ativo && this.existeConflitoDisponibilidade(d.diaSemana, d.horaInicio, d.horaFim, i)) {
        return `${this.getNomeDia(d.diaSemana)}: existem horários ativos sobrepostos.`;
      }
    }
    return null;
  }

  salvarAlteracoes() {
    if (!this.instrutorId) return;

    if (!this.alteracoesPendentes) {
      this.toastService.mostrar('Nenhuma alteração para salvar.', 'ok');
      return;
    }

    const erroValidacao = this.validarDisponibilidadesLocais();
    if (erroValidacao) {
      this.toastService.mostrar(erroValidacao, 'erro');
      return;
    }

    this.salvando = true;
    this.cdr.detectChanges();

    const instrutorAtualId = this.instrutorId;
    const payload = this.disponabilidadesSalvas.map(d => ({
      ...d,
      instrutorId: instrutorAtualId,
      horaInicio: this.formatarTimeParaBackend(d.horaInicio),
      horaFim: this.formatarTimeParaBackend(d.horaFim)
    }));

    this.agendaService.salvarDisponibilidades(instrutorAtualId, payload).subscribe({
      next: (res: DisponibilidadeInstrutor[]) => {
        this.aplicarListaDoServidor(res);
        this.alteracoesPendentes = false;
        this.toastService.mostrar('Disponibilidades salvas com sucesso!', 'ok');
        this.salvando = false;
        this.cdr.detectChanges();

        void this.router.navigate(['/instrutor/home']);
      },
      error: (err: any) => {
        console.error('Erro ao salvar disponibilidades:', err);
        this.toastService.mostrar(this.mensagemErro(err, 'Erro ao salvar disponibilidades.'), 'erro');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirFormularioBloqueio() {
    this.mostrarFormularioBloqueio = !this.mostrarFormularioBloqueio;
    this.mostrarFormularioDisponibilidade = false;
    this.indiceEdicao = null;
    this.cdr.detectChanges();
  }

  cadastrarBloqueio() {
    if (!this.instrutorId) return;

    if (!this.novoBloqueioData) {
      this.toastService.mostrar('Informe a data do bloqueio.', 'erro');
      return;
    }

    if (this.novoBloqueioData < this.formatarChaveData(new Date())) {
      this.toastService.mostrar('Não é possível bloquear uma data que já passou.', 'erro');
      return;
    }

    if (this.timeToMinutes(this.horaBloqueioInicio) >= this.timeToMinutes(this.horaBloqueioFim)) {
      this.toastService.mostrar('A hora de início do bloqueio deve ser anterior à hora de fim.', 'erro');
      return;
    }

    const conflitoBloqueio = this.bloqueios.some(b =>
      b.data === this.novoBloqueioData &&
      this.existeConflitoHorario(this.horaBloqueioInicio, this.horaBloqueioFim, b.horaInicio, b.horaFim)
    );
    if (conflitoBloqueio) {
      this.toastService.mostrar('Já existe um bloqueio agendado que entra em conflito nesta mesma data!', 'erro');
      return;
    }

    const conflitoAula = this.aulasInstrutor.some(a =>
      a.status === 'AGENDADA' &&
      this.dataDaAula(a) === this.novoBloqueioData &&
      this.existeConflitoHorario(
        this.horaBloqueioInicio,
        this.horaBloqueioFim,
        this.horaInicioDaAula(a),
        horaCurta(a.horaFim) || this.somarUmaHora(this.horaInicioDaAula(a))
      )
    );
    if (conflitoAula) {
      this.toastService.mostrar('Há uma aula agendada nesse período. Cancele ou reagende a aula antes de bloquear.', 'erro');
      return;
    }

    this.bloqueando = true;
    this.cdr.detectChanges();

    const novoBloqueio: BloqueioAgenda = {
      instrutorId: this.instrutorId,
      data: this.novoBloqueioData,
      horaInicio: this.formatarTimeParaBackend(this.horaBloqueioInicio),
      horaFim: this.formatarTimeParaBackend(this.horaBloqueioFim),
      motivo: this.motivoBloqueio
    };

    this.agendaService.criarBloqueio(this.instrutorId, novoBloqueio).subscribe({
      next: () => {
        this.toastService.mostrar('Horário bloqueado com sucesso!', 'ok');
        this.bloqueando = false;
        this.mostrarFormularioBloqueio = false;
        this.carregarBloqueios();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao criar bloqueio:', err);
        this.toastService.mostrar(this.mensagemErro(err, 'Erro ao criar bloqueio no servidor.'), 'erro');
        this.bloqueando = false;
        this.cdr.detectChanges();
      }
    });
  }

  removerBloqueio(id?: number) {
    if (!id) return;
    if (!window.confirm('Deseja remover este bloqueio? O horário voltará a ficar disponível para reservas.')) return;

    this.agendaService.removerBloqueio(id).subscribe({
      next: () => {
        this.toastService.mostrar('Bloqueio removido com sucesso!', 'ok');
        this.carregarBloqueios();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao remover bloqueio:', err);
        this.toastService.mostrar(this.mensagemErro(err, 'Erro ao remover bloqueio.'), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  getNomeDia(key: string): string {
    return this.mapaDias[key] || key;
  }

  private somarUmaHora(hora: string): string {
    const minutos = this.timeToMinutes(hora) + 60;
    const h = Math.min(Math.floor(minutos / 60), 23);
    const m = minutos >= 24 * 60 ? 59 : minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private mensagemErro(err: any, padrao: string): string {
    const corpo = err?.error;
    if (typeof corpo === 'string' && corpo.trim() && corpo.length < 200) {
      return corpo;
    }
    return corpo?.message || corpo?.erro || corpo?.mensagem || padrao;
  }
}