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

/** Só entra quem está logado. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Só entra quem tem o perfil indicado (instrutor ou aluno). */
export const perfilGuard = (perfil: Perfil): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.usuario();
  if (!user) return router.createUrlTree(['/login']);
  return user.perfil === perfil ? true : router.createUrlTree([auth.rotaInicial(user.perfil)]);
};

/** Telas públicas (login/cadastro): quem já está logado vai direto para a home. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const user = auth.usuario();
  return user ? inject(Router).createUrlTree([auth.rotaInicial(user.perfil)]) : true;
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

  const fallbackRoute =
    (route.data?.['fallbackRoute'] as string) ||
    (auth.usuario() ? auth.rotaInicial(auth.usuario()!.perfil) : '/login');

  return router.createUrlTree([fallbackRoute]);
};