import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { CadastroDraft, DadosCadastro, Perfil, Usuario } from '../models/user.model';
import { environment } from '../../../environments/environment';

type Resultado =
  | { ok: true; perfil: Perfil }
  | { ok: false; erro: string };

const KEY_SESSION = 'guidaz_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly draft = signal<CadastroDraft | null>(null);

  private readonly _usuario = signal<Usuario | null>(this.lerSessao());
  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._usuario() !== null);

  rotaInicial(perfil: Perfil): string {
    return perfil === 'instrutor' ? '/instrutor/home' : '/aluno/home';
  }

  private endpointUsuario(): string {
    const u = this._usuario();
    if (!u) return '';
    return u.perfil === 'instrutor'
      ? `${this.apiUrl}/instrutores`
      : `${this.apiUrl}/alunos`;
  }

  // LOGIN 
  login(email: string, senha: string): Observable<Resultado> {
    return new Observable<Resultado>((observer) => {
      this.http.get<any[]>(`${this.apiUrl}/alunos`).subscribe({
        next: (alunos) => {
          const aluno = alunos.find(
            (u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
          );

          if (aluno) {
            // Busca forçada do ID
            const idForcado = aluno.id || aluno.codigo || aluno.idAluno || aluno.idUsuario;
            this.abrirSessao({ ...aluno, id: idForcado, perfil: 'aluno' });
            observer.next({ ok: true, perfil: 'aluno' });
            observer.complete();
            return;
          }

          this.http.get<any[]>(`${this.apiUrl}/instrutores`).subscribe({
            next: (instrutores) => {
              const instrutor = instrutores.find(
                (u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
              );

              if (instrutor) {
                // Busca forçada do ID
                const idForcado = instrutor.id || instrutor.codigo || instrutor.idInstrutor || instrutor.idUsuario;
                this.abrirSessao({ ...instrutor, id: idForcado, perfil: 'instrutor' });
                observer.next({ ok: true, perfil: 'instrutor' });
              } else {
                observer.next({ ok: false, erro: 'E-mail ou senha incorretos.' });
              }
              observer.complete();
            },
            error: () => {
              observer.next({ ok: false, erro: 'Erro ao conectar com o servidor.' });
              observer.complete();
            }
          });
        },
        error: () => {
          observer.next({ ok: false, erro: 'Erro ao conectar com o servidor.' });
          observer.complete();
        }
      });
    });
  }

  // CADASTRO
  cadastrar(dados: DadosCadastro, dadosEspecificos?: any): Observable<Resultado> {
    const draft = this.draft();
    if (!draft) return of({ ok: false, erro: 'Preencha primeiro e-mail e senha.' });

    const payload = { ...dados, email: draft.email.trim(), senha: draft.senha, perfil: draft.perfil, ...dadosEspecificos };
    const endpoint = draft.perfil === 'instrutor'
      ? `${this.apiUrl}/instrutores/cadastrar`
      : `${this.apiUrl}/alunos/cadastrar`;

    return new Observable<Resultado>((observer) => {
      this.http.post(endpoint, payload, { responseType: 'text' }).subscribe({
        next: () => {
          const listaEndpoint = draft.perfil === 'instrutor' ? '/instrutores' : '/alunos';
          this.http.get<any[]>(`${this.apiUrl}${listaEndpoint}`).subscribe(lista => {
            const novoUsuario = lista.find(u => u.email === draft.email);
            if (novoUsuario) {
              const idForcado = novoUsuario.id || novoUsuario.codigo || novoUsuario.idAluno || novoUsuario.idInstrutor;
              this.abrirSessao({ ...novoUsuario, id: idForcado, perfil: draft.perfil });
            } else {
              this.abrirSessao({ ...payload, perfil: draft.perfil });
            }
            this.draft.set(null);
            observer.next({ ok: true, perfil: draft.perfil });
            observer.complete();
          });
        },
        error: (err) => {
          observer.next({ ok: false, erro: 'Erro ao realizar cadastro no servidor.' });
          observer.complete();
        }
      });
    });
  }

  // BUSCAR DO BANCO
  buscarDoBanco(): Observable<Usuario | null> {
    const atual = this._usuario();
    if (!atual) return of(null);

    const id = atual.id || (atual as any).codigo || (atual as any).idAluno || (atual as any).idInstrutor;

    // Trava de segurança: se não tiver ID, nem tenta buscar pra não dar erro 400
    if (!id) {
      console.warn('Sem ID na sessão para buscar. Usando os dados locais.');
      return of(atual);
    }

    const endpoint = atual.perfil === 'instrutor'
      ? `${this.apiUrl}/instrutores/${id}`
      : `${this.apiUrl}/alunos/${id}`;

    return this.http.get<Usuario>(endpoint).pipe(
      tap((usuarioBanco: any) => {
        if (usuarioBanco) {
          const idBanco = usuarioBanco.id || usuarioBanco.codigo || usuarioBanco.idAluno || usuarioBanco.idInstrutor;
          const atualizado: Usuario = {
             ...atual,
             ...usuarioBanco,
             id: idBanco || id,
             perfil: atual.perfil
          };
          this._usuario.set(atualizado);
          this.salvarSessao(atualizado);
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar usuário do banco:', err);
        return of(atual);
      })
    );
  }

  // ATUALIZAR PERFIL
  atualizarPerfil(dadosNovos: Record<string, unknown>): Observable<Usuario> {
    const atual = this._usuario();
    const id = atual?.id || (atual as any)?.codigo || (atual as any)?.idAluno || (atual as any)?.idInstrutor;

    if (!atual || !id) {
      console.error('Tentativa de atualizar sem ID na sessão:', atual);
      return throwError(() => new Error('ID_DO_USUARIO_INVALIDO'));
    }

    const endpoint = this.endpointUsuario();
    const url = `${endpoint}/${id}`;
    const payloadCompleto = { ...atual, ...dadosNovos, id: id };

    delete (payloadCompleto as any).senha;
    delete (payloadCompleto as any).perfil;

    return this.http.put(url, payloadCompleto, { responseType: 'text' }).pipe(
      map((resp: any) => {
        let respostaJson: any = null;
        try { respostaJson = resp ? JSON.parse(resp) : null; } catch (e) {}

        const atualizado: Usuario = {
          ...atual,
          ...dadosNovos,
          ...(respostaJson ?? {}),
          id: id,
          perfil: atual.perfil
        } as Usuario;

        this._usuario.set(atualizado);
        this.salvarSessao(atualizado);
        return atualizado;
      }),
      catchError((err) => {
        console.error('Erro real na API ao atualizar:', err);
        return throwError(() => err);
      })
    );
  }

  // UPLOAD FOTO DE PERFIL
  uploadFoto(file: File): Observable<Usuario> {
    const usuario = this._usuario();
    const id = usuario?.id || (usuario as any)?.codigo || (usuario as any)?.idAluno || (usuario as any)?.idInstrutor;

    if (!usuario || !id) {
      return throwError(() => new Error('USUARIO_NAO_LOGADO'));
    }

    const endpoint = this.endpointUsuario();
    const url = `${endpoint}/${id}/foto`;

    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<Usuario>(url, formData).pipe(
      map((resp: any) => {
        let usuarioRetornado = resp;
        if (typeof resp === 'string') {
          try { usuarioRetornado = JSON.parse(resp); } catch (e) {}
        }

        const atualizado: Usuario = {
          ...usuario,
          ...(usuarioRetornado ?? {}),
          id: id,
          perfil: usuario.perfil
        };

        this._usuario.set(atualizado);
        this.salvarSessao(atualizado);
        return atualizado;
      }),
      catchError((err) => {
        console.error('Erro ao fazer upload da foto de perfil:', err);
        return throwError(() => err);
      })
    );
  }

  // ALTERAR SENHA 
  alterarSenha(atualSenha: string, novaSenha: string): Observable<void> {
    const usuario = this._usuario();
    const id = usuario?.id || (usuario as any)?.codigo || (usuario as any)?.idAluno || (usuario as any)?.idInstrutor;

    if (!usuario || !id) return throwError(() => new Error('USUARIO_NAO_LOGADO'));

    const endpoint = this.endpointUsuario();
    const payload = { id: id, email: usuario.email, senhaAtual: atualSenha, novaSenha };

    return this.http.put<void>(`${endpoint}/alterar-senha`, payload).pipe(
      catchError((err) => {
        return throwError(() => new Error('SENHA_ATUAL'));
      })
    );
  }

  // LOGOUT E SESSÃO
  logout(): void {
    this._usuario.set(null);
    try { localStorage.removeItem(KEY_SESSION); } catch {}
    void this.router.navigateByUrl('/login');
  }

  private abrirSessao(reg: any): void {
    const { senha: _senha, ...usuario } = reg;
    this._usuario.set(usuario);
    this.salvarSessao(usuario);
  }

  private salvarSessao(usuario: Usuario): void {
    try { localStorage.setItem(KEY_SESSION, JSON.stringify(usuario)); } catch {}
  }

  private lerSessao(): Usuario | null {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}