import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type StatusApi = 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA' | 'FALTA' | 'FALTA_ALUNO';

export interface ResumoHoras {
  horasContratadas: number;
  horasRealizadas: number;
  horasPendentes: number;
  percentualConcluido: number;
  categoriaPrincipal?: string;
}

export interface AulaHistoricoApi {
  id: number;
  titulo: string;
  dataHora: string;
  nomeOutraPessoa: string;
  status: StatusApi;
  minhaNota: number | null;
  alunoId?: number;
  alunoNome?: string;
  alunoFoto?: string;
  alunoTelefone?: string;
  instrutorId?: number;
  instrutorNome?: string;
  instrutorFoto?: string;
  instrutorTelefone?: string;
  veiculoModelo?: string;
  veiculoPlaca?: string;
  dataAula?: string;
  horaInicio?: string;
  horaFim?: string;
  categoria?: string;
  localEncontro?: string;
  observacoes?: string;
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
  totalAlunos?: number;
  pedidosPendentes?: number;
}

export interface AvaliacaoRequest {
  usuarioId?: number;
  tipoAvaliador: 'ALUNO' | 'INSTRUTOR';
  nota: number;
  comentario?: string;
}

export interface AgendarAulaPayload {
  alunoId: number;
  instrutorId: number;
  dataAula: string;
  horaInicio: string;
  horaFim?: string;
  categoria?: string;
  localEncontro?: string;
  observacoes?: string;
}

export interface EditarAulaPayload {
  dataAula: string;
  horaInicio: string;
  horaFim: string;
  localEncontro?: string;
  observacoes?: string;
}

@Injectable({ providedIn: 'root' })
export class AulaService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  agendarAula(payload: AgendarAulaPayload): Observable<AulaHistoricoApi> {
    return this.http.post<AulaHistoricoApi>(`${this.api}/aulas`, payload);
  }

  buscarPorId(aulaId: number, perfil: 'ALUNO' | 'INSTRUTOR' = 'ALUNO'): Observable<AulaHistoricoApi> {
    const params = new HttpParams().set('perfil', perfil);
    return this.http.get<AulaHistoricoApi>(`${this.api}/aulas/${aulaId}`, { params });
  }

  editarAula(aulaId: number, payload: EditarAulaPayload): Observable<AulaHistoricoApi> {
    return this.http.put<AulaHistoricoApi>(`${this.api}/aulas/${aulaId}`, payload);
  }

  resumoHoras(alunoId: number): Observable<ResumoHoras> {
    return this.http.get<ResumoHoras>(`${this.api}/horas/aluno/${alunoId}`);
  }

  historicoAluno(alunoId: number): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/aluno/${alunoId}`);
  }

  proximasAluno(alunoId: number, limite = 3): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/aluno/${alunoId}/proximas?limite=${limite}`);
  }

  resumoInstrutor(instrutorId: number): Observable<ResumoInstrutor> {
    return this.http.get<ResumoInstrutor>(`${this.api}/horas/instrutor/${instrutorId}`);
  }

  historicoInstrutor(instrutorId: number): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/instrutor/${instrutorId}`);
  }

  proximasInstrutor(instrutorId: number, limite = 3): Observable<AulaHistoricoApi[]> {
    return this.http.get<AulaHistoricoApi[]>(`${this.api}/aulas/instrutor/${instrutorId}/proximas?limite=${limite}`);
  }

  concluirAula(aulaId: number): Observable<AulaHistoricoApi> {
    return this.http.patch<AulaHistoricoApi>(`${this.api}/aulas/${aulaId}/concluir`, {});
  }

  cancelarAula(aulaId: number): Observable<AulaHistoricoApi> {
    return this.http.patch<AulaHistoricoApi>(`${this.api}/aulas/${aulaId}/cancelar`, {});
  }

  avaliar(aulaId: number, body: AvaliacaoRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/aulas/${aulaId}/avaliacoes`, body);
  }
}