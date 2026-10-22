import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonIcon],
  template: `
    <ion-content class="auth-content" [fullscreen]="true">
      <div class="auth-hero"><h1 class="auth-logo">Guidaz</h1></div>
      <main class="auth-page">
        <h2 class="auth-title">Recuperar senha</h2>
        <p class="auth-hint">Informe o e-mail da sua conta e enviaremos as instruções para redefinir sua senha.</p>
        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <label class="field">
            <ion-icon name="mail-outline"></ion-icon>
            <input type="email" formControlName="email" placeholder="Insira o endereço de e-mail" autocomplete="email" />
          </label>
          <button class="btn-primary" type="submit">Enviar</button>
        </form>
        <p class="auth-footer"><a routerLink="/login"><strong>Voltar ao login</strong></a></p>
      </main>
    </ion-content>
  `,
})
export class EsqueciSenhaPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  constructor() {
    addIcons({ mailOutline });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return void this.toast.mostrar('Informe um e-mail válido.', 'erro');
    }
    // TODO: chamar a API de recuperação de senha
    void this.toast.mostrar('Se o e-mail existir, você receberá as instruções.', 'ok');
    void this.router.navigateByUrl('/login');
  }
}
