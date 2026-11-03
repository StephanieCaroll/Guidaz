import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InstrutorInfo {
  id: number;
  nome: string;
  especialidade?: string;
  avaliacao?: number;
  qtdAvaliacoes?: number;
}

export interface DisponibilidadeInstrutor {
  id?: number;
  instrutorId: number;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

export interface BloqueioAgenda {
  id?: number;
  instrutorId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  motivo?: string;
}

export interface SlotDisponivel {
  hora: string;
  disponivel: boolean;
  status: 'LIVRE' | 'OCUPADO_AULA' | 'BLOQUEADO_PESSOAL';
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(private http: HttpClient) {}

  getInstrutorInfo(instrutorId: number): Observable<InstrutorInfo> {
    return this.http.get<InstrutorInfo>(`${this.apiUrl}/instrutores/${instrutorId}`).pipe(
      catchError(() => of({
        id: instrutorId,
        nome: 'Instrutor Cadastrado',
        especialidade: 'Instrutor de Direção',
        avaliacao: 5.0,
        qtdAvaliacoes: 0
      }))
    );
  }

  getDisponibilidades(instrutorId: number): Observable<DisponibilidadeInstrutor[]> {
    return this.http.get<DisponibilidadeInstrutor[]>(`${this.apiUrl}/disponibilidades/instrutor/${instrutorId}`);
  }

  salvarDisponibilidades(instrutorId: number, disponibilidades: DisponibilidadeInstrutor[]): Observable<DisponibilidadeInstrutor[]> {
    return this.http.post<DisponibilidadeInstrutor[]>(`${this.apiUrl}/disponibilidades/instrutor/${instrutorId}`, disponibilidades);
  }

  getSlotsDoDia(instrutorId: number, dataIso: string): Observable<SlotDisponivel[]> {
    return this.http.get<SlotDisponivel[]>(`${this.apiUrl}/disponibilidades/instrutor/${instrutorId}/slots?data=${dataIso}`);
  }

  getBloqueios(instrutorId: number): Observable<BloqueioAgenda[]> {
    return this.http.get<BloqueioAgenda[]>(`${this.apiUrl}/bloqueios/instrutor/${instrutorId}`);
  }

  criarBloqueio(instrutorId: number, bloqueio: BloqueioAgenda): Observable<BloqueioAgenda> {
    return this.http.post<BloqueioAgenda>(`${this.apiUrl}/bloqueios/instrutor/${instrutorId}`, bloqueio);
  }

  removerBloqueio(bloqueioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bloqueios/${bloqueioId}`);
  }
}