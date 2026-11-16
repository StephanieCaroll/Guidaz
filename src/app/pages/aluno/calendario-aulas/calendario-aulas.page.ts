import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowUndoOutline, ellipsisVertical, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

interface DiaMes {
  data: Date;
  iso: string;
  numero: string;
  mesAtual: boolean;
  temAula: boolean;
}

interface AulaDia {
  id: number;
  iso: string;
  titulo: string;
  hora: string;
  completa: boolean;
}

const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function paraIso(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

@Component({
  selector: 'app-calendario-aulas',
  templateUrl: './calendario-aulas.page.html',
  styleUrls: ['./calendario-aulas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BottomNavComponent]
})
export class CalendarioAulasPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly aulaService = inject(AulaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly diasSemana = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  hojeIso = paraIso(new Date());
  dataSelecionadaIso = this.hojeIso;
  mesAtual = new Date().getMonth();
  anoAtual = new Date().getFullYear();

  gradeDias: DiaMes[] = [];
  todasAulas: AulaDia[] = [];

  constructor() {
    addIcons({ arrowUndoOutline, ellipsisVertical, chevronBackOutline, chevronForwardOutline });
  }

  get isInstrutor(): boolean {
    return this.router.url.startsWith('/instrutor');
  }

  ngOnInit(): void {
    this.lerDataDaRota();
    this.montarGrade();
    this.carregarAulas();
  }

  ionViewWillEnter(): void {
    this.lerDataDaRota();
    this.montarGrade();
    this.carregarAulas();
  }

  private lerDataDaRota(): void {
    const paramData = this.route.snapshot.queryParamMap.get('data');
    if (paramData && /^\d{4}-\d{2}-\d{2}$/.test(paramData)) {
      this.dataSelecionadaIso = paramData;
      const [ano, mes] = paramData.split('-').map(Number);
      this.anoAtual = ano;
      this.mesAtual = mes - 1;
    }
  }

  get tituloMesAno(): string {
    return `${MESES_LONGOS[this.mesAtual]} ${this.anoAtual}`;
  }

  get tituloDiaSelecionado(): string {
    if (this.dataSelecionadaIso === this.hojeIso) {
      return 'Hoje';
    }
    const [ano, mes, dia] = this.dataSelecionadaIso.split('-').map(Number);
    return `${dia} de ${MESES_CURTOS[mes - 1]} ${ano}`;
  }

  get aulasDoDia(): AulaDia[] {
    return this.todasAulas.filter(a => a.iso === this.dataSelecionadaIso);
  }

  private carregarAulas(): void {
    const usuarioId = Number(this.auth.usuario()?.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return;

    const req$ = this.isInstrutor
      ? this.aulaService.historicoInstrutor(usuarioId)
      : this.aulaService.historicoAluno(usuarioId);

    req$.subscribe({
      next: (lista) => {
        this.todasAulas = (lista || [])
          .filter(a => a.status !== 'CANCELADA')
          .map(a => this.mapearAula(a));
        this.montarGrade();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar aulas no calendário:', err)
    });
  }

  private mapearAula(item: AulaHistoricoApi): AulaDia {
    const iso = item.dataAula || (item.dataHora ? item.dataHora.slice(0, 10) : this.hojeIso);
    const hora = item.horaInicio ? item.horaInicio.slice(0, 5) : (item.dataHora ? item.dataHora.slice(11, 16) : '');
    const complemento = this.isInstrutor && (item.alunoNome || item.nomeOutraPessoa)
      ? ` • ${item.alunoNome || item.nomeOutraPessoa}`
      : '';
    return {
      id: item.id,
      iso,
      titulo: hora ? `${item.titulo} (${hora})${complemento}` : `${item.titulo}${complemento}`,
      hora,
      completa: item.status === 'CONCLUIDA'
    };
  }

  montarGrade(): void {
    const diasComAula = new Set(this.todasAulas.map(a => a.iso));
    const primeiroDiaMes = new Date(this.anoAtual, this.mesAtual, 1);

    const offsetInicio = (primeiroDiaMes.getDay() + 6) % 7;
    const inicioGrade = new Date(this.anoAtual, this.mesAtual, 1 - offsetInicio);

    const dias: DiaMes[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(inicioGrade.getFullYear(), inicioGrade.getMonth(), inicioGrade.getDate() + i);
      const iso = paraIso(d);
      dias.push({
        data: d,
        iso,
        numero: String(d.getDate()).padStart(2, '0'),
        mesAtual: d.getMonth() === this.mesAtual,
        temAula: diasComAula.has(iso)
      });
    }

    const ultimoDiaMes = new Date(this.anoAtual, this.mesAtual + 1, 0);
    if (dias[dias.length - 1].data < ultimoDiaMes) {
      for (let i = 35; i < 42; i++) {
        const d = new Date(inicioGrade.getFullYear(), inicioGrade.getMonth(), inicioGrade.getDate() + i);
        const iso = paraIso(d);
        dias.push({
          data: d,
          iso,
          numero: String(d.getDate()).padStart(2, '0'),
          mesAtual: d.getMonth() === this.mesAtual,
          temAula: diasComAula.has(iso)
        });
      }
    }

    this.gradeDias = dias;
  }

  mudarMes(delta: number): void {
    const novaData = new Date(this.anoAtual, this.mesAtual + delta, 1);
    this.anoAtual = novaData.getFullYear();
    this.mesAtual = novaData.getMonth();
    this.montarGrade();
  }

  selecionarDia(dia: DiaMes): void {
    this.dataSelecionadaIso = dia.iso;
    if (!dia.mesAtual) {
      this.anoAtual = dia.data.getFullYear();
      this.mesAtual = dia.data.getMonth();
      this.montarGrade();
    }
  }

  abrirDetalhes(aula: AulaDia): void {
    const rota = this.isInstrutor ? '/instrutor/detalhe-aula' : '/aluno/detalhe-aula';
    void this.router.navigate([rota], {
      queryParams: { id: aula.id }
    });
  }

  voltar(): void {
    this.location.back();
  }
}