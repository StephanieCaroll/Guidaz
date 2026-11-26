import { Component, OnDestroy, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { fadeAnimation } from '../../../core/animations/fade.animation';
import { Perfil } from '../../../core/models/user.model';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
})
export class SplashPage implements OnDestroy {
  private readonly nav = inject(NavController);
  private readonly auth = inject(AuthService);

  // A logo só começa a animar quando a página realmente aparece.
  visivel = signal(false);

  private timer?: ReturnType<typeof setTimeout>;

  // Disparado pelo ion-router-outlet quando a transição de entrada termina.
  ionViewDidEnter() {
    this.visivel.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.navegar(), 3000);
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  aoFalharImagem() {
    console.error('Splash: não foi possível carregar assets/guidaz.png.');
  }

  private resolverPerfilValido(perfil: unknown): Perfil | null {
    const valor = String(perfil ?? '').trim().toLowerCase();
    if (valor === 'instrutor') return 'instrutor';
    if (valor === 'aluno') return 'aluno';
    return null;
  }

  private temIdValido(usuario: any): boolean {
    const idBruto =
      usuario?.id ??
      usuario?.codigo ??
      usuario?.idInstrutor ??
      usuario?.idAluno ??
      usuario?.idUsuario;
    if (idBruto === null || idBruto === undefined || idBruto === '') return false;
    const numero = Number(idBruto);
    return Number.isInteger(numero) && numero > 0;
  }

  private navegar() {
    const usuarioLogado = this.auth.usuario();
    const perfilValido = this.resolverPerfilValido(usuarioLogado?.perfil);
    const sessaoValida =
      this.auth.logado() && !!usuarioLogado && !!perfilValido && this.temIdValido(usuarioLogado);

    const destino = sessaoValida && perfilValido
      ? this.auth.rotaInicial(perfilValido)
      : '/login';

    // Sessão corrompida: o logout cuida de limpar e redirecionar.
    if (!sessaoValida && usuarioLogado) {
      this.auth.logout();
      return;
    }

    void this.nav.navigateRoot(destino, {
      animated: true,
      animation: fadeAnimation,
    });
  }
}