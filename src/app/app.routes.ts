import { Routes } from '@angular/router';
import { authGuard, perfilGuard, visitanteGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ---------- Autenticação (públicas) ----------
  {
    path: 'login',
    canActivate: [visitanteGuard],
    title: 'Entrar | Guidaz',
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
    canActivate: [visitanteGuard],
    title: 'Criar conta | Guidaz',
    loadComponent: () => import('./pages/auth/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
  {
    path: 'cadastro-instrutor',
    canActivate: [visitanteGuard],
    title: 'Cadastro de instrutor | Guidaz',
    loadComponent: () => import('./pages/auth/cadastro-instrutor/cadastro-instrutor.page').then((m) => m.CadastroInstrutorPage),
  },
  {
    path: 'cadastro-aluno',
    canActivate: [visitanteGuard],
    title: 'Cadastro de aluno | Guidaz',
    loadComponent: () => import('./pages/auth/cadastro-aluno/cadastro-aluno.page').then((m) => m.CadastroAlunoPage),
  },
  {
    path: 'esqueci-senha',
    canActivate: [visitanteGuard],
    title: 'Recuperar senha | Guidaz',
    loadComponent: () => import('./pages/auth/esqueci-senha/esqueci-senha.page').then((m) => m.EsqueciSenhaPage),
  },

  // ---------- Área do Instrutor ----------
  {
    path: 'instrutor',
    canActivate: [authGuard, perfilGuard('instrutor')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Início | Guidaz',
        loadComponent: () => import('./pages/instrutor/home-instrutor/home-instrutor.page').then((m) => m.HomeInstrutorPage),
      },
      {
        path: 'agenda-disponibilidade',
        title: 'Agenda e disponibilidade | Guidaz',
        loadComponent: () => import('./pages/instrutor/agenda-disponibilidade/agenda-disponibilidade.page').then((m) => m.AgendaDisponibilidadePage),
      },
      {
        path: 'gestao-alunos',
        title: 'Gestão de alunos | Guidaz',
        loadComponent: () => import('./pages/instrutor/gestao-alunos/gestao-alunos.page').then((m) => m.GestaoAlunosPage),
      },
    ],
  },

  // ---------- Área do Aluno ----------
  {
    path: 'aluno',
    canActivate: [authGuard, perfilGuard('aluno')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Início | Guidaz',
        loadComponent: () => import('./pages/aluno/home-aluno/home-aluno.page').then((m) => m.HomeAlunoPage),
      },
      {
        path: 'agendamento-aulas',
        title: 'Agendar aulas | Guidaz',
        loadComponent: () => import('./pages/aluno/agendamento-aulas/agendamento-aulas.page').then((m) => m.AgendamentoAulasPage),
      },
      {
        path: 'pacotes',
        title: 'Pacotes de aulas | Guidaz',
        loadComponent: () => import('./pages/aluno/pacotes/pacotes.page').then((m) => m.PacotesPage),
      },
      {
        path: 'pagamento-pix',
        title: 'Pagamento via Pix | Guidaz',
        loadComponent: () => import('./pages/aluno/pagamento-pix/pagamento-pix.page').then((m) => m.PagamentoPixPage),
      },
      {
        path: 'saldo-aulas',
        title: 'Saldo de aulas | Guidaz',
        loadComponent: () => import('./pages/aluno/saldo-aulas/saldo-aulas.page').then((m) => m.SaldoAulasPage),
      },
      {
        path: 'historico-avaliacoes',
        title: 'Histórico e avaliações | Guidaz',
        loadComponent: () => import('./pages/aluno/historico-avaliacoes/historico-avaliacoes.page').then((m) => m.HistoricoAvaliacoesPage),
      },
    ],
  },

  // ---------- Compartilhadas (logado) ----------
  {
    path: 'perfil',
    canActivate: [authGuard],
    title: 'Meu perfil | Guidaz',
    loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
  },

  { path: '**', redirectTo: 'login' },
];
