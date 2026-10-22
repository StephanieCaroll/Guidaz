import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonIcon, IonItem, IonInput, IonButton],
  template: `
    <ion-content class="auth-bg ion-no-padding" [fullscreen]="true">
    
      <div class="header-glow">
        <img src="assets/logo.png" alt="Guidaz Logo" class="logo-img">
      </div>

      <div class="form-container">
        <h2 class="page-title">Recuperar senha</h2>
        <p class="auth-hint">Informe o e-mail da sua conta e enviaremos as instruções para redefinir sua senha.</p>

        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
         
          <ion-item class="custom-input" lines="none">
            <ion-icon name="mail-outline" slot="start" class="input-icon"></ion-icon>
            <ion-input type="email" formControlName="email" placeholder="Insira o endereço de e-mail" autocomplete="email"></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" class="main-btn">
            Enviar instruções
          </ion-button>
        </form>

        <p class="auth-footer">
          <a routerLink="/login">
            <ion-icon name="arrow-back-outline" style="vertical-align: middle; margin-right: 4px;"></ion-icon>
            Voltar ao login
          </a>
        </p>
      </div>
    </ion-content>
  `,
  styleUrls: ['./esqueci-senha.page.scss'],
})
export class EsqueciSenhaPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  constructor() {
    addIcons({ mailOutline, arrowBackOutline });
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