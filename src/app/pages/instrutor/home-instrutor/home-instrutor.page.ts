import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  ellipsisVertical,
  calendarOutline,
  star,
  chevronForwardOutline,
  chevronBackOutline,
  chevronDownOutline,
  expandOutline,
  contractOutline,
  createOutline,
  trashOutline,
  personOutline,
  checkmarkCircleOutline,
  easelOutline,
  walletOutline,
  logOutOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
import { ToastService } from '../../../core/services/toast.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

interface DiaCalendario {
  data: Date;
  chave: string;
  iso: string;
  nome: string;
  nomeMaiusculo: string;
  numero: number;
  noMesAtual: boolean;
}

interface Aula {
  id: number;
  data: Date;
  hora: string;
  titulo: string;
  aluno: string;
  valor: number;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
}

const SEMANA_CURTA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const CABECALHO_SEG_DOM = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const CABECALHO_EXPANDIDO_SEG_DOM = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];
const DIAS_SEMANA_LONGO = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function zerarHora(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function somarDias(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

function inicioSemanaSeg(data: Date): Date {
  const d = zerarHora(data);
  const diaSemana = d.getDay();
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  return somarDias(d, diffParaSegunda);
}

function obterNumeroSemanaISO(data: Date): number {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaNum);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - inicioAno.getTime()) / 86400000) + 1) / 7);
}

