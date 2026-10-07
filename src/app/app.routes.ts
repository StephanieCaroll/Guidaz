import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder/Inbox',
    pathMatch: 'full',
  },
  {
    path: 'folder/:folder',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/auth/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'agenda-disponibilidade',
    loadComponent: () => import('./pages/instrutor/agenda-disponibilidade/agenda-disponibilidade.page').then( m => m.AgendaDisponibilidadePage)
  },
  {
    path: 'historico-avaliacoes',
    loadComponent: () => import('./pages/instrutor/historico-avaliacoes/historico-avaliacoes.page').then( m => m.HistoricoAvaliacoesPage)
  },
  {
    path: 'gestao-alunos',
    loadComponent: () => import('./pages/instrutor/gestao-alunos/gestao-alunos.page').then( m => m.GestaoAlunosPage)
  },
  {
    path: 'agendamento-aulas',
    loadComponent: () => import('./pages/aluno/agendamento-aulas/agendamento-aulas.page').then( m => m.AgendamentoAulasPage)
  },
  {
    path: 'saldo-aulas',
    loadComponent: () => import('./pages/aluno/saldo-aulas/saldo-aulas.page').then( m => m.SaldoAulasPage)
  },
  {
    path: 'avaliacao-aula',
    loadComponent: () => import('./pages/aluno/avaliacao-aula/avaliacao-aula.page').then( m => m.AvaliacaoAulaPage)
  },
  {
    path: 'pacotes',
    loadComponent: () => import('./pages/comum/pacotes/pacotes.page').then( m => m.PacotesPage)
  },
  {
    path: 'pagamento-pix',
    loadComponent: () => import('./pages/comum/pagamento-pix/pagamento-pix.page').then( m => m.PagamentoPixPage)
  },
];
