import { Injectable, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

const CLASSE = 'carregando-pagina';
const ROTAS_IGNORADAS = ['/splash']; 
const ESTABILIZAR_MS = 100; 
const LIMITE_MS = 4000; 

@Injectable({ providedIn: 'root' })
export class CarregamentoService {
  private readonly router = inject(Router);

  private pendentes = 0;
  private escondido = false;
  private navegando = false;
  private timerEstavel?: ReturnType<typeof setTimeout>;
  private timerLimite?: ReturnType<typeof setTimeout>;

  constructor() {
    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.aoIniciarNavegacao(evento.url);
      } else if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError
      ) {
        this.navegando = false;
        this.verificar();
      }
    });
  }

  // Chamados pelo interceptor
  requisicaoIniciada() {
    this.pendentes++;
    clearTimeout(this.timerEstavel);
  }

  requisicaoFinalizada() {
    this.pendentes = Math.max(0, this.pendentes - 1);
    this.verificar();
  }

  private aoIniciarNavegacao(url: string) {
    if (ROTAS_IGNORADAS.some((r) => url.startsWith(r))) {
      this.mostrar();
      return;
    }
    this.navegando = true;
    this.esconder();
  }

  private esconder() {
    this.escondido = true;
    document.body.classList.add(CLASSE);
    clearTimeout(this.timerLimite);
    this.timerLimite = setTimeout(() => this.mostrar(), LIMITE_MS);
  }

  private verificar() {
    clearTimeout(this.timerEstavel);
    if (!this.escondido || this.navegando || this.pendentes > 0) return;
    this.timerEstavel = setTimeout(() => this.mostrar(), ESTABILIZAR_MS);
  }

  private mostrar() {
    this.escondido = false;
    this.navegando = false;
    clearTimeout(this.timerEstavel);
    clearTimeout(this.timerLimite);
    document.body.classList.remove(CLASSE);
  }
}