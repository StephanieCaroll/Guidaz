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
  star,
  chevronForwardOutline,
  createOutline,
  trashOutline,
  personOutline,
  checkmarkCircleOutline
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
  hora: string;
  titulo: string;
  aluno: string;
  valor: number;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
}

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
  selector: 'app-home-instrutor',
  templateUrl: './home-instrutor.page.html',
  styleUrls: ['./home-instrutor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class HomeInstrutorPage implements OnInit, AfterViewInit {
  @ViewChild('calendario') calendario!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly toastService = inject(ToastService);

  nomeInstrutor = '';
  fotoUrl = '';
  temFoto = false;
  temNotificacao = true;
  hoje = zerarHora(new Date());
  selecionado = this.hoje;
  dias: DiaCalendario[] = [];
  mesAno = '';
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
      createOutline,
      trashOutline,
      personOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.dias = this.gerarFaixa(somarDias(this.hoje, -LOTE), LOTE + 60);
    this.carregarDadosInstrutor();
  }

  ionViewWillEnter() {
    this.carregarUsuario();
    this.carregarDadosInstrutor();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rolarParaDia(this.hoje, false);
      this.atualizarMes();
    });
  }

  get mediaTexto(): string {
    return this.mini.media.toFixed(1).replace('.', ',');
  }

  private carregarUsuario() {
    const u: any = this.auth.usuario();
    this.nomeInstrutor = u?.nome ?? u?.nomeCompleto ?? u?.name ?? '';

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
    this.atualizarResumo();
    if (this.diaTemAula(dia)) {
      void this.router.navigate(['/instrutor/calendario'], {
        queryParams: { data: dia.iso }
      });
    }
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