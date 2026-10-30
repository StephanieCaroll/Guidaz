
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import {
  CadastroDraft,
  DadosCadastro,
  Perfil,
  Usuario
} from '../models/user.model';

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
    return perfil === 'instrutor'
      ? '/instrutor/home'
      : '/aluno/home';
  }

  login(email: string, senha: string): Observable<Resultado> {
    return new Observable<Resultado>((observer) => {
      this.http.get<any[]>(`${this.apiUrl}/alunos`).subscribe({
        next: (alunos) => {
          const alunoEncontrado = alunos.find(
            (u) =>
              u.email?.toLowerCase() === email.trim().toLowerCase() &&
              u.senha === senha
          );

          if (alunoEncontrado) {
            this.abrirSessao({
              ...alunoEncontrado,
              perfil: 'aluno'
            });

            observer.next({ ok: true, perfil: 'aluno' });
            observer.complete();
            return;
          }

          this.http.get<any[]>(`${this.apiUrl}/instrutores`).subscribe({
            next: (instrutores) => {
              const instrutorEncontrado = instrutores.find(
                (u) =>
                  u.email?.toLowerCase() === email.trim().toLowerCase() &&
                  u.senha === senha
              );

              if (instrutorEncontrado) {
                this.abrirSessao({
                  ...instrutorEncontrado,
                  perfil: 'instrutor'
                });

                observer.next({
                  ok: true,
                  perfil: 'instrutor'
                });

                observer.complete();
              } else {
                observer.next({
                  ok: false,
                  erro: 'E-mail ou senha incorretos.'
                });

                observer.complete();
              }
            },

            error: () => {
              observer.next({
                ok: false,
                erro: 'Erro ao conectar com o servidor.'
              });

              observer.complete();
            }
          });
        },

        error: () => {
          observer.next({
            ok: false,
            erro: 'Erro ao conectar com o servidor.'
          });

          observer.complete();
        }
      });
    });
  }

  cadastrar(
    dados: DadosCadastro,
    dadosEspecificos?: any
  ): Observable<Resultado> {
    const draft = this.draft();

    if (!draft) {
      return of({
        ok: false,
        erro: 'Preencha primeiro e-mail e senha.'
      });
    }

    const payload = {
      ...dados,
      email: draft.email.trim(),
      senha: draft.senha,
      perfil: draft.perfil,
      ...dadosEspecificos
    };

    const endpoint =
      draft.perfil === 'instrutor'
        ? `${this.apiUrl}/instrutores/cadastrar`
        : `${this.apiUrl}/alunos/cadastrar`;

    return new Observable<Resultado>((observer) => {
      this.http.post(endpoint, payload, {
        responseType: 'text'
      }).subscribe({
        next: () => {
          this.abrirSessao({
            ...payload,
            perfil: draft.perfil
          });

          this.draft.set(null);

          observer.next({
            ok: true,
            perfil: draft.perfil
          });

          observer.complete();
        },

        error: (err) => {
          console.error('Erro ao cadastrar usuário:', err);

          observer.next({
            ok: false,
            erro: 'Erro ao realizar cadastro no servidor.'
          });

          observer.complete();
        }
      });
    });
  }

  logout(): void {
    this._usuario.set(null);

    try {
      localStorage.removeItem(KEY_SESSION);
    } catch (erro) {
      console.error('Erro ao encerrar sessão:', erro);
    }

    void this.router.navigateByUrl('/login');
  }

  private abrirSessao(reg: any): void {
    const { senha: _senha, ...usuario } = reg;

    this._usuario.set(usuario);

    try {
      localStorage.setItem(KEY_SESSION, JSON.stringify(usuario));
    } catch (erro) {
      console.error('Erro ao salvar sessão:', erro);
    }
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