function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isoDia(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

@Component({
  selector: 'app-home-instrutor',
  templateUrl: './home-instrutor.page.html',
  styleUrls: ['./home-instrutor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class HomeInstrutorPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);

  nomeInstrutor = '';
  emailInstrutor = '';
  fotoUrl = '';
  temFoto = false;
  temNotificacao = true;

  perfilMenuAberto = false;

  hoje = zerarHora(new Date());
  selecionado = this.hoje;
  inicioSemanaAtual = inicioSemanaSeg(this.hoje);
  mesReferenciaExpandido = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1);
  expandido = false;

  cabecalhoSemana = CABECALHO_SEG_DOM;
  cabecalhoSemanaExpandido = CABECALHO_EXPANDIDO_SEG_DOM;
  diasSemana: DiaCalendario[] = [];
  diasMesExpandido: DiaCalendario[] = [];

  resumo = { titulo: 'Hoje', quantidade: 0, previstos: 0 };
  mini = { alunos: 0, pendentes: 0, media: 5.0 };
  aulas: Aula[] = [];
  proximasAulas: Aula[] = [];
  diasComAula = new Set<string>();
  menuAbertoId: number | null = null;
  processandoAcao = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    addIcons({
      notificationsOutline,
      ellipsisVertical,
      calendarOutline,
      star,
      chevronForwardOutline,
      chevronBackOutline,
      chevronDownOutline,
      expandOutline,
      contractOutline,
      createOutline,
      trashOutline,
      personOutline,
      checkmarkCircleOutline,
      easelOutline,
      walletOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.atualizarCalendario();
    this.carregarDadosInstrutor();
  }

  ionViewWillEnter() {
    this.carregarUsuario();
    this.carregarDadosInstrutor();
  }

  get mediaTexto(): string {
    return this.mini.media.toFixed(1).replace('.', ',');
  }

  get iniciaisInstrutor(): string {
    const base = (this.nomeInstrutor || 'IN').trim();
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }

  get totalAvaliacoes(): number {
    const u: any = this.auth.usuario();
    return Number(u?.totalAvaliacoes ?? u?.quantidadeAvaliacoes ?? 0);
  }

  get totalAulasDadas(): number {
    return this.aulas.filter(a => a.status === 'Concluída').length;
  }

  get saldoDisponivel(): string {
    const valor = this.aulas
      .filter(a => a.status === 'Concluída')
      .reduce((acc, aula) => acc + aula.valor, 0);
    return valor.toFixed(2).replace('.', ',');
  }

  get selecionadoChave(): string {
    return chaveDia(this.selecionado);
  }

  get hojeSelecionado(): boolean {
    return this.selecionadoChave === chaveDia(this.hoje);
  }

  get diaSelecionadoNome(): string {
    return DIAS_SEMANA_LONGO[this.selecionado.getDay()];
  }

  get numeroSemana(): number {
    return obterNumeroSemanaISO(this.inicioSemanaAtual);
  }

  get mesAnoExibido(): string {
    const ref = this.expandido ? this.mesReferenciaExpandido : this.inicioSemanaAtual;
    return `${MESES_LONGOS[ref.getMonth()]} ${ref.getFullYear()}`;
  }

  get tituloMesExpandido(): string {
    return `${MESES_LONGOS[this.mesReferenciaExpandido.getMonth()]} ${this.mesReferenciaExpandido.getFullYear()}`;
  }

  /* MENU DO PERFIL (CLIQUE) */

  togglePerfilMenu(ev?: Event) {
    ev?.stopPropagation();
    this.perfilMenuAberto = !this.perfilMenuAberto;
  }

  fecharPerfilMenu() {
    this.perfilMenuAberto = false;
  }

  irParaAvaliacoesPerfil() {
    this.fecharPerfilMenu();
    void this.router.navigateByUrl('/perfil');
  }

  irParaAulasDadas() {
    this.fecharPerfilMenu();
    void this.router.navigateByUrl('/instrutor/progresso-instrutor');
  }

  irParaMeuPerfil() {
    this.fecharPerfilMenu();
    void this.router.navigateByUrl('/perfil');
  }

  sairConta() {
    this.fecharPerfilMenu();
    if (typeof (this.auth as any).logout === 'function') {
      (this.auth as any).logout();
    }
    void this.router.navigateByUrl('/login');
  }

  private carregarUsuario() {
    const u: any = this.auth.usuario();
    this.nomeInstrutor = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';
    this.emailInstrutor = u?.email ?? u?.correo ?? '';

    const raw = u?.fotoUrl || u?.foto || '';
    if (raw) {
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
        this.fotoUrl = raw;
      } else {
        const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
        this.fotoUrl = raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
      }
      this.temFoto = true;
    } else {
      this.fotoUrl = '';
      this.temFoto = false;
    }
  }

  private carregarDadosInstrutor() {
    const instrutorId = Number(this.auth.usuario()?.id);
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) return;

    // 1. Todas as aulas para o calendário (bolinhas verdes) e resumo do dia
    this.aulaService.historicoInstrutor(instrutorId).subscribe({
      next: (lista) => {
        this.aulas = (lista || []).map(item => this.mapearAula(item));
        const datas = new Set<string>();
        for (const item of lista || []) {
          if (item.status === 'CANCELADA') continue;
          const iso = item.dataAula || (item.dataHora ? item.dataHora.slice(0, 10) : '');
          if (iso) datas.add(iso);
        }
        this.diasComAula = datas;
        this.atualizarResumo();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar aulas do instrutor:', err)
    });

    // 2. Próximas 3 aulas agendadas
    this.aulaService.proximasInstrutor(instrutorId, 3).subscribe({
      next: (lista) => {
        this.proximasAulas = (lista || []).slice(0, 3).map(item => this.mapearAula(item));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar próximas aulas:', err)
    });

    // 3. Resumo geral
    this.aulaService.resumoInstrutor(instrutorId).subscribe({
      next: (res) => {
        this.mini = {
          alunos: res.totalAlunos ?? 0,
          pendentes: res.pedidosPendentes ?? 0,
          media: res.mediaAvaliacoes ?? 5.0
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar resumo do instrutor:', err)
    });
  }

  private mapearAula(item: AulaHistoricoApi): Aula {
    const dataIso = item.dataHora || (item.dataAula ? `${item.dataAula}T${item.horaInicio || '00:00:00'}` : '');
    const dataObj = dataIso ? new Date(dataIso) : new Date();
    const horaTxt = item.horaInicio ? item.horaInicio.slice(0, 5) : dataIso.slice(11, 16);

    let statusFormatado: 'Agendada' | 'Concluída' | 'Cancelada' = 'Agendada';
    if (item.status === 'CONCLUIDA') statusFormatado = 'Concluída';
    if (item.status === 'CANCELADA') statusFormatado = 'Cancelada';

    return {
      id: item.id,
      data: dataObj,
      hora: horaTxt || '08:00',
      titulo: horaTxt ? `${item.titulo} (${horaTxt})` : item.titulo,
      aluno: item.alunoNome || item.nomeOutraPessoa || 'Aluno',
      valor: 120,
      status: statusFormatado
    };
  }

  onImgError(event: Event) {
    this.temFoto = false;
    (event.target as HTMLImageElement).style.display = 'none';
  }

  /* CALENDÁRIO */

  private construirDia(data: Date, mesBase: number): DiaCalendario {
    const d = zerarHora(data);
    const idxSemana = d.getDay();
    return {
      data: d,
      chave: chaveDia(d),
      iso: isoDia(d),
      nome: SEMANA_CURTA[idxSemana],
      nomeMaiusculo: CABECALHO_SEG_DOM[idxSemana === 0 ? 6 : idxSemana - 1],
      numero: d.getDate(),
      noMesAtual: d.getMonth() === mesBase
    };
  }

  private atualizarCalendario() {
    const mesBase = this.inicioSemanaAtual.getMonth();
    this.diasSemana = Array.from({ length: 7 }, (_, i) =>
      this.construirDia(somarDias(this.inicioSemanaAtual, i), mesBase)
    );

    if (this.expandido) {
      this.diasMesExpandido = this.gerarGradeMes(this.mesReferenciaExpandido);
    }
  }

  private gerarGradeMes(mesRef: Date): DiaCalendario[] {
    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const primeiroDiaMes = new Date(ano, mes, 1);
    const inicioGrade = inicioSemanaSeg(primeiroDiaMes);

    return Array.from({ length: 42 }, (_, i) =>
      this.construirDia(somarDias(inicioGrade, i), mes)
    );
  }

  trackDia(_: number, d: DiaCalendario) {
    return d.chave;
  }

  diaTemAula(dia: DiaCalendario): boolean {
    return this.diasComAula.has(dia.iso);
  }

  semanaAnterior() {
    this.inicioSemanaAtual = somarDias(this.inicioSemanaAtual, -7);
    this.mesReferenciaExpandido = new Date(
      this.inicioSemanaAtual.getFullYear(),
      this.inicioSemanaAtual.getMonth(),
      1
    );
    this.atualizarCalendario();
  }

  proximaSemana() {
    this.inicioSemanaAtual = somarDias(this.inicioSemanaAtual, 7);
    this.mesReferenciaExpandido = new Date(
      this.inicioSemanaAtual.getFullYear(),
      this.inicioSemanaAtual.getMonth(),
      1
    );
    this.atualizarCalendario();
  }

  mesAnterior() {
    this.mesReferenciaExpandido = new Date(
      this.mesReferenciaExpandido.getFullYear(),
      this.mesReferenciaExpandido.getMonth() - 1,
      1
    );
    this.diasMesExpandido = this.gerarGradeMes(this.mesReferenciaExpandido);
  }

  proximoMes() {
    this.mesReferenciaExpandido = new Date(
      this.mesReferenciaExpandido.getFullYear(),
      this.mesReferenciaExpandido.getMonth() + 1,
      1
    );
    this.diasMesExpandido = this.gerarGradeMes(this.mesReferenciaExpandido);
  }

  alternarExpandir() {
    this.expandido = !this.expandido;
    if (this.expandido) {
      this.mesReferenciaExpandido = new Date(
        this.selecionado.getFullYear(),
        this.selecionado.getMonth(),
        1
      );
      this.diasMesExpandido = this.gerarGradeMes(this.mesReferenciaExpandido);
    } else {
      this.inicioSemanaAtual = inicioSemanaSeg(this.selecionado);
      this.atualizarCalendario();
    }
  }

  selecionarDia(dia: DiaCalendario) {
    this.selecionado = dia.data;
    this.inicioSemanaAtual = inicioSemanaSeg(dia.data);
    this.mesReferenciaExpandido = new Date(dia.data.getFullYear(), dia.data.getMonth(), 1);
    this.atualizarCalendario();
    this.atualizarResumo();
    if (this.diaTemAula(dia)) {
      void this.router.navigate(['/instrutor/calendario'], {
        queryParams: { data: dia.iso }
      });
    }
  }

  irParaHoje() {
    this.selecionado = this.hoje;
    this.inicioSemanaAtual = inicioSemanaSeg(this.hoje);
    this.mesReferenciaExpandido = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1);
    this.atualizarCalendario();
    this.atualizarResumo();
  }

  /* RESUMO / AULAS */

  private atualizarResumo() {
    const chave = chaveDia(this.selecionado);
    const doDia = this.aulas.filter(
      a => chaveDia(a.data) === chave && a.status !== 'Cancelada'
    );

    let titulo: string;
    if (chave === chaveDia(this.hoje)) {
      titulo = 'Hoje';
    } else if (chave === chaveDia(somarDias(this.hoje, 1))) {
      titulo = 'Amanhã';
    } else if (chave === chaveDia(somarDias(this.hoje, -1))) {
      titulo = 'Ontem';
    } else {
      const d = this.selecionado;
      titulo = `${SEMANA_CURTA[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
    }

    this.resumo = {
      titulo,
      quantidade: doDia.length,
      previstos: doDia.reduce((total, a) => total + a.valor, 0)
    };
  }

  formatarData(d: Date): string {
    return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`;
  }

  abrirDetalhesAula(aula: Aula) {
    this.fecharMenu();
    void this.router.navigate(['/instrutor/detalhe-aula'], {
      queryParams: { id: aula.id }
    });
  }

  /* POPOVER CONCLUIR / CANCELAR */

  toggleMenu(aula: Aula, ev?: Event) {
    ev?.stopPropagation();
    this.menuAbertoId = this.menuAbertoId === aula.id ? null : aula.id;
  }

  fecharMenu() {
    this.menuAbertoId = null;
  }

  editarAula(aula: Aula, ev?: Event) {
    ev?.stopPropagation();
    this.fecharMenu();
    if (this.processandoAcao) return;
    if (!window.confirm(`Confirmar conclusão da aula de ${aula.aluno}?`)) return;

    this.processandoAcao = true;
    this.aulaService.concluirAula(aula.id).subscribe({
      next: () => {
        this.processandoAcao = false;
        void this.toastService.mostrar('Aula marcada como concluída!', 'ok');
        this.carregarDadosInstrutor();
      },
      error: (err) => {
        this.processandoAcao = false;
        const msg = err?.error?.message || 'Não foi possível concluir a aula.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }

  deletarAula(aula: Aula, ev?: Event) {
    ev?.stopPropagation();
    this.fecharMenu();
    if (this.processandoAcao) return;
    if (!window.confirm(`Tem certeza que deseja cancelar a aula de ${aula.aluno}?`)) return;

    this.processandoAcao = true;
    this.aulaService.cancelarAula(aula.id).subscribe({
      next: () => {
        this.processandoAcao = false;
        void this.toastService.mostrar('Aula cancelada com sucesso.', 'ok');
        this.carregarDadosInstrutor();
      },
      error: (err) => {
        this.processandoAcao = false;
        const msg = err?.error?.message || 'Não foi possível cancelar a aula.';
        void this.toastService.mostrar(msg, 'erro');
      }
    });
  }

  /* ATALHOS / NOTIFICAÇÕES */

  abrirAtalho(rota: string) {
    this.router.navigateByUrl(rota);
  }

  abrirNotificacoes() {
    this.temNotificacao = false;
    this.router.navigateByUrl('/notificacoes');
  }
}