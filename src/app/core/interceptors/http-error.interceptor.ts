import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  const token = localStorage.getItem('guidaz_token');

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensagem = 'Ocorreu um erro inesperado. Tente novamente.';

      if (error.status === 0) {
        mensagem = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (error.status === 401) {
        mensagem = 'Sessão expirada ou não autorizada. Faça login novamente.';
        localStorage.removeItem('guidaz_token');
        localStorage.removeItem('guidaz_user');
        router.navigateByUrl('/login', { replaceUrl: true });
      } else if (error.status === 403) {
        mensagem = 'Você não tem permissão para realizar esta ação.';
      } else if (error.status === 404) {
        mensagem = error.error?.mensagem || error.error?.erro || 'Recurso não encontrado.';
      } else if (error.status === 400) {
        mensagem = error.error?.mensagem || error.error?.erro || 'Dados inválidos enviados.';
      } else if (error.status >= 500) {
        mensagem = 'Erro interno no servidor. Tente novamente em instantes.';
      }

      toastService.mostrar(mensagem, 'erro');
      return throwError(() => error);
    })
  );
};