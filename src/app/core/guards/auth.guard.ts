import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perfil } from '../models/user.model';
import { AuthService } from '../services/auth.service';

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
