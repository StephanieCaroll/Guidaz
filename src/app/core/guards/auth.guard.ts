import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { Perfil } from '../models/user.model';
import { AuthService } from '../services/auth.service';

function isValidEntityId(rawId: string | null): boolean {
  if (!rawId || rawId === 'undefined' || rawId === 'null') {
    return false;
  }
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0;
}

function normalizarPerfil(perfil: unknown): Perfil | null {
  const valor = String(perfil ?? '').trim().toLowerCase();
  if (valor === 'instrutor') return 'instrutor';
  if (valor === 'aluno') return 'aluno';
  return null;
}

/** Só entra quem está logado. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.usuario();

  if (!auth.logado() || !user) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

/** Só entra quem tem o perfil indicado (instrutor ou aluno). */
export const perfilGuard = (perfil: Perfil): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.usuario();
  if (!auth.logado() || !user) {
    return router.createUrlTree(['/login']);
  }

  const perfilAtual = normalizarPerfil(user.perfil);
  if (!perfilAtual) {
    return router.createUrlTree(['/login']);
  }

  return perfilAtual === perfil
    ? true
    : router.createUrlTree([auth.rotaInicial(perfilAtual)]);
};

/** Telas públicas (login/cadastro): quem já está logado vai direto para a home. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.usuario();
  const perfilAtual = normalizarPerfil(user?.perfil);

  if (auth.logado() && user && perfilAtual) {
    return router.createUrlTree([auth.rotaInicial(perfilAtual)]);
  }
  return true;
};

/** Valida parâmetro numérico de rota */
export const idParamGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const paramName = (route.data?.['idParam'] as string) || 'id';
  const rawId = route.paramMap.get(paramName);

  if (isValidEntityId(rawId)) {
    return true;
  }

  const user = auth.usuario();
  const perfilAtual = normalizarPerfil(user?.perfil);
  const fallbackRoute =
    (route.data?.['fallbackRoute'] as string) ||
    (user && perfilAtual ? auth.rotaInicial(perfilAtual) : '/login');

  return router.createUrlTree([fallbackRoute]);
};