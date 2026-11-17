export type StatusPedidoPacote =
  | 'PENDENTE_PAGAMENTO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'CANCELADO';

export interface PacoteApi {
  id: number;
  nome?: string;
  categoria?: string;
  quantidadeAulas?: number;
  preco?: number;
  instrutorId?: number | null;
  [campo: string]: unknown;
}

export interface CriarPedidoPacoteRequest {
  alunoId: number;
  instrutorId: number;
  pacoteId: number;
  dataPrimeiraAula: string; // AAAA-MM-DD
  horaInicio: string;       // HH:mm
}

export interface HorarioPedidoPacote {
  data: string;       // AAAA-MM-DD
  horaInicio: string; // HH:mm[:ss]
  horaFim: string;    // HH:mm[:ss]
}

export interface PedidoPacote {
  id: number;
  status: StatusPedidoPacote;
  horarios: HorarioPedidoPacote[];
  alunoId?: number;
  alunoNome?: string;
  instrutorId?: number;
  instrutorNome?: string;
  pacoteId?: number;
  nomePacote?: string;
  categoria?: string;
  quantidadeAulas?: number;
  precoTotal?: number;
  criadoEm?: string;
  comprovanteInformadoEm?: string | null;
  analisadoEm?: string | null;
  canceladoEm?: string | null;
  motivoRejeicao?: string | null;
}