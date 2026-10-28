import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
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
  calendarNumberOutline,
  homeOutline,
  home,
  chevronForwardOutline,
  chevronDownOutline,
  personOutline,
  trendingUp,
  createOutline,
  trashOutline,
  logOutOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

/* Tipos */
interface DiaCalendario {
  data: Date;
  chave: string;
  nome: string;
  numero: number;
}

interface Aula {
  id: number;
  data: Date;
  titulo: string;
  status: 'Completa' | 'Incompleta';
}

interface ItemMenu {
  id: string;
  label: string;
  icone: string;
  rota: string;
}

type Filtro = 'todas' | 'completa' | 'incompleta';

/* Constantes */
const ITEM_W = 50; // largura (px) de cada dia no calendário. Tem que ser igual no SCSS
const LOTE = 30; // quantos dias carrega por vez ao chegar nas pontas

const SEMANA_CURTA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/* Funções de data */
function zerarHora(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function somarDias(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

@Component({
  selector: 'app-home-aluno',
  templateUrl: './home-aluno.page.html',
  styleUrls: ['./home-aluno.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeAlunoPage implements OnInit, AfterViewInit {
  @ViewChild('calendario') calendario!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);

  /* Usuário logado */
  nomeAluno = '';
  temNotificacao = true;

  /* Calendário */
  hoje = zerarHora(new Date());
  selecionado = this.hoje;
  dias: DiaCalendario[] = [];
  mesAno = '';

  /* Progresso (trocar por dados do back-end depois) */
  progresso = { categoria: 'Categoria B', realizadas: 6, total: 10 };

  /* Aulas (trocar por dados do back-end depois) */
  aulas: Aula[] = [];

  /* Filtro */
  filtro: Filtro = 'todas';
  filtroAberto = false;
  opcoesFiltro: { id: Filtro; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'completa', label: 'Completas' },
    { id: 'incompleta', label: 'Incompletas' }
  ];

  /* Popover Editar / Deletar */
  menuAbertoId: string | null = null;

  /* Cartão do perfil (botão sair) */
  perfilAberto = false;

  /* Menu inferior (rotas reais do app.routes.ts) */
  menu: ItemMenu[] = [
    { id: 'inicio', label: 'INÍCIO', icone: 'home-outline', rota: '/aluno/home' },
    { id: 'agenda', label: 'AGENDA', icone: 'calendar-number-outline', rota: '/aluno/agendamento-aulas' },
    { id: 'progresso', label: 'PROGRESSO', icone: 'trending-up', rota: '/aluno/historico-avaliacoes' },
    { id: 'perfil', label: 'PERFIL', icone: 'person-outline', rota: '/perfil' }
  ];
  menuAtivo = 'inicio';

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    addIcons({
      notificationsOutline,
      ellipsisVertical,
      calendarOutline,
      calendarNumberOutline,
      homeOutline,
      home,
      chevronForwardOutline,
      chevronDownOutline,
      personOutline,
      trendingUp,
      createOutline,
      trashOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.aulas = this.gerarAulasExemplo();
    // começa com 30 dias antes e 60 dias depois de hoje
    this.dias = this.gerarFaixa(somarDias(this.hoje, -LOTE), LOTE + 60);
  }

  /** Roda toda vez que a página é aberta */
  ionViewWillEnter() {
    this.carregarUsuario();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rolarParaDia(this.hoje, false);
      this.atualizarMes();
    });
  }

  /** Pega o nome de quem logou direto do AuthService */
  private carregarUsuario() {
    const u: any = this.auth.usuario();
    this.nomeAluno = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';

    if (!this.nomeAluno) {
      console.warn('Usuário logado sem campo de nome:', u);
    }
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

  private gerarFaixa(inicio: Date, quantidade: number): DiaCalendario[] {
    const lista: DiaCalendario[] = [];
    for (let i = 0; i < quantidade; i++) {
      const data = somarDias(inicio, i);
      lista.push({
        data,
        chave: chaveDia(data),
        nome: SEMANA_CURTA[data.getDay()],
        numero: data.getDate()
      });
    }
    return lista;
  }

  trackDia(_: number, d: DiaCalendario) {
    return d.chave;
  }

  get selecionadoChave(): string {
    return chaveDia(this.selecionado);
  }

  get hojeSelecionado(): boolean {
    return this.selecionadoChave === chaveDia(this.hoje);
  }

  /** Chamado a cada rolagem: carrega mais dias nas pontas e atualiza o mês */
  onScroll() {
    const el = this.calendario.nativeElement;
    const margem = ITEM_W * 5;

    if (el.scrollLeft < margem) {
      this.carregarAntes();
    } else if (el.scrollLeft + el.clientWidth > el.scrollWidth - margem) {
      this.carregarDepois();
    }
    this.atualizarMes();
  }

  private carregarAntes() {
    const el = this.calendario.nativeElement;
    const inicio = somarDias(this.dias[0].data, -LOTE);
    this.dias = [...this.gerarFaixa(inicio, LOTE), ...this.dias];
    this.cdr.detectChanges();
    el.scrollLeft += LOTE * ITEM_W;
  }

  private carregarDepois() {
    const ultimo = this.dias[this.dias.length - 1].data;
    this.dias = [...this.dias, ...this.gerarFaixa(somarDias(ultimo, 1), LOTE)];
  }

  private atualizarMes() {
    const el = this.calendario?.nativeElement;
    if (!el || !this.dias.length) return;
    const meio = Math.round(el.scrollLeft / ITEM_W) + 3;
    const idx = Math.min(this.dias.length - 1, Math.max(0, meio));
    const d = this.dias[idx].data;
    this.mesAno = `${MESES_LONGOS[d.getMonth()]} ${d.getFullYear()}`;
  }

  private rolarParaDia(data: Date, suave = true) {
    const idx = this.dias.findIndex(d => d.chave === chaveDia(data));
    if (idx < 0) return;
    this.calendario.nativeElement.scrollTo({
      left: idx * ITEM_W,
      behavior: suave ? 'smooth' : 'auto'
    });
  }

  selecionarDia(dia: DiaCalendario) {
    this.selecionado = dia.data;
  }

  irParaHoje() {
    this.selecionado = this.hoje;
    this.rolarParaDia(this.hoje, true);
  }

  /* AULAS */

  /** Card "Próxima Aula": a primeira aula da lista */
  get proximaAula(): Aula | null {
    return this.aulas.length ? this.aulas[0] : null;
  }

  get aulasFiltradas(): Aula[] {
    if (this.filtro === 'todas') return this.aulas;
    const alvo = this.filtro === 'completa' ? 'Completa' : 'Incompleta';
    return this.aulas.filter(a => a.status === alvo);
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

  /* FILTRO */

  toggleFiltro() {
    this.menuAbertoId = null;
    this.filtroAberto = !this.filtroAberto;
  }

  escolherFiltro(f: Filtro) {
    this.filtro = f;
    this.filtroAberto = false;
  }

  /* POPOVER EDITAR / DELETAR */

  toggleMenu(chave: string) {
    this.filtroAberto = false;
    this.menuAbertoId = this.menuAbertoId === chave ? null : chave;
  }

  /** Fecha qualquer popover aberto (menu da aula e filtro) */
  fecharMenu() {
    this.menuAbertoId = null;
    this.filtroAberto = false;
  }

  get algoAberto(): boolean {
    return this.menuAbertoId !== null || this.filtroAberto;
  }

  editarAula(aula: Aula) {
    this.fecharMenu();
    console.log('Editar', aula);
  }

  deletarAula(aula: Aula) {
    this.fecharMenu();
    this.aulas = this.aulas.filter(a => a.id !== aula.id);
  }

  /* NAVEGAÇÃO / PERFIL */

  irPara(item: ItemMenu) {
    this.fecharMenu();

    // PERFIL: abre/fecha o cartão com o botão de sair
    if (item.id === 'perfil') {
      this.perfilAberto = !this.perfilAberto;
      return;
    }

    this.perfilAberto = false;
    if (item.id === this.menuAtivo) return;

    this.router.navigateByUrl(item.rota);
  }

  fecharPerfil() {
    this.perfilAberto = false;
  }

  /** Botão de teste: encerra a sessão pelo AuthService e volta ao login */
  sairDaConta() {
    this.perfilAberto = false;
    this.auth.logout(); // limpa o signal, o localStorage e navega para /login
  }

  abrirAtalho(rota: string) {
    this.router.navigateByUrl(rota);
  }

  abrirNotificacoes() {
    this.temNotificacao = false;
  }

  /* DADOS DE EXEMPLO */

  private gerarAulasExemplo(): Aula[] {
    return [
      { id: 1, data: new Date(2021, 11, 10), titulo: 'Aula Prática - Categoria B', status: 'Completa' },
      { id: 2, data: new Date(2026, 0, 22), titulo: 'Aula Prática - Categoria A', status: 'Incompleta' }
    ];
  }
}