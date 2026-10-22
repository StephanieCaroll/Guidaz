import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmark, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { Perfil } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

const senhasIguais = (g: AbstractControl): ValidationErrors | null =>
  g.get('senha')?.value === g.get('confirmar')?.value ? null : { senhasDiferentes: true };

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'], 
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonIcon, IonItem, IonInput, IonButton],
})
export class CadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly perfil = signal<Perfil | null>(null);
  readonly verSenha = signal(false);
  readonly verConfirmar = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: senhasIguais },
  );

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, checkmark });
  }

  proximo(): void {
    this.form.markAllAsTouched();
    const { email, senha } = this.form.getRawValue();

    if (this.form.controls.email.invalid) return void this.toast.mostrar('Informe um e-mail válido.', 'erro');
    if (this.form.controls.senha.invalid) return void this.toast.mostrar('A senha deve ter ao menos 6 caracteres.', 'erro');
    if (this.form.hasError('senhasDiferentes')) return void this.toast.mostrar('As senhas não coincidem.', 'erro');

    const perfil = this.perfil();
    if (!perfil) return void this.toast.mostrar('Escolha se você é instrutor ou aluno.', 'erro');

    this.auth.draft.set({ email, senha, perfil });
    void this.router.navigateByUrl(perfil === 'instrutor' ? '/cadastro-instrutor' : '/cadastro-aluno');
  }
}