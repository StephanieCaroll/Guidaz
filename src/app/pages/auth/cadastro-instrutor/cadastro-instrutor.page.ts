import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSelect, IonSelectOption, IonInput, IonTextarea, LoadingController } from '@ionic/angular/standalone';
import { PATTERNS } from '../../../core/utils/masks';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DadosPessoaisComponent } from '../../../shared/components/dados-pessoais/dados-pessoais.component';

@Component({
  selector: 'app-cadastro-instrutor',
  templateUrl: './cadastro-instrutor.page.html',
  styleUrls: ['./cadastro-instrutor.page.scss'],
  imports: [ReactiveFormsModule, IonContent, IonSelect, IonSelectOption, IonInput, IonTextarea, DadosPessoaisComponent],
})
export class CadastroInstrutorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly loadingController = inject(LoadingController);

  readonly categorias = ['A', 'B', 'AB', 'C', 'D', 'E'];

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    telefone: ['', [Validators.required, Validators.pattern(PATTERNS.telefone)]],
    nascimento: ['', [Validators.required, Validators.pattern(PATTERNS.data)]],
    cpf: ['', [Validators.required, Validators.pattern(PATTERNS.cpf)]],
    cep: ['', [Validators.required, Validators.pattern(PATTERNS.cep)]],
    logradouro: ['', Validators.required],
    bairro: ['', Validators.required],
    cidade: ['', Validators.required],
    numero: ['', Validators.required],
    complemento: [''],
    categorias: [[] as string[], [Validators.required, Validators.minLength(1)]],
    veiculoModelo: ['', Validators.required],
    veiculoAno: ['', Validators.required],
    veiculoPlaca: ['', Validators.required],
    biografia: ['', Validators.maxLength(300)],
  });

  ngOnInit(): void {
    if (this.auth.draft()?.perfil !== 'instrutor') void this.router.navigateByUrl('/cadastro');
  }

  async criarConta(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.toast.mostrar('Revise os campos destacados.', 'erro');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'A cadastrar instrutor...',
      spinner: 'crescent'
    });
    await loading.present();

    const rawValues = this.form.getRawValue();

    const categoriasFormatadas = Array.isArray(rawValues.categorias) 
      ? rawValues.categorias.join(', ') 
      : rawValues.categorias;

    const dadosFormulario = {
      ...rawValues,
      categorias: rawValues.categorias
    };

    const dadosEspecificosApi = {
      ...rawValues,
      categoriasLecionadas: categoriasFormatadas,
      veiculoAno: rawValues.veiculoAno ? Number(rawValues.veiculoAno) : null
    };

    this.auth.cadastrar(dadosFormulario, dadosEspecificosApi).subscribe({
      next: async (res) => {
        await loading.dismiss();
        if (!res.ok) {
          void this.toast.mostrar(res.erro, 'erro');
          return;
        }
        void this.toast.mostrar('Conta de instrutor criada com sucesso!', 'ok');
        void this.router.navigateByUrl(this.auth.rotaInicial(res.perfil));
      },
      error: async () => {
        await loading.dismiss(); 
        void this.toast.mostrar('Erro de comunicação com o servidor.', 'erro');
      }
    });
  }
}