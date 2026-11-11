import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CriarPedidoPacoteRequest, PacoteApi, PedidoPacote } from '../models/pedido-pacote.model';

@Injectable({ providedIn: 'root' })
export class PedidoPacoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Busca o id do pacote na API casando pela categoria usada na tela de pacotes. */
  buscarPacoteId(categoria: string): Observable<number> {
    return this.http.get<PacoteApi[]>(`${this.apiUrl}/pacotes`).pipe(
      timeout(15000),
      map((pacotes) => {
        const encontrado = pacotes.find(
          (p) => String(p.categoria ?? '').toUpperCase() === categoria.toUpperCase()
        );
        if (!encontrado?.id) {
          throw new Error(`Pacote da categoria ${categoria} não encontrado na API.`);
        }
        return encontrado.id;
      }),
      catchError((erro) => throwError(() => this.traduzirErro(erro, 'carregar o pacote')))
    );
  }

  /** POST /pedidos-pacote: cria o pedido e reserva as aulas semanais geradas pelo back-end. */
  criar(dados: Omit<CriarPedidoPacoteRequest, 'pacoteId'>, categoria: string): Observable<PedidoPacote> {
    return this.buscarPacoteId(categoria).pipe(
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

  /** POST /pedidos-pacote/{id}/comprovante-informado: nenhum arquivo é enviado. */
  informarComprovante(pedidoId: number, alunoId: number): Observable<PedidoPacote> {
    return this.http
      .post<PedidoPacote>(`${this.apiUrl}/pedidos-pacote/${pedidoId}/comprovante-informado`, { alunoId })
      .pipe(
        timeout(20000),
        catchError((erro) => throwError(() => this.traduzirErro(erro, 'informar o comprovante')))
      );
  }

  /** GET /pedidos-pacote/instrutor/{id}?status=EM_ANALISE */
  listarPorInstrutor(instrutorId: number, status: string = 'EM_ANALISE'): Observable<PedidoPacote[]> {
    return this.http
      .get<PedidoPacote[]>(`${this.apiUrl}/pedidos-pacote/instrutor/${instrutorId}`, { params: { status } })
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
  /** Converte erros HTTP/rede em uma mensagem clara (lança Error com texto exibível). */
  private traduzirErro(erro: unknown, acao: string): Error {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return new Error('Não foi possível conectar à API. Verifique se o servidor está em execução.');
      }
      const corpo = erro.error;
      const mensagemApi =
        typeof corpo === 'string' ? corpo : (corpo?.message ?? corpo?.mensagem ?? corpo?.erro);
      if (typeof mensagemApi === 'string' && mensagemApi.trim()) {
        return new Error(mensagemApi.trim());
      }
      if (erro.status === 409) return new Error('Este horário já foi reservado. Escolha outro horário.');
      if (erro.status === 404) return new Error(`Recurso não encontrado ao ${acao}.`);
      return new Error(`Falha ao ${acao} (erro ${erro.status}). Tente novamente.`);
    }
    if (erro instanceof Error) {
      if (erro.name === 'TimeoutError') return new Error(`Tempo esgotado ao ${acao}. Tente novamente.`);
      return erro;
    }
    return new Error(`Falha ao ${acao}. Tente novamente.`);
  }
}
