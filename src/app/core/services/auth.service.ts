import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CadastroDraft, DadosCadastro, Perfil, Usuario } from '../models/user.model';

type Registro = Usuario & { senha: string };
type Resultado = { ok: true; perfil: Perfil } | { ok: false; erro: string };

const KEY_USERS = 'guidaz_users';
const KEY_SESSION = 'guidaz_session';

/**
 * AuthService MOCK (localStorage). Troque login/cadastrar por chamadas à sua API
 * (e nunca guarde senha em texto puro em produção).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  /** Dados da etapa 1 do cadastro (e-mail, senha, perfil). */
  readonly draft = signal<CadastroDraft | null>(null);

  private readonly _usuario = signal<Usuario | null>(this.lerSessao());
  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._usuario() !== null);

  rotaInicial(perfil: Perfil): string {
    return perfil === 'instrutor' ? '/instrutor/home' : '/aluno/home';
  }

  login(email: string, senha: string): Resultado {
    const reg = this.lerUsuarios().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha,
    );
    if (!reg) return { ok: false, erro: 'E-mail ou senha incorretos.' };
    this.abrirSessao(reg);
    return { ok: true, perfil: reg.perfil };
  }

  cadastrar(dados: DadosCadastro): Resultado {
    const draft = this.draft();
    if (!draft) return { ok: false, erro: 'Preencha primeiro e-mail e senha.' };

    const usuarios = this.lerUsuarios();
    if (usuarios.some((u) => u.email.toLowerCase() === draft.email.toLowerCase())) {
      return { ok: false, erro: 'Este e-mail já está cadastrado.' };
    }
    if (usuarios.some((u) => u.cpf === dados.cpf)) {
      return { ok: false, erro: 'Este CPF já está cadastrado.' };
    }

    const novo: Registro = {
      ...dados,
      id: crypto.randomUUID(),
      email: draft.email.trim(),
      senha: draft.senha,
      perfil: draft.perfil,
    };
    this.salvarUsuarios([...usuarios, novo]);
    this.abrirSessao(novo);
    this.draft.set(null);
    return { ok: true, perfil: novo.perfil };
  }

  logout(): void {
    this._usuario.set(null);
    try { localStorage.removeItem(KEY_SESSION); } catch { /* ignore */ }
    void this.router.navigateByUrl('/login');
  }

  // ---- storage ----
  private abrirSessao(reg: Registro): void {
    const { senha: _senha, ...usuario } = reg;
    this._usuario.set(usuario);
    try { localStorage.setItem(KEY_SESSION, JSON.stringify(usuario)); } catch { /* ignore */ }
  }

  private lerSessao(): Usuario | null {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch { return null; }
  }

  private lerUsuarios(): Registro[] {
    try {
      return JSON.parse(localStorage.getItem(KEY_USERS) ?? '[]') as Registro[];
    } catch { return []; }
  }

  private salvarUsuarios(lista: Registro[]): void {
    try { localStorage.setItem(KEY_USERS, JSON.stringify(lista)); } catch { /* ignore */ }
  }
}
