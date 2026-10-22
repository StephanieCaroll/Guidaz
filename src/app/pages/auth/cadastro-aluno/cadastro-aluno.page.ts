import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSelect, IonSelectOption, LoadingController } from '@ionic/angular/standalone';
import { PATTERNS } from '../../../core/utils/masks';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DadosPessoaisComponent } from '../../../shared/components/dados-pessoais/dados-pessoais.component';

@Component({
  selector: 'app-cadastro-aluno',
  templateUrl: './cadastro-aluno.page.html',
  styleUrls: ['./cadastro-aluno.page.scss'], 
  imports: [ReactiveFormsModule, IonContent, IonSelect, IonSelectOption, DadosPessoaisComponent],
})
export class CadastroAlunoPage implements OnInit {
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
    categoria: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.auth.draft()?.perfil !== 'aluno') void this.router.navigateByUrl('/cadastro');
  }

  async criarConta(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.toast.mostrar('Revise os campos destacados.', 'erro');
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'A cadastrar conta...',
      spinner: 'crescent'
    });
    await loading.present();

    const { categoria, ...resto } = this.form.getRawValue();
    
    const dadosFormulario = {
      ...resto,
      categorias: [categoria]
    };

    const dadosEspecificosApi = {
      ...resto,
      categoriaPretendida: categoria
    };

    this.auth.cadastrar(dadosFormulario, dadosEspecificosApi).subscribe({
      next: async (res) => {
        await loading.dismiss(); 
        if (!res.ok) {
          void this.toast.mostrar(res.erro, 'erro');
          return;
        }
        void this.toast.mostrar('Conta de aluno criada com sucesso!', 'ok');
        void this.router.navigateByUrl(this.auth.rotaInicial(res.perfil));
      },
      error: async () => {
        await loading.dismiss(); 
        void this.toast.mostrar('Erro de comunicação com o servidor.', 'erro');
      }
    });
  }
}