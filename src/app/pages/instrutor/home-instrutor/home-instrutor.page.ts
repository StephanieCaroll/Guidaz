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
  star,
  chevronForwardOutline,
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
  hora: string;
  titulo: string;
  aluno: string;
  valor: number;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
}

interface ItemMenu {
  id: string;
  label: string;
  icone: string;
  rota: string;
}

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
  selector: 'app-home-instrutor',
  templateUrl: './home-instrutor.page.html',
  styleUrls: ['./home-instrutor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeInstrutorPage implements OnInit, AfterViewInit {
  @ViewChild('calendario') calendario!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);

  nomeInstrutor = '';
  temNotificacao = true;
  hoje = zerarHora(new Date());
  selecionado = this.hoje;
  dias: DiaCalendario[] = [];
  mesAno = '';
  resumo = { titulo: 'Hoje', quantidade: 0, previstos: 0 };
  mini = { alunos: 18, pendentes: 3, media: 4.9 };
  aulas: Aula[] = [];
  proximasAulas: Aula[] = [];
  menuAbertoId: number | null = null;
  perfilAberto = false;

  menu: ItemMenu[] = [
    { id: 'inicio', label: 'INÍCIO', icone: 'home-outline', rota: '/instrutor/home' },
    { id: 'agenda', label: 'AGENDA', icone: 'calendar-number-outline', rota: '/instrutor/agenda-disponibilidade' },
    { id: 'progresso', label: 'PROGRESSO', icone: 'trending-up', rota: '/instrutor/gestao-alunos' },
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
      star,
      chevronForwardOutline,
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
    this.atualizarResumo();
    this.atualizarProximas();
  }

  /** Roda toda vez que a página é aberta */
  ionViewWillEnter() {
    this.carregarUsuario();
  }

  ngAfterViewInit() {
    // posiciona o calendário de forma que "hoje" fique no começo
    setTimeout(() => {
      this.rolarParaDia(this.hoje, false);
      this.atualizarMes();
    });
  }

  /* Média com vírgula (4,9) sem depender de locale */
  get mediaTexto(): string {
    return this.mini.media.toFixed(1).replace('.', ',');
  }

  /** Pega o nome de quem logou direto do AuthService */
  private carregarUsuario() {
    const u: any = this.auth.usuario();
    this.nomeInstrutor = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';

    if (!this.nomeInstrutor) {
      console.warn('Usuário logado sem campo de nome:', u);
    }
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
    // compensa a rolagem para a tela não "pular"
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
    this.atualizarResumo();
  }

  irParaHoje() {
    this.selecionado = this.hoje;
    this.atualizarResumo();
    this.rolarParaDia(this.hoje, true);
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

  private atualizarProximas() {
    this.proximasAulas = this.aulas
      .filter(a => a.status === 'Agendada' && a.data >= this.hoje)
      .sort((a, b) => a.data.getTime() - b.data.getTime() || a.hora.localeCompare(b.hora))
      .slice(0, 2);
  }

  formatarData(d: Date): string {
    return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* POPOVER EDITAR / DELETAR */

  toggleMenu(aula: Aula) {
    this.menuAbertoId = this.menuAbertoId === aula.id ? null : aula.id;
  }

  fecharMenu() {
    this.menuAbertoId = null;
  }

  editarAula(aula: Aula) {
    this.fecharMenu();
    console.log('Editar', aula);
  }

  deletarAula(aula: Aula) {
    this.fecharMenu();
    this.aulas = this.aulas.filter(a => a.id !== aula.id);
    this.atualizarResumo();
    this.atualizarProximas();
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
    const h = this.hoje;
    return [
      { id: 1, data: h, hora: '08:00', titulo: 'Aula Prática - Categoria B', aluno: 'Mariana Alves', valor: 120, status: 'Agendada' },
      { id: 2, data: h, hora: '10:00', titulo: 'Baliza e Estacionamento', aluno: 'Lucas Lima', valor: 120, status: 'Agendada' },
      { id: 3, data: h, hora: '14:00', titulo: 'Direção em Via Urbana', aluno: 'Pedro Santos', valor: 120, status: 'Agendada' },
      { id: 4, data: h, hora: '16:00', titulo: 'Aula Prática - Categoria B', aluno: 'Júlia Rocha', valor: 120, status: 'Agendada' },
      { id: 5, data: somarDias(h, 1), hora: '09:00', titulo: 'Aula Prática - Categoria A', aluno: 'Ana Souza', valor: 100, status: 'Agendada' },
      { id: 6, data: somarDias(h, 1), hora: '11:00', titulo: 'Direção Defensiva', aluno: 'Carlos Melo', valor: 120, status: 'Agendada' },
      { id: 7, data: somarDias(h, 3), hora: '15:00', titulo: 'Baliza e Estacionamento', aluno: 'Mariana Alves', valor: 120, status: 'Agendada' },
      { id: 8, data: somarDias(h, 5), hora: '08:00', titulo: 'Aula Prática - Categoria B', aluno: 'Lucas Lima', valor: 120, status: 'Agendada' },
      { id: 9, data: somarDias(h, -2), hora: '10:00', titulo: 'Aula Prática - Categoria B', aluno: 'Pedro Santos', valor: 120, status: 'Concluída' }
    ];
  }
}