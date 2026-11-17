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
  chevronForwardOutline,
  chevronDownOutline,
  createOutline,
  trashOutline,
  personOutline
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
  numero: number;
}

interface Aula {
  id: number;
  data: Date;
  titulo: string;
  status: 'Completa' | 'Incompleta';
}

type Filtro = 'todas' | 'completa' | 'incompleta';

const ITEM_W = 50;
const LOTE = 30;

const SEMANA_CURTA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

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
export class HomeAlunoPage implements OnInit, AfterViewInit {
  @ViewChild('calendario') calendario!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);

  nomeAluno = '';
  fotoUrl = '';
  temFoto = false;
  temNotificacao = true;

  hoje = zerarHora(new Date());
  selecionado = this.hoje;
  dias: DiaCalendario[] = [];
  mesAno = '';

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
      createOutline,
      trashOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.dias = this.gerarFaixa(somarDias(this.hoje, -LOTE), LOTE + 60);
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

  ngAfterViewInit() {
    setTimeout(() => {
      this.rolarParaDia(this.hoje, false);
      this.atualizarMes();
    });
  }

  private carregarUsuario() {
    const u: any = this.auth.usuario();
    this.nomeAluno = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';
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
    const alunoId = Number(this.auth.usuario()?.id);
    if (!Number.isInteger(alunoId) || alunoId <= 0) return;

    // 1. Próximas 3 aulas para os cards
    this.aulaService.proximasAluno(alunoId, 3).subscribe({
      next: (lista) => {
        this.aulas = (lista || []).slice(0, 3).map(item => this.mapearAula(item));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar próximas aulas do aluno:', err)
    });

    // 2. Todas as aulas do aluno para pintar as bolinhas verdes no calendário
    this.aulaService.historicoAluno(alunoId).subscribe({
      next: (todas) => {
        const datas = new Set<string>();
        for (const item of todas || []) {
          if (item.status === 'CANCELADA') continue;
          const iso = item.dataAula || (item.dataHora ? item.dataHora.slice(0, 10) : '');
          if (iso) datas.add(iso);
        }
        this.diasComAula = datas;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar datas com aula:', err)
    });

    // 3. Resumo de progresso
    this.aulaService.resumoHoras(alunoId).subscribe({
      next: (resumo) => {
        this.progresso = {
          categoria: resumo.categoriaPrincipal || this.progresso.categoria,
          realizadas: Math.round(resumo.horasRealizadas || 0),
          total: Math.round(resumo.horasContratadas || 0)
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar resumo de horas:', err)
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

  private gerarFaixa(inicio: Date, quantidade: number): DiaCalendario[] {
    const lista: DiaCalendario[] = [];
    for (let i = 0; i < quantidade; i++) {
      const data = somarDias(inicio, i);
      lista.push({
        data,
        chave: chaveDia(data),
        iso: isoDia(data),
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

  diaTemAula(dia: DiaCalendario): boolean {
    return this.diasComAula.has(dia.iso);
  }

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
    if (this.diaTemAula(dia)) {
      void this.router.navigate(['/aluno/calendario'], {
        queryParams: { data: dia.iso }
      });
    }
  }

  irParaHoje() {
    this.selecionado = this.hoje;
    this.rolarParaDia(this.hoje, true);
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