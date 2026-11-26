import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { CarregamentoService } from './carregamento.service';

export const carregamentoInterceptor: HttpInterceptorFn = (req, next) => {
  const carregamento = inject(CarregamentoService);
  carregamento.requisicaoIniciada();
  return next(req).pipe(finalize(() => carregamento.requisicaoFinalizada()));
};