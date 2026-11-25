import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const httpErr = error instanceof HttpErrorResponse ? error : null;
      const status = httpErr?.status ?? (error as { status?: number })?.status ?? 0;

      const rawPayload = httpErr?.error ?? (error as { error?: unknown })?.error;
      const payloadMessage =
        typeof rawPayload === 'string'
          ? rawPayload
          : (rawPayload as { message?: string; error?: string } | null)?.message ||
            (rawPayload as { message?: string; error?: string } | null)?.error ||
            '';

      const fallbackMessage = (error as { message?: string })?.message || '';
      const combinedMessage = `${payloadMessage} ${fallbackMessage}`.toLowerCase();

      const isNotFound =
        status === 404 ||
        combinedMessage.includes('recurso não encontrado') ||
        combinedMessage.includes('recurso nao encontrado') ||
        combinedMessage.includes('not found');

      if (isNotFound) {
        return throwError(() => ({
          status,
          error: rawPayload,
          message: '',
          friendlyMessage: '',
          silentNotFound: true,
        }));
      }

      if (status === 0) {
        toastService.mostrar?.('Não foi possível conectar ao servidor.', 'warning');
      } else if (status >= 500) {
        toastService.mostrar?.('Erro interno no servidor. Tente novamente.', 'danger');
      }

      return throwError(() => error);
    })
  );
};