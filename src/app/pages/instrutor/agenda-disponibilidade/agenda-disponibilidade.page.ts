import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import {
  AgendaService,
  DiaSemana,
  DisponibilidadeInstrutor,
  BloqueioAgenda
} from '../../../core/services/agenda.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-agenda-disponibilidade',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './agenda-disponibilidade.page.html',
  styleUrls: ['./agenda-disponibilidade.page.scss'],
})
export class AgendaDisponibilidadePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly toast = inject(ToastService);

  instrutorId: number | null = null;
  nomeInstrutor = 'Instrutor';
  notaInstrutor: string | number = '—';

  disponibilidades: DisponibilidadeInstrutor[] = [];
  bloqueios: BloqueioAgenda[] = [];
  horariosLivres: string[] = [];

  readonly diasSemana: { valor: DiaSemana; nome: string }[] = [
    { valor: 'MONDAY', nome: 'Segunda-feira' },
    { valor: 'TUESDAY', nome: 'Terça-feira' },
    { valor: 'WEDNESDAY', nome: 'Quarta-feira' },
    { valor: 'THURSDAY', nome: 'Quinta-feira' },
    { valor: 'FRIDAY', nome: 'Sexta-feira' },
    { valor: 'SATURDAY', nome: 'Sábado' },
    { valor: 'SUNDAY', nome: 'Domingo' },
  ];

  diasSelecionados: DiaSemana[] = [];
  diaSelecionado: DiaSemana = 'MONDAY';

  dataSelecionada = this.dataAtualISO();
  mesReferencia = new Date();

  horaInicio = '08:00';
  horaFim = '12:00';

  horaBloqueioInicio = '08:00';
  horaBloqueioFim = '12:00';
  motivoBloqueio = '';

  mostrarFormularioDisponibilidade = false;
  mostrarFormularioBloqueio = false;

  carregando = false;
  carregandoAgenda = false;
  salvando = false;
  bloqueando = false;

  ngOnInit(): void {
    this.obterInstrutor();
  }

  private dataAtualISO(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private obterInstrutor(): void {
    const usuario = this.auth.usuario();
    const id = Number(usuario?.id);

    if (!usuario || usuario.perfil !== 'instrutor' || !Number.isFinite(id) || id <= 0) {
      this.toast.mostrar('Não foi possível identificar o instrutor autenticado.', 'erro');
      return;
    }

    this.instrutorId = id;
    this.nomeInstrutor = usuario.nome || 'Instrutor';

    this.carregarDisponibilidades();
    this.carregarAgendaDaData();
  }

  carregarDisponibilidades(): void {
    if (this.instrutorId === null) return;

    this.carregando = true;

    this.agendaService.listarDisponibilidades(this.instrutorId).subscribe({
      next: (dados) => {
        this.disponibilidades = dados;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar disponibilidades:', erro);
        this.carregando = false;
        this.toast.mostrar('Não foi possível carregar os horários cadastrados.', 'erro');
      },
    });
  }

  carregarAgendaDaData(): void {
    if (this.instrutorId === null) return;

    this.carregandoAgenda = true;

    this.agendaService.listarHorariosLivres(this.instrutorId, this.dataSelecionada)
      .subscribe({
        next: (horarios) => {
          this.horariosLivres = horarios ?? [];
          this.carregarBloqueios();
        },
        error: (erro) => {
          console.error('Erro ao carregar horários livres:', erro);
          this.horariosLivres = [];
          this.carregarBloqueios();
        },
      });
  }

  private carregarBloqueios(): void {
    if (this.instrutorId === null) return;

    this.agendaService.listarBloqueios(this.instrutorId, this.dataSelecionada)
      .subscribe({
        next: (dados) => {
          this.bloqueios = dados ?? [];
          this.carregandoAgenda = false;
        },
        error: (erro) => {
          console.error('Erro ao carregar bloqueios:', erro);
          this.bloqueios = [];
          this.carregandoAgenda = false;
        },
      });
  }

  selecionarDia(dia: DiaSemana): void {
    this.diaSelecionado = dia;

    if (this.diasSelecionados.includes(dia)) {
      this.diasSelecionados = this.diasSelecionados.filter(item => item !== dia);
    } else {
      this.diasSelecionados = [...this.diasSelecionados, dia];
    }
  }

  diaEstaSelecionado(dia: DiaSemana): boolean {
    return this.diasSelecionados.includes(dia);
  }

  selecionarDiaCadastrado(dia: DiaSemana): void {
    this.diaSelecionado = dia;
    this.dataSelecionada = this.proximaDataDoDia(dia);
    this.atualizarMesReferencia();
    this.carregarAgendaDaData();
  }

  private proximaDataDoDia(dia: DiaSemana): string {
    const mapa: Record<DiaSemana, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const data = new Date(`${this.dataSelecionada}T12:00:00`);
    const diferenca = (mapa[dia] - data.getDay() + 7) % 7;
    data.setDate(data.getDate() + diferenca);

    return this.formatarDataISO(data);
  }

  alterarData(event: CustomEvent): void {
    const valor = event.detail.value;
    if (!valor) return;

    this.dataSelecionada = String(valor).substring(0, 10);
    this.atualizarMesReferencia();
    this.carregarAgendaDaData();
  }

  mudarData(dias: number): void {
    const data = new Date(`${this.dataSelecionada}T12:00:00`);
    data.setDate(data.getDate() + dias);
    this.dataSelecionada = this.formatarDataISO(data);
    this.atualizarMesReferencia();
    this.carregarAgendaDaData();
  }

  private formatarDataISO(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private atualizarMesReferencia(): void {
    this.mesReferencia = new Date(`${this.dataSelecionada}T12:00:00`);
  }

  get mesAno(): string {
    return this.mesReferencia.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  }

  get dataFormatada(): string {
    return new Date(`${this.dataSelecionada}T12:00:00`)
      .toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
  }

  get horariosOcupados(): BloqueioAgenda[] {
    return this.bloqueios;
  }

  get diasComDisponibilidade(): DiaSemana[] {
    return this.diasSemana
      .filter(dia => this.disponibilidades.some(
        item => item.diaSemana === dia.valor && item.ativo
      ))
      .map(dia => dia.valor);
  }

  abrirFormularioDisponibilidade(): void {
    this.mostrarFormularioDisponibilidade = !this.mostrarFormularioDisponibilidade;
    this.mostrarFormularioBloqueio = false;
  }

  abrirFormularioBloqueio(): void {
    this.mostrarFormularioBloqueio = !this.mostrarFormularioBloqueio;
    this.mostrarFormularioDisponibilidade = false;
  }

  salvarAlteracoes(): void {
    if (this.instrutorId === null) {
      this.toast.mostrar('Instrutor não identificado.', 'erro');
      return;
    }

    if (this.diasSelecionados.length === 0) {
      this.toast.mostrar('Selecione pelo menos um dia da semana.', 'erro');
      return;
    }

    if (!this.horaInicio || !this.horaFim || this.horaInicio >= this.horaFim) {
      this.toast.mostrar('Confira os horários inicial e final.', 'erro');
      return;
    }

    this.salvando = true;

    const diasParaCadastrar = this.diasSelecionados.filter(dia =>
      !this.disponibilidades.some(item =>
        item.diaSemana === dia &&
        item.ativo &&
        item.horaInicio.substring(0, 5) === this.horaInicio &&
        item.horaFim.substring(0, 5) === this.horaFim
      )
    );

    if (diasParaCadastrar.length === 0) {
      this.salvando = false;
      this.toast.mostrar('Esses horários já estão cadastrados.', 'erro');
      return;
    }

    let concluidos = 0;
    let falhas = 0;

    diasParaCadastrar.forEach(dia => {
      this.agendaService.cadastrarDisponibilidade(
        this.instrutorId!,
        dia,
        `${this.horaInicio}:00`,
        `${this.horaFim}:00`
      ).subscribe({
        next: () => {
          concluidos++;
          this.finalizarCadastro(concluidos, falhas, diasParaCadastrar.length);
        },
        error: (erro) => {
          console.error(`Erro ao cadastrar ${dia}:`, erro);
          falhas++;
          this.finalizarCadastro(concluidos, falhas, diasParaCadastrar.length);
        },
      });
    });
  }

  private finalizarCadastro(concluidos: number, falhas: number, total: number): void {
    if (concluidos + falhas !== total) return;

    this.salvando = false;
    this.carregarDisponibilidades();

    if (concluidos > 0) {
      this.toast.mostrar(`${concluidos} dia(s) cadastrado(s) com sucesso!`, 'ok');
      this.diasSelecionados = [];
      this.mostrarFormularioDisponibilidade = false;
    }

    if (falhas > 0) {
      this.toast.mostrar(`${falhas} horário(s) não puderam ser cadastrados.`, 'erro');
    }
  }

  cadastrarBloqueio(): void {
    if (this.instrutorId === null) return;

    if (!this.motivoBloqueio.trim()) {
      this.toast.mostrar('Informe o motivo do bloqueio.', 'erro');
      return;
    }

    if (
      (!this.horaBloqueioInicio || !this.horaBloqueioFim) ||
      this.horaBloqueioInicio >= this.horaBloqueioFim
    ) {
      this.toast.mostrar('Informe um intervalo de horário válido.', 'erro');
      return;
    }

    this.bloqueando = true;

    this.agendaService.cadastrarBloqueio({
      instrutorId: this.instrutorId,
      data: this.dataSelecionada,
      horaInicio: `${this.horaBloqueioInicio}:00`,
      horaFim: `${this.horaBloqueioFim}:00`,
      diaInteiro: false,
      motivo: this.motivoBloqueio.trim(),
    }).subscribe({
      next: () => {
        this.bloqueando = false;
        this.mostrarFormularioBloqueio = false;
        this.motivoBloqueio = '';
        this.toast.mostrar('Horário bloqueado com sucesso!', 'ok');
        this.carregarAgendaDaData();
      },
      error: (erro) => {
        console.error('Erro ao bloquear horário:', erro);
        this.bloqueando = false;
        this.toast.mostrar('Não foi possível bloquear esse horário.', 'erro');
      },
    });
  }

  nomeDia(dia: DiaSemana): string {
    return this.diasSemana.find(item => item.valor === dia)?.nome ?? dia;
  }

  formatarHora(horario: string | null): string {
    return horario ? horario.substring(0, 5) : '';
  }

  horarioEstaLivre(horario: string): boolean {
    return this.horariosLivres.some(item =>
      this.formatarHora(item) === this.formatarHora(horario)
    );
  }
}