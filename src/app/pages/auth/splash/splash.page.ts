import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { fadeAnimation } from '../../../core/animations/fade.animation';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
})
export class SplashPage implements OnInit, OnDestroy {
  private readonly nav = inject(NavController);
  private readonly auth = inject(AuthService);

  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.timer = setTimeout(() => this.navegar(), 3000);
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  aoFalharImagem() {
    console.error('Splash: não foi possível carregar assets/guidaz.png.');
  }

  private navegar() {
    const usuarioLogado = this.auth.usuario();

    const destino = usuarioLogado
      ? this.auth.rotaInicial(usuarioLogado.perfil)
      : '/login';

    void this.nav.navigateRoot(destino, {
      animated: true,
      animation: fadeAnimation,
    });
  }
}