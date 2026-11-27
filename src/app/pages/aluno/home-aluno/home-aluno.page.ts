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
  chevronForwardOutline,
  chevronDownOutline,
  chevronBackOutline,
  expandOutline,
  contractOutline,
  createOutline,
  trashOutline,
  personOutline,
  timeOutline,
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
  titulo: string;
  status: 'Completa' | 'Incompleta';
}

type Filtro = 'todas' | 'completa' | 'incompleta';

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
  selector: 'app-home-aluno',
  templateUrl: './home-aluno.page.html',
  styleUrls: ['./home-aluno.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class HomeAlunoPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);

  nomeAluno = '';
  emailAluno = '';
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

  progresso = { categoria: 'Categoria B', realizadas: 0, total: 0 };

  aulas: Aula[] = [];
  diasComAula = new Set<string>();

  filtro: Filtro = 'todas';
  filtroAberto = false;
  opcoesFiltro: { id: Filtro; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'completa', label: 'Completas' },
    { id: 'incompleta', label: 'Incompletas' }
  ];

  menuAbertoId: string | null = null;
  cancelando = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    addIcons({
      notificationsOutline,
      ellipsisVertical,
      calendarOutline,
      chevronForwardOutline,
      chevronDownOutline,
      chevronBackOutline,
      expandOutline,
      contractOutline,
      createOutline,
      trashOutline,
      personOutline,
      timeOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.atualizarCalendario();
    this.carregarDadosAluno();
  }

  ionViewWillEnter() {
    this.carregarUsuario();
    this.carregarDadosAluno();
    this.auth.buscarDoBanco().subscribe({
      next: () => {
        this.carregarUsuario();
        this.carregarDadosAluno();
      },
      error: (err) => console.error('Erro ao recarregar usuário na home:', err)
    });
  }

  get iniciaisAluno(): string {
    const base = (this.nomeAluno || 'AL').trim();
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }

  /* MENU DO PERFIL (CLIQUE) */

  togglePerfilMenu(ev?: Event) {
    ev?.stopPropagation();
    this.fecharMenu();
    this.perfilMenuAberto = !this.perfilMenuAberto;
  }

  fecharPerfilMenu() {
    this.perfilMenuAberto = false;
  }

  irParaAgendaAulas() {
    this.fecharPerfilMenu();
    void this.router.navigateByUrl('/aluno/calendario');
  }

  irParaHistorico() {
    this.fecharPerfilMenu();
    void this.router.navigateByUrl('/aluno/historico-aula');
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
    this.nomeAluno = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';
    this.emailAluno = u?.email ?? u?.correo ?? '';
    if (u?.categoriaPretendida) {
      this.progresso.categoria = `Categoria ${u.categoriaPretendida}`;
    }

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

  private carregarDadosAluno() {
    const usuarioLogado: any = this.auth.usuario();
    const alunoId = Number(usuarioLogado?.id || usuarioLogado?.usuarioId);

    if (!Number.isInteger(alunoId) || alunoId <= 0) return;

    // 1. Próximas 3 aulas para os cards
    this.aulaService.proximasAluno(alunoId, 3).subscribe({
      next: (lista) => {
        this.aulas = (lista || []).slice(0, 3).map(item => this.mapearAula(item));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar próximas aulas:', err)
    });

    // 2. Histórico completo para calcular o progresso localmente sem dependência de rotas extras
    this.aulaService.historicoAluno(alunoId).subscribe({
      next: (todas) => {
        const listaValida = (todas || []).filter(item => item.status !== 'CANCELADA');
        const datas = new Set<string>();

        for (const item of listaValida) {
          const iso = item.dataAula || (item.dataHora ? item.dataHora.slice(0, 10) : '');
          if (iso) datas.add(iso);
        }
        this.diasComAula = datas;

        const concluidas = listaValida.filter(item => item.status === 'CONCLUIDA').length;
        const total = listaValida.length;
        const cat = listaValida[0]?.categoria;

        this.progresso = {
          categoria: cat ? `Categoria ${cat}` : this.progresso.categoria,
          realizadas: concluidas,
          total: total > 0 ? total : 10
        };

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar histórico:', err)
    });
  }

  private mapearAula(item: AulaHistoricoApi): Aula {
    const dataIso = item.dataHora || (item.dataAula ? `${item.dataAula}T${item.horaInicio || '00:00:00'}` : '');
    const dataObj = dataIso ? new Date(dataIso) : new Date();
    const horaTxt = item.horaInicio ? item.horaInicio.slice(0, 5) : dataIso.slice(11, 16);

    return {
      id: item.id,
      data: dataObj,
      titulo: horaTxt ? `${item.titulo} (${horaTxt})` : item.titulo,
      status: item.status === 'CONCLUIDA' ? 'Completa' : 'Incompleta'
    };
  }

  onImgError(event: Event) {
    this.temFoto = false;
    (event.target as HTMLImageElement).style.display = 'none';
  }

  /* PROGRESSO */

  get pendentes(): number {
    return Math.max(0, this.progresso.total - this.progresso.realizadas);
  }

  get porcentagem(): number {
    if (!this.progresso.total) return 0;
    return Math.min(100, (this.progresso.realizadas / this.progresso.total) * 100);
  }

  /* CALENDÁRIO */

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

  private construirDia(data: Date, mesBase: number): DiaCalendario {
    const d = zerarHora(data);
    const idxSemana = d.getDay();
    return {
      data: d,
      chave: chaveDia(d),
      iso: isoDia(d),
      nome: CABECALHO_SEG_DOM[idxSemana === 0 ? 6 : idxSemana - 1],
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
    if (this.diaTemAula(dia)) {
      void this.router.navigate(['/aluno/calendario'], {
        queryParams: { data: dia.iso }
      });
    }
  }

  irParaHoje() {
    this.selecionado = this.hoje;
    this.inicioSemanaAtual = inicioSemanaSeg(this.hoje);
    this.mesReferenciaExpandido = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1);
    this.atualizarCalendario();
  }

  /* AULAS */

  get proximaAula(): Aula | null {
    return this.aulas.length ? this.aulas[0] : null;
  }

  get aulasFiltradas(): Aula[] {
    const base = this.aulas.slice(0, 3);
    if (this.filtro === 'todas') return base;
    const alvo = this.filtro === 'completa' ? 'Completa' : 'Incompleta';
    return base.filter(a => a.status === alvo);
  }

  get filtroTexto(): string {
    return this.filtro === 'todas'
      ? 'Filtro'
      : this.opcoesFiltro.find(o => o.id === this.filtro)!.label;
  }

  formatarData(d: Date): string {
    return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`;
  }

  trackAula(_: number, a: Aula) {
    return a.id;
  }

  abrirDetalhesAula(aula: Aula) {
    this.fecharMenu();
    void this.router.navigate(['/aluno/detalhe-aula'], {
      queryParams: { id: aula.id }
    });
  }

  /* FILTRO */

  toggleFiltro() {
    this.menuAbertoId = null;
    this.perfilMenuAberto = false;
    this.filtroAberto = !this.filtroAberto;
  }

  escolherFiltro(f: Filtro) {
    this.filtro = f;
    this.filtroAberto = false;
  }

  /* POPOVER DETALHES / CANCELAR */

  toggleMenu(chave: string, ev?: Event) {
    ev?.stopPropagation();
    this.filtroAberto = false;
    this.perfilMenuAberto = false;
    this.menuAbertoId = this.menuAbertoId === chave ? null : chave;
  }

  fecharMenu() {
    this.menuAbertoId = null;
    this.filtroAberto = false;
  }

  get algoAberto(): boolean {
    return this.menuAbertoId !== null || this.filtroAberto;
  }

  editarAula(aula: Aula, ev?: Event) {
    ev?.stopPropagation();
    this.abrirDetalhesAula(aula);
  }

  deletarAula(aula: Aula, ev?: Event) {
    ev?.stopPropagation();
    this.fecharMenu();
    if (this.cancelando) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta aula?')) return;

    this.cancelando = true;
    this.aulaService.cancelarAula(aula.id).subscribe({
      next: () => {
        this.cancelando = false;
        void this.toastService.mostrar('Aula cancelada com sucesso.', 'ok');
        this.carregarDadosAluno();
      },
      error: (err) => {
        this.cancelando = false;
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