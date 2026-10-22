import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { maskCep, maskCpf, maskData, maskTelefone } from '../../../core/utils/masks';

type Campo = 'telefone' | 'nascimento' | 'cpf' | 'cep';

@Component({
  selector: 'app-dados-pessoais',
  imports: [ReactiveFormsModule],
  templateUrl: './dados-pessoais.component.html',
  styleUrls: ['./dados-pessoais.component.scss'], 
})
export class DadosPessoaisComponent {
  readonly group = input.required<FormGroup>();

  private readonly masks: Record<Campo, (v: string) => string> = {
    telefone: maskTelefone,
    nascimento: maskData,
    cpf: maskCpf,
    cep: maskCep,
  };

  mascarar(ev: Event, campo: Campo): void {
    const el = ev.target as HTMLInputElement;
    const valor = this.masks[campo](el.value);
    el.value = valor;
    this.group().get(campo)?.setValue(valor, { emitEvent: false });
    if (campo === 'cep' && valor.length === 9) void this.buscarCep(valor);
  }

  private async buscarCep(cep: string): Promise<void> {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const d = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string };
      if (d.erro) return;
      this.group().patchValue({
        logradouro: d.logradouro ?? '',
        bairro: d.bairro ?? '',
        cidade: d.localidade ?? '',
      });
    } catch {
     
    }
  }
}