import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
import { arrowBackOutline, addOutline, banOutline, trashOutline, informationCircleOutline } from 'ionicons/icons';

import { AgendaService, DisponibilidadeInstrutor, BloqueioAgenda, InstrutorInfo } from '../../../core/services/agenda.service';
import { ToastService } from '../../../core/services/toast.service';

export interface DiaSemanaItem {
  valor: string;
  nome: string;
  nomeCompleto: string;
  selecionado: boolean;
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
export class AgendaDisponibilidadePage implements OnInit, ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  instrutorId: number = 1;
  alunoIdSelecionado: number | null = null;
  alunoNomeSelecionado: string = '';
  alunoCategoriaSelecionada: string = '';

  // Propriedade para controlar o Foco Pedagógico da Aula (As 8 Funcionalidades)
  focoSelecionado: string = 'vias';

  nomeInstrutor: string = 'Carregando...';
  instrutorEspecialidade: string = 'Instrutor de Direção';
  notaInstrutor: number = 5.0;
  instrutorQtdAvaliacoes: number = 0;

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

  bloqueios: BloqueioAgenda[] = [];
  horariosOcupados: BloqueioAgenda[] = [];
  disponabilidadesSalvas: DisponibilidadeInstrutor[] = [];
  disponabilidades: DisponibilidadeInstrutor[] = [];

  carregando: boolean = false;
  salvando: boolean = false;
  bloqueando: boolean = false;

  mostrarFormularioDisponibilidade: boolean = false;
  mostrarFormularioBloqueio: boolean = false;

  novoHorarioDia: string = 'MONDAY';
  horaInicio: string = '08:00';
  horaFim: string = '12:00';

  novoBloqueioData: string = new Date().toISOString().split('T')[0];
  horaBloqueioInicio: string = '10:00';
  horaBloqueioFim: string = '11:00';
  motivoBloqueio: string = 'Compromisso Pessoal';

  constructor(
    private agendaService: AgendaService,
    private toastService: ToastService,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      arrowBackOutline,
      addOutline,
      banOutline,
      trashOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.capturarParametrosRota();
    this.carregarPerfilInstrutor();
    this.carregarDados();
  }

  ionViewWillEnter() {
    this.capturarParametrosRota();
    this.carregarPerfilInstrutor();
    this.carregarDados();
  }

  private capturarParametrosRota() {
    const alunoIdParam = this.route.snapshot.queryParamMap.get('alunoId');
    const alunoNomeParam = this.route.snapshot.queryParamMap.get('alunoNome');
    const alunoCategoriaParam = this.route.snapshot.queryParamMap.get('alunoCategoria');

    if (alunoIdParam) {
      this.alunoIdSelecionado = Number(alunoIdParam);
    }
    
    if (alunoNomeParam) {
      this.alunoNomeSelecionado = alunoNomeParam;
      this.nomeInstrutor = `Aluno: ${this.alunoNomeSelecionado}`;
    }

    if (alunoCategoriaParam) {
      this.alunoCategoriaSelecionada = alunoCategoriaParam;
      this.instrutorEspecialidade = `Categoria: ${this.alunoCategoriaSelecionada}`;
    }
  }

  // Método para atualizar o foco pedagógico selecionado
  selecionarFoco(foco: string) {
    this.focoSelecionado = foco;
    this.cdr.detectChanges();
  }

  voltar() {
    this.location.back();
  }

  carregarPerfilInstrutor() {
    // Se o ecrã foi aberto com o contexto do aluno, evitamos sobrescrever com os dados do instrutor
    if (this.alunoNomeSelecionado) {
      return;
    }

    this.agendaService.getInstrutorInfo(this.instrutorId).subscribe({
      next: (info: InstrutorInfo) => {
        if (info && info.nome) {
          this.nomeInstrutor = info.nome;
          this.instrutorEspecialidade = info.especialidade || 'Instrutor de Direção';
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
    this.carregarDisponibilidades();
    this.carregarBloqueios();
  }

  carregarDisponibilidades() {
    this.carregando = true;
    this.cdr.detectChanges();

    this.agendaService.getDisponibilidades(this.instrutorId).subscribe({
      next: (res: DisponibilidadeInstrutor[]) => {
        this.disponabilidadesSalvas = [...res];
        this.disponabilidades = [...res];
        this.sincronizarBotoesDias();
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar disponibilidades:', err);
        this.toastService.mostrar('Erro ao carregar disponibilidades da API', 'erro');
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarBloqueios() {
    this.agendaService.getBloqueios(this.instrutorId).subscribe({
      next: (res: BloqueioAgenda[]) => {
        this.bloqueios = [...res];
        this.horariosOcupados = [...res];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar bloqueios:', err);
        this.cdr.detectChanges();
      }
    });
  }

  sincronizarBotoesDias() {
    const diasComDisponibilidade = new Set(this.disponabilidadesSalvas.filter(d => d.ativo).map(d => d.diaSemana));
    this.diasSemana.forEach(dia => {
      dia.selecionado = diasComDisponibilidade.has(dia.valor);
    });
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

  toggleDiaSemana(dia: DiaSemanaItem) {
    dia.selecionado = !dia.selecionado;
    if (!dia.selecionado) {
      this.disponabilidadesSalvas = this.disponabilidadesSalvas.filter(d => d.diaSemana !== dia.valor);
    } else {
      const existe = this.disponabilidadesSalvas.some(d => d.diaSemana === dia.valor);
      if (!existe) {
        this.disponabilidadesSalvas.push({
          instrutorId: this.instrutorId,
          diaSemana: dia.valor,
          horaInicio: '08:00',
          horaFim: '12:00',
          ativo: true
        });
      }
    }
    this.disponabilidades = [...this.disponabilidadesSalvas];
    this.cdr.detectChanges();
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

  private formatarTimeParaBackend(hora: string): string {
    if (!hora) return '00:00:00';
    const clean = hora.trim();
    if (clean.length === 5) {
      return `${clean}:00`;
    }
    return clean;
  }

  abrirFormularioDisponibilidade() {
    this.mostrarFormularioDisponibilidade = !this.mostrarFormularioDisponibilidade;
    this.mostrarFormularioBloqueio = false;
    this.cdr.detectChanges();
  }

  confirmarAdicionarHorario() {
    const startMin = this.timeToMinutes(this.horaInicio);
    const endMin = this.timeToMinutes(this.horaFim);

    if (startMin >= endMin) {
      this.toastService.mostrar('A hora de início deve ser anterior à hora de término.', 'erro');
      return;
    }

    const conflito = this.disponabilidadesSalvas.some(d =>
      d.diaSemana === this.novoHorarioDia &&
      this.existeConflitoHorario(this.horaInicio, this.horaFim, d.horaInicio, d.horaFim)
    );

    if (conflito) {
      this.toastService.mostrar('Já existe um horário cadastrado que entra em conflito neste dia!', 'erro');
      return;
    }

    this.disponabilidadesSalvas.push({
      instrutorId: this.instrutorId,
      diaSemana: this.novoHorarioDia,
      horaInicio: this.horaInicio,
      horaFim: this.horaFim,
      ativo: true
    });
    this.disponabilidades = [...this.disponabilidadesSalvas];
    this.sincronizarBotoesDias();

    this.mostrarFormularioDisponibilidade = false;
    this.toastService.mostrar('Horário adicionado! Clique em Salvar Alterações para persistir no banco.', 'ok');
    this.cdr.detectChanges();
  }

  abrirFormularioBloqueio() {
    this.mostrarFormularioBloqueio = !this.mostrarFormularioBloqueio;
    this.mostrarFormularioDisponibilidade = false;
    this.cdr.detectChanges();
  }

  cadastrarBloqueio() {
    const startMin = this.timeToMinutes(this.horaBloqueioInicio);
    const endMin = this.timeToMinutes(this.horaBloqueioFim);

    if (startMin >= endMin) {
      this.toastService.mostrar('A hora de início do bloqueio deve ser anterior à hora de fim.', 'erro');
      return;
    }

    const conflito = this.bloqueios.some(b =>
      b.data === this.novoBloqueioData &&
      this.existeConflitoHorario(this.horaBloqueioInicio, this.horaBloqueioFim, b.horaInicio, b.horaFim)
    );

    if (conflito) {
      this.toastService.mostrar('Já existe um bloqueio agendado que entra em conflito nesta mesma data!', 'erro');
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
        this.toastService.mostrar('Erro ao criar bloqueio no servidor.', 'erro');
        this.bloqueando = false;
        this.cdr.detectChanges();
      }
    });
  }

  removerBloqueio(id?: number) {
    if (!id) return;
    this.agendaService.removerBloqueio(id).subscribe({
      next: () => {
        this.toastService.mostrar('Bloqueio removido com sucesso!', 'ok');
        this.carregarBloqueios();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao remover bloqueio:', err);
        this.toastService.mostrar('Erro ao remover bloqueio.', 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  removerHorarioCadastrado(index: number) {
    this.disponabilidadesSalvas.splice(index, 1);
    this.disponabilidades = [...this.disponabilidadesSalvas];
    this.sincronizarBotoesDias();
    this.cdr.detectChanges();
  }

  salvarAlteracoes() {
    this.salvando = true;
    this.cdr.detectChanges();

    const payload = this.disponabilidadesSalvas.map(d => ({
      ...d,
      horaInicio: this.formatarTimeParaBackend(d.horaInicio),
      horaFim: this.formatarTimeParaBackend(d.horaFim)
    }));

    this.agendaService.salvarDisponibilidades(this.instrutorId, payload).subscribe({
      next: (res: DisponibilidadeInstrutor[]) => {
        this.disponabilidadesSalvas = [...res];
        this.disponabilidades = [...res];
        this.sincronizarBotoesDias();
        this.toastService.mostrar('Aula agendada e disponibilidades salvas com sucesso!', 'ok');
        this.salvando = false;
        this.cdr.detectChanges();

        // Redireciona para a home do instrutor após salvar com sucesso
        this.router.navigate(['/instrutor/home']);
      },
      error: (err: any) => {
        console.error('Erro ao salvar disponibilidades:', err);
        this.toastService.mostrar('Erro ao salvar disponibilidades.', 'erro');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getNomeDia(key: string): string {
    return this.mapaDias[key] || key;
  }
}