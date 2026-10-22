export type Perfil = 'instrutor' | 'aluno';

export interface DadosCadastro {
  nome: string;
  telefone: string;
  nascimento: string;
  cpf: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  numero: string;
  complemento: string;
  /** Instrutor: categorias que leciona. Aluno: categoria pretendida. */
  categorias: string[];
  veiculo?: string;
  biografia?: string;
}

export interface Usuario extends DadosCadastro {
  id: string;
  email: string;
  perfil: Perfil;
}

/** Guarda e-mail/senha/perfil entre a tela "Cadastro" e o formulário completo. */
export interface CadastroDraft {
  email: string;
  senha: string;
  perfil: Perfil;
}
