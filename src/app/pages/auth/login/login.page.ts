import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonButton, IonItem, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, logoApple, logoFacebook, mailOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonItem, IonButton, IonInput, ReactiveFormsModule, RouterLink, IonContent, IonIcon],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly verSenha = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logoFacebook, logoApple });
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.toast.mostrar('Informe um e-mail válido e a senha.', 'erro');
      return;
    }

    const { email, senha } = this.form.getRawValue();

    this.auth.login(email, senha).subscribe({
      next: (res) => {
        if (!res.ok) {
          void this.toast.mostrar(res.erro, 'erro');
          return;
        }
        void this.toast.mostrar('Login efetuado com sucesso!', 'ok');
        void this.router.navigateByUrl(this.auth.rotaInicial(res.perfil));
      },
      error: () => {
        void this.toast.mostrar('Erro de comunicação com o servidor.', 'erro');
      }
    });
  }

  loginSocial(provedor: string): void {
    void this.toast.mostrar(`Login com ${provedor} estará disponível em breve.`, 'info');
  }
}