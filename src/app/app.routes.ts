import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { authGuard, idParamGuard, perfilGuard, visitanteGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { Perfil } from './core/models/user.model';

const wildcardRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.usuario();

  if (auth.logado() && user) {
    const rawPerfil = String(user.perfil ?? '').trim().toLowerCase();
    const perfil: Perfil = rawPerfil === 'instrutor' ? 'instrutor' : 'aluno';
    return router.createUrlTree([auth.rotaInicial(perfil)]);
  }

  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/auth/splash/splash.page').then((m) => m.SplashPage),
  },

  // Autenticação (públicas)
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
    loadComponent: () =>
      import('./pages/auth/cadastro-instrutor/cadastro-instrutor.page').then(
        (m) => m.CadastroInstrutorPage
      ),
  },
  {
    path: 'cadastro-aluno',
    canActivate: [visitanteGuard],
    title: 'Cadastro de aluno | Guidaz',
    loadComponent: () =>
      import('./pages/auth/cadastro-aluno/cadastro-aluno.page').then((m) => m.CadastroAlunoPage),
  },
  {
    path: 'esqueci-senha',
    canActivate: [visitanteGuard],
    title: 'Recuperar senha | Guidaz',
    loadComponent: () =>
      import('./pages/auth/esqueci-senha/esqueci-senha.page').then((m) => m.EsqueciSenhaPage),
  },

  // Área do Instrutor
  {
    path: 'instrutor',
    canActivate: [authGuard, perfilGuard('instrutor')],
    canActivateChild: [authGuard, perfilGuard('instrutor')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Início | Guidaz',
        loadComponent: () =>
          import('./pages/instrutor/home-instrutor/home-instrutor.page').then(
            (m) => m.HomeInstrutorPage
          ),
      },
      {
        path: 'calendario',
        title: 'Calendário de aulas | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/calendario-aulas/calendario-aulas.page').then(
            (m) => m.CalendarioAulasPage
          ),
      },
      {
        path: 'detalhe-aula',
        title: 'Detalhe da aula | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/detalhe-aula/detalhe-aula.page').then((m) => m.DetalheAulaPage),
      },
      {
        path: 'progresso-instrutor',
        title: 'Progresso | Guidaz',
        loadComponent: () =>
          import('./pages/instrutor/progresso-instrutor/progresso-instrutor.page').then(
            (m) => m.ProgressoInstrutorPage
          ),
      },
      {
        path: 'agenda-disponibilidade',
        title: 'Agenda e disponibilidade | Guidaz',
        loadComponent: () =>
          import('./pages/instrutor/agenda-disponibilidade/agenda-disponibilidade.page').then(
            (m) => m.AgendaDisponibilidadePage
          ),
      },
      {
        path: 'gestao-alunos',
        title: 'Gestão de alunos | Guidaz',
        loadComponent: () =>
          import('./pages/instrutor/gestao-alunos/gestao-alunos.page').then(
            (m) => m.GestaoAlunosPage
          ),
      },
      {
        path: 'pedidos-pacote',
        title: 'Pedidos de pacote | Guidaz',
        loadComponent: () =>
          import('./pages/instrutor/pedidos-pacote/pedidos-pacote.page').then(
            (m) => m.PedidosPacotePage
          ),
      },
    ],
  },

  // Área do Aluno
  {
    path: 'aluno',
    canActivate: [authGuard, perfilGuard('aluno')],
    canActivateChild: [authGuard, perfilGuard('aluno')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Início | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/home-aluno/home-aluno.page').then((m) => m.HomeAlunoPage),
      },
      {
        path: 'calendario',
        title: 'Calendário de aulas | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/calendario-aulas/calendario-aulas.page').then(
            (m) => m.CalendarioAulasPage
          ),
      },
      {
        path: 'instrutores',
        title: 'Escolher instrutor | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/instrutores/instrutores.page').then((m) => m.InstrutoresPage),
      },
      {
        path: 'perfil-instrutor/:id',
        canActivate: [idParamGuard],
        data: { idParam: 'id', fallbackRoute: '/aluno/instrutores' },
        title: 'Perfil do Instrutor | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/perfil-instrutor/perfil-instrutor.page').then(
            (m) => m.PerfilInstrutorPage
          ),
      },
      {
        path: 'agendamento-aulas',
        title: 'Agendar aulas | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/agendamento-aulas/agendamento-aulas.page').then(
            (m) => m.AgendamentoAulasPage
          ),
      },
      {
        path: 'pacotes',
        title: 'Pacotes de aulas | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/pacotes/pacotes.page').then((m) => m.PacotesPage),
      },
      {
        path: 'pagamento-pix',
        title: 'Pagamento via Pix | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/pagamento-pix/pagamento-pix.page').then(
            (m) => m.PagamentoPixPage
          ),
      },
      {
        path: 'comprovante-pix',
        title: 'Enviar comprovante | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/comprovante-pix/comprovante-pix.page').then(
            (m) => m.ComprovantePixPage
          ),
      },
      {
        path: 'historico-aula',
        title: 'Histórico de aulas | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/historico-aula/historico-aula.page').then(
            (m) => m.HistoricoAulaPage
          ),
      },
      {
        path: 'detalhe-aula',
        title: 'Detalhe da aula | Guidaz',
        loadComponent: () =>
          import('./pages/aluno/detalhe-aula/detalhe-aula.page').then((m) => m.DetalheAulaPage),
      },
    ],
  },

  // Compartilhadas (logado)
  {
    path: 'perfil',
    canActivate: [authGuard],
    title: 'Meu perfil | Guidaz',
    loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: 'notificacoes',
    canActivate: [authGuard],
    title: 'Notificações | Guidaz',
    loadComponent: () =>
      import('./pages/notificacoes/notificacoes.page').then((m) => m.NotificacoesPage),
  },

  { path: '**', canActivate: [wildcardRedirectGuard], children: [] },
];