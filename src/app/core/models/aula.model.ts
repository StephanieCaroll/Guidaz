export type StatusAula = 'agendada' | 'concluida' | 'falta' | 'cancelada';

export interface AulaHistorico {
  id: number;
  data: string;        // ISO: '2026-09-10'
  titulo: string;      // ex: 'Aula Prática - Categoria B'
  pessoa: string;      // aluno vê o instrutor / instrutor vê o aluno
  status: StatusAula;
}
