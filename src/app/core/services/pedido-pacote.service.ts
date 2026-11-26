import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CriarPedidoPacoteRequest, PacoteApi, PedidoPacote } from '../models/pedido-pacote.model';

export interface SalvarPacotePayload {
  instrutorId: number;
  nome: string;
  categoria: string;
  quantidadeAulas: number;
  preco: number;
}

export interface InformarComprovantePayload {
  comprovanteUrl?: string;
  comprovanteNome?: string;
}

@Injectable({ providedIn: 'root' })
export class PedidoPacoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** GET /pacotes?instrutorId=...: lista pacotes padrão mesclados com os personalizados do instrutor. */
  listarPacotes(instrutorId?: number | null): Observable<PacoteApi[]> {
    let params = new HttpParams();
    if (instrutorId && instrutorId > 0) {
      params = params.set('instrutorId', String(instrutorId));
    }

    return this.http.get<PacoteApi[]>(`${this.apiUrl}/pacotes`, { params }).pipe(
      timeout(15000),
      map((lista) => (Array.isArray(lista) ? lista : [])),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'carregar os pacotes')))
    );
  }

  /** PUT /pacotes/{id}: permite ao instrutor editar quantidade de aulas e preço do pacote. */
  atualizarPacote(pacoteId: number, payload: SalvarPacotePayload): Observable<PacoteApi> {
    return this.http.put<PacoteApi>(`${this.apiUrl}/pacotes/${pacoteId}`, payload).pipe(
      timeout(15000),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'atualizar o pacote')))
    );
  }

  /** Busca o id do pacote na API casando pela categoria usada na tela de pacotes. */
  buscarPacoteId(categoria: string, instrutorId?: number | null): Observable<number> {
    return this.listarPacotes(instrutorId).pipe(
      map((pacotes) => {
        const encontrado = pacotes.find(
          (p) => String(p.categoria ?? '').toUpperCase() === categoria.toUpperCase()
        );
        if (!encontrado?.id) {
          throw new Error(`Pacote da categoria ${categoria} não encontrado na API.`);
        }
        return encontrado.id;
      })
    );
  }

  /** GET /pedidos-pacote/{id}: busca detalhes de um pedido específico. */
  buscarPorId(pedidoId: number): Observable<PedidoPacote> {
    return this.http.get<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}`).pipe(
      timeout(15000),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'buscar os detalhes do pedido')))
    );
  }

  /** POST /pedidos-pacote: cria o pedido e reserva as aulas semanais geradas pelo back-end. */
  criar(
    dados: Omit<CriarPedidoPacoteRequest, 'pacoteId'>,
    categoria: string
  ): Observable<PedidoPacote> {
    return this.buscarPacoteId(categoria, dados.instrutorId).pipe(
      switchMap((pacoteId) =>
        this.http.post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote`, { ...dados, pacoteId })
      ),
      timeout(20000),
      map((pedido) => {
        if (!pedido?.id || !Array.isArray(pedido.horarios)) {
          throw new Error('Resposta inesperada da API ao criar o pedido (faltam id ou horarios).');
        }
        return pedido;
      }),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'criar o pedido do pacote')))
    );
  }

  /** POST /pedidos-pacote/{id}/comprovante-informado: envia alunoId e comprovante em base64/url. */
  informarComprovante(
    pedidoId: number,
    alunoId: number,
    payload?: InformarComprovantePayload
  ): Observable<PedidoPacote> {
    const body = {
      alunoId,
      ...(payload?.comprovanteUrl ? { comprovanteUrl: payload.comprovanteUrl } : {}),
      ...(payload?.comprovanteNome ? { comprovanteNome: payload.comprovanteNome } : {}),
    };

    return this.http
      .post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}/comprovante-informado`, body)
      .pipe(
        timeout(20000),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'informar o comprovante')))
      );
  }

  /** GET /pedidos-pacote/aluno/{id}: pedidos do aluno, do mais recente para o mais antigo. */
  listarPorAluno(alunoId: number): Observable<PedidoPacote[]> {
    return this.http.get<PedidoPacote[]>(`${this.apiUrl}/pedidos-pacote/aluno/${alunoId}`).pipe(
      timeout(15000),
      map((lista) => {
        if (!Array.isArray(lista)) throw new Error('Resposta inesperada da API ao listar seus pedidos.');
        return lista;
      }),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'carregar seus pedidos')))
    );
  }

  /**
   * POST /pedidos-pacote/{id}/cancelar: o aluno cancela o próprio pedido.
   * A API só aceita enquanto o pedido está PENDENTE_PAGAMENTO (ou EM_ANALISE após 72h)
   * e libera os horários que estavam reservados.
   */
  cancelar(pedidoId: number, alunoId: number): Observable<PedidoPacote> {
    return this.http
      .post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}/cancelar`, { alunoId })
      .pipe(
        timeout(20000),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'cancelar o pedido')))
      );
  }

  /** GET /pedidos-pacote/instrutor/{id}?status=... (se status for vazio/TODOS, traz todos) */
  listarPorInstrutor(instrutorId: number, status?: string): Observable<PedidoPacote[]> {
    let params = new HttpParams();
    if (status && status !== 'TODOS') {
      params = params.set('status', status);
    }

    return this.http
      .get<PedidoPacote[]>(`${this.apiUrl}/pedidos-pacote/instrutor/${instrutorId}`, { params })
      .pipe(
        timeout(15000),
        map((lista) => {
          if (!Array.isArray(lista)) throw new Error('Resposta inesperada da API ao listar pedidos.');
          return lista;
        }),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'carregar os pedidos')))
      );
  }

  /** POST /pedidos-pacote/{id}/aprovar */
  aprovar(pedidoId: number, instrutorId: number): Observable<PedidoPacote> {
    return this.http
      .post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}/aprovar`, { instrutorId })
      .pipe(
        timeout(20000),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'aprovar o pedido')))
      );
  }

  /** POST /pedidos-pacote/{id}/rejeitar */
  rejeitar(pedidoId: number, instrutorId: number, motivo: string): Observable<PedidoPacote> {
    return this.http
      .post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}/rejeitar`, { instrutorId, motivo })
      .pipe(
        timeout(20000),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'rejeitar o pedido')))
      );
  }

  private traduzirErro(erro: unknown, acao: string): Error {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return new Error(
          'Não foi possível conectar à API. Verifique se o servidor está em execução.'
        );
      }
      const corpo = erro.error;
      const mensagemApi =
        typeof corpo === 'string'
          ? corpo
          : (corpo?.message ?? corpo?.mensagem ?? corpo?.erro);
      if (typeof mensagemApi === 'string' && mensagemApi.trim()) {
        return new Error(mensagemApi.trim());
      }
      if (erro.status === 409) {
        return new Error('Este horário já foi reservado. Escolha outro horário.');
      }
      if (erro.status === 404) {
        return new Error(`Recurso não encontrado ao ${acao}.`);
      }
      return new Error(`Falha ao ${acao} (erro ${erro.status}). Tente novamente.`);
    }
    if (erro instanceof Error) {
      if (erro.name === 'TimeoutError') {
        return new Error(`Tempo esgotado ao ${acao}. Tente novamente.`);
      }
      return erro;
    }
    return new Error(`Falha ao ${acao}. Tente novamente.`);
  }
}