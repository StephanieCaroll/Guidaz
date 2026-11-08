import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatusApi = 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA' | 'FALTA';

export interface ResumoHoras {
  horasContratadas: number;
  horasRealizadas: number;
  horasPendentes: number;
  percentualConcluido: number;
}

export interface AulaHistoricoApi {
  id: number;
  titulo: string;
  dataHora: string;        // ex: 2023-09-18T09:00:00
  nomeOutraPessoa: string;
  status: StatusApi;
  minhaNota: number | null;
}

export interface ResumoInstrutor {
  totalAulas: number;
  realizadas: number;
  canceladas: number;
  faltas: number;
  agendadas: number;
  horasRealizadas: number;
  horasPendentes: number;
  mediaAvaliacoes: number | null;
}

export interface AvaliacaoRequest {
  usuarioId: number;
  tipoAvaliador: 'ALUNO' | 'INSTRUTOR';
  nota: number;
  comentario?: string;
}

@Injectable({ providedIn: 'root' })
export class AulaService {
  private readonly api = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  resumoHoras(alunoId: number): Observable<ResumoHoras> {
    return this.http.get<ResumoHoras>(`${this.api}/horas/aluno/${alunoId}`);
  }

  historicoAluno(alunoId: number): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/aluno/${alunoId}`);
  }

  resumoInstrutor(instrutorId: number): Observable<ResumoInstrutor> {
  return this.http.get<ResumoInstrutor>(`${this.api}/horas/instrutor/${instrutorId}`);
  }

  historicoInstrutor(instrutorId: number): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/instrutor/${instrutorId}`);
  }

  avaliar(aulaId: number, body: AvaliacaoRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/aulas/${aulaId}/avaliacoes`, body);
  }
}