
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type DiaSemana =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DisponibilidadeInstrutor {
  id: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

export interface BloqueioAgenda {
  id: number;
  instrutorId: number;
  data: string;
  horaInicio: string | null;
  horaFim: string | null;
  diaInteiro: boolean;
  motivo: string;
}

export interface BloqueioAgendaRequest {
  instrutorId: number;
  data: string;
  horaInicio: string | null;
  horaFim: string | null;
  diaInteiro: boolean;
  motivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  private readonly http = inject(HttpClient);

  // environment.apiUrl já contém /api.
  // Por isso, não devemos acrescentar /api novamente nas rotas.
  private readonly apiUrl = environment.apiUrl;

  // Lista todas as disponibilidades de um instrutor.
  listarDisponibilidades(
    instrutorId: number
  ): Observable<DisponibilidadeInstrutor[]> {
    return this.http.get<DisponibilidadeInstrutor[]>(
      `${this.apiUrl}/disponibilidades/instrutor/${instrutorId}`
    );
  }

  // Lista as disponibilidades de um instrutor em determinado dia.
  listarDisponibilidadesPorDia(
    instrutorId: number,
    diaSemana: DiaSemana
  ): Observable<DisponibilidadeInstrutor[]> {

    const params = new HttpParams()
      .set('diaSemana', diaSemana);

    return this.http.get<DisponibilidadeInstrutor[]>(
      `${this.apiUrl}/disponibilidades/instrutor/${instrutorId}/dia`,
      { params }
    );
  }

  // Cadastra uma nova disponibilidade para o instrutor.
  cadastrarDisponibilidade(
    instrutorId: number,
    diaSemana: DiaSemana,
    horaInicio: string,
    horaFim: string
  ): Observable<DisponibilidadeInstrutor> {

    const params = new HttpParams()
      .set('instrutorId', instrutorId.toString())
      .set('diaSemana', diaSemana)
      .set('horaInicio', horaInicio)
      .set('horaFim', horaFim);

    return this.http.post<DisponibilidadeInstrutor>(
      `${this.apiUrl}/disponibilidades`,
      null,
      { params }
    );
  }

  // Consulta os horários livres do instrutor em uma data.
  listarHorariosLivres(
    instrutorId: number,
    data: string
  ): Observable<string[]> {

    const params = new HttpParams()
      .set('data', data);

    return this.http.get<string[]>(
      `${this.apiUrl}/disponibilidades/instrutor/${instrutorId}/horarios-livres`,
      { params }
    );
  }

  // Lista os bloqueios de agenda do instrutor em uma data.
  listarBloqueios(
    instrutorId: number,
    data: string
  ): Observable<BloqueioAgenda[]> {

    const params = new HttpParams()
      .set('data', data);

    return this.http.get<BloqueioAgenda[]>(
      `${this.apiUrl}/bloqueios-agenda/instrutor/${instrutorId}`,
      { params }
    );
  }

  // Cadastra um bloqueio na agenda do instrutor.
  cadastrarBloqueio(
    dados: BloqueioAgendaRequest
  ): Observable<BloqueioAgenda> {

    return this.http.post<BloqueioAgenda>(
      `${this.apiUrl}/bloqueios-agenda`,
      dados
    );
  }
}
