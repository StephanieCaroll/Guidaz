import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, bookmarkOutline, bookmark, star, timeOutline,
  pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
  calendarOutline, personOutline, closeCircleOutline
} from 'ionicons/icons';

import { AulaHistoricoApi, AulaService } from '../../../core/services/aula.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

interface DetalheAula {
  id?: number;
  instrutorId?: number;
  alunoId?: number;
  statusRaw?: string;
  tipo: string;
  titulo: string;
  disponivel: boolean;
  nota: number;
  avaliacoes: number;
  categoria: string;
  duracaoMin: number;
  valor: number;
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
  imports: [CommonModule, IonContent, IonIcon, BottomNavComponent]
})
export class DetalheAulaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly aulaService = inject(AulaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly favorito = signal(false);
  processando = false;

  aula: DetalheAula = {
    tipo: 'Aula Prática',
    titulo: 'Aula Prática',
    disponivel: true,
    nota: 5.0,
    avaliacoes: 0,
    categoria: 'B',
    duracaoMin: 60,
    valor: 120,
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
      arrowBackOutline, bookmarkOutline, bookmark, star, timeOutline,
      pricetagOutline, layersOutline, checkmarkCircle, chevronForward,
      calendarOutline, personOutline, closeCircleOutline
    });
  }

  get isInstrutor(): boolean {
    return this.router.url.startsWith('/instrutor');
  }

  get podeAlterarStatus(): boolean {
    return this.aula.statusRaw === 'AGENDADA';
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

    this.aulaService.buscarPorId(id).subscribe({
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
        const horaTxt = dados.horaInicio
          ? `${dados.horaInicio.slice(0, 5)}${dados.horaFim ? ' às ' + dados.horaFim.slice(0, 5) : ''}`
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
          tipo: 'Aula Prática',
          titulo: dados.titulo,
          disponivel: dados.status === 'AGENDADA',
          nota: dados.minhaNota ?? 5.0,
          avaliacoes: 1,
          categoria: dados.categoria || 'B',
          duracaoMin: 60,
          valor: 120,
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
            'Acompanhamento prático',
            'Orientações personalizadas',
            'Suporte para dúvidas após a aula'
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

  concluirAula(): void {
    if (!this.aula.id || this.processando) return;
    this.processando = true;
    this.aulaService.concluirAula(this.aula.id).subscribe({
      next: () => {
        this.processando = false;
        this.carregarAula();
      },
      error: (err) => {
        this.processando = false;
        console.error('Erro ao concluir aula:', err);
      }
    });
  }

  cancelarAula(): void {
    if (!this.aula.id || this.processando) return;
    this.processando = true;
    this.aulaService.cancelarAula(this.aula.id).subscribe({
      next: () => {
        this.processando = false;
        this.location.back();
      },
      error: (err) => {
        this.processando = false;
        console.error('Erro ao cancelar aula:', err);
      }
    });
  }
}