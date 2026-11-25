
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type FontSize = 'Pequeno' | 'Normal' | 'Grande';
export type Language = 'Português (BR)' | 'English (US)' | 'Español';

export interface Preferencias {
  temaEscuro: boolean;
  tamanhoTexto: FontSize;
  idioma: Language;
  notificacoes: boolean;
}

const FONT_SCALE: Record<FontSize, number> = {
  Pequeno: 0.9,
  Normal: 1,
  Grande: 1.15
};

const IDX: Record<Language, 0 | 1 | 2> = {
  'Português (BR)': 0,
  'English (US)': 1,
  'Español': 2
};

const HTML_LANG: Record<Language, string> = {
  'Português (BR)': 'pt-BR',
  'English (US)': 'en',
  'Español': 'es'
};

/** [pt, en, es] */
const T: Record<string, [string, string, string]> = {
  navInicio: ['Início', 'Home', 'Inicio'],
  navAgenda: ['Agenda', 'Schedule', 'Agenda'],
  navHistorico: ['Histórico', 'History', 'Historial'],
  navPerfil: ['Perfil', 'Profile', 'Perfil'],

  usuarioPadrao: ['Usuário', 'User', 'Usuario'],
  instrutor: ['Instrutor', 'Instructor', 'Instructor'],
  aluno: ['Aluno', 'Student', 'Alumno'],
  editarPerfil: ['Editar Perfil', 'Edit Profile', 'Editar perfil'],
  conta: ['Conta', 'Account', 'Cuenta'],
  email: ['Email', 'Email', 'Correo'],
  agenda: ['Agenda & Disponibilidade', 'Schedule & Availability', 'Agenda y disponibilidad'],
  veiculo: ['Veículo & Credencial Detran', 'Vehicle & Detran Credential', 'Vehículo y credencial Detran'],
  saldoAulas: ['Saldo de aulas', 'Lesson balance', 'Saldo de clases'],
  historico: ['Histórico e avaliações', 'History & reviews', 'Historial y valoraciones'],
  notificacoes: ['Notificações', 'Notifications', 'Notificaciones'],
  privacidade: ['Privacidade', 'Privacy', 'Privacidad'],
  seguranca: ['Segurança', 'Security', 'Seguridad'],
  configApp: ['Configurações do aplicativo', 'App settings', 'Configuración de la app'],
  modoEscuro: ['Modo Escuro', 'Dark Mode', 'Modo oscuro'],
  tamanhoTexto: ['Tamanho do Texto', 'Text Size', 'Tamaño del texto'],
  idioma: ['Linguagem', 'Language', 'Idioma'],
  idiomaTitulo: ['Idioma do aplicativo', 'App language', 'Idioma de la aplicación'],
  sair: ['Sair da Conta', 'Log out', 'Cerrar sesión'],
  fs_Pequeno: ['Pequeno', 'Small', 'Pequeño'],
  fs_Normal: ['Normal', 'Normal', 'Normal'],
  fs_Grande: ['Grande', 'Large', 'Grande'],
  tamanhoAlterado: ['Tamanho do texto alterado para', 'Text size changed to', 'Tamaño del texto cambiado a'],
  idiomaAlterado: ['Idioma alterado para', 'Language changed to', 'Idioma cambiado a'],
  ativadas: ['Ativadas', 'On', 'Activadas'],
  desativadas: ['Desativadas', 'Off', 'Desactivadas'],
  preferenciasSalvas: ['Preferências salvas com sucesso!', 'Preferences saved successfully!', '¡Preferencias guardadas correctamente!'],

  alterarFoto: ['Alterar foto de perfil', 'Change profile photo', 'Cambiar foto de perfil'],
  tirarFoto: ['Tirar Foto', 'Take Photo', 'Tomar foto'],
  galeria: ['Escolher da Galeria', 'Choose from Gallery', 'Elegir de la galería'],
  fotoAtualizada: ['Foto atualizada!', 'Photo updated!', '¡Foto actualizada!'],
  fotoInvalida: ['Selecione um arquivo de imagem válido.', 'Select a valid image file.', 'Selecciona un archivo de imagen válido.'],

  cancelar: ['Cancelar', 'Cancel', 'Cancelar'],
  cancelarAula: ['Cancelar aula', 'Cancel lesson', 'Cancelar clase'],
  confirmar: ['Confirmar', 'Confirm', 'Confirmar'],
  salvar: ['Salvar Alterações', 'Save Changes', 'Guardar cambios'],
  nomeCompleto: ['Nome Completo', 'Full Name', 'Nombre completo'],
  telefone: ['Telefone', 'Phone', 'Teléfono'],
  cnh: ['Número da CNH', 'License Number (CNH)', 'Número de CNH'],
  credencial: ['Credencial Detran', 'Detran Credential', 'Credencial Detran'],
  modelo: ['Modelo do Veículo', 'Vehicle Model', 'Modelo del vehículo'],
  placa: ['Placa do Veículo', 'License Plate', 'Placa del vehículo'],
  valorHora: ['Valor Hora/Aula (R$)', 'Hourly Rate (R$)', 'Valor por hora (R$)'],
  perfilAtualizado: ['Perfil atualizado com sucesso!', 'Profile updated successfully!', '¡Perfil actualizado con éxito!'],
  erroSalvar: [
    'Não foi possível salvar. Verifique a conexão e tente novamente.',
    'Could not save. Check your connection and try again.',
    'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'
  ],
  dadosInvalidos: [
    'Informe um nome e um e-mail válidos.',
    'Enter a valid name and email.',
    'Introduce un nombre y un correo válidos.'
  ],
  valorInvalido: ['Valor/hora inválido.', 'Invalid hourly rate.', 'Valor por hora inválido.'],

  mostrarTelefone: ['Exibir meu telefone no perfil', 'Show my phone on my profile', 'Mostrar mi teléfono en mi perfil'],
  alterarSenha: ['Alterar senha', 'Change password', 'Cambiar contraseña'],
  senhaAtual: ['Senha atual', 'Current password', 'Contraseña actual'],
  novaSenha: ['Nova senha', 'New password', 'Nueva contraseña'],
  confirmarSenha: ['Confirmar nova senha', 'Confirm new password', 'Confirmar nueva contraseña'],
  preenchaCampos: ['Preencha todos os campos.', 'Fill in all fields.', 'Completa todos los campos.'],
  senhaCurta: [
    'A nova senha deve ter ao menos 6 caracteres.',
    'The new password must have at least 6 characters.',
    'La nueva contraseña debe tener al menos 6 caracteres.'
  ],
  senhaDiferente: ['As senhas não coincidem.', 'Passwords do not match.', 'Las contraseñas no coinciden.'],
  senhaAtualErrada: ['Senha atual incorreta.', 'Current password is incorrect.', 'La contraseña actual es incorrecta.'],
  senhaAlterada: ['Senha alterada com sucesso!', 'Password changed successfully!', '¡Contraseña cambiada con éxito!'],

  categoria: ['Categoria', 'Category', 'Categoría'],
  aulas: ['aulas', 'lessons', 'clases'],
  boasVindasAluno: ['Bem-vindo Aluno', 'Welcome Student', 'Bienvenido Alumno'],
  boasVindasInstrutor: ['Bem-vindo Instrutor', 'Welcome Instructor', 'Bienvenido Instructor'],
  irParaHoje: ['Ir para hoje', 'Go to today', 'Ir a hoy'],
  seuProgresso: ['Seu Progresso', 'Your Progress', 'Tu progreso'],
  realizadas: ['Realizadas', 'Completed', 'Realizadas'],
  pendentes: ['Pendentes', 'Pending', 'Pendientes'],
  proximaAula: ['Próxima Aula', 'Next Lesson', 'Próxima clase'],
  detalhes: ['Detalhes', 'Details', 'Detalles'],
  nenhumaAulaAgendada: ['Nenhuma aula agendada.', 'No scheduled lessons.', 'No hay clases programadas.'],
  nenhumaAulaEncontrada: ['Nenhuma aula encontrada.', 'No lessons found.', 'No se encontraron clases.'],
  agendarAula: ['Agendar Aula', 'Schedule a Lesson', 'Programar clase'],
  escolhaInstrutorHorario: ['Escolha seu instrutor e horário', 'Choose your instructor and time', 'Elige tu instructor y horario'],
  instrutores: ['Instrutores', 'Instructors', 'Instructores'],
  escolhaInstrutor: ['Escolha seu instrutor', 'Choose your instructor', 'Elige tu instructor'],
  aulasAgendadas: ['Aulas agendadas', 'Scheduled Lessons', 'Clases programadas'],
  previstos: ['Previstos', 'Expected', 'Previstos'],
  media: ['Média', 'Average', 'Promedio'],
  alunos: ['Alunos', 'Students', 'Alumnos'],
  meusAlunos: ['Meus Alunos', 'My Students', 'Mis alumnos'],
  alunosAtivos: ['Alunos ativos', 'Active students', 'Alumnos activos'],
  alunosAtivosTexto: ['ativos', 'active', 'activos'],
  disponibilidade: ['Disponibilidade', 'Availability', 'Disponibilidad'],
  ajusteHorarios: ['Ajuste seus horários', 'Adjust your schedule', 'Ajusta tu horario'],
  pagamentos: ['Pagamentos', 'Payments', 'Pagos'],
  analisarComprovantes: ['Analisar comprovantes', 'Review payment receipts', 'Revisar comprobantes'],
  naoInformado: ['Não informado', 'Not provided', 'No informado'],
  gerencieHorarios: ['Gerencie seus horários', 'Manage your schedule', 'Gestiona tu horario'],
  quemVePerfil: ['Quem pode ver seu perfil', 'Who can see your profile', 'Quién puede ver tu perfil'],
  emBreve: ['Em breve', 'Coming soon', 'Próximamente'],
  atualizeInformacoes: ['Atualize suas informações pessoais', 'Update your personal information', 'Actualiza tu información personal'],
  dadosPessoais: ['Dados pessoais', 'Personal information', 'Datos personales'],
  seuNomeCompleto: ['Seu nome completo', 'Your full name', 'Tu nombre completo'],
  endereco: ['Endereço', 'Address', 'Dirección'],
  cep: ['CEP', 'ZIP Code', 'Código postal'],
  numero: ['Número', 'Number', 'Número'],
  logradouro: ['Logradouro', 'Street', 'Calle'],
  ruaAvenida: ['Rua / Avenida', 'Street / Avenue', 'Calle / Avenida'],
  bairro: ['Bairro', 'Neighborhood', 'Barrio'],
  seuBairro: ['Seu bairro', 'Your neighborhood', 'Tu barrio'],
  cidade: ['Cidade', 'City', 'Ciudad'],
  suaCidade: ['Sua cidade', 'Your city', 'Tu ciudad'],
  complemento: ['Complemento', 'Additional address', 'Complemento'],
  aptoBlocoEtc: ['Apto, Bloco, etc.', 'Apartment, Building, etc.', 'Piso, bloque, etc.'],
  dadosInstrutor: ['Dados do instrutor', 'Instructor information', 'Datos del instructor'],
  modeloVeiculo: ['Modelo do veículo', 'Vehicle model', 'Modelo del vehículo'],
  exemploOnix: ['Ex: Chevrolet Onix', 'E.g.: Chevrolet Onix', 'Ej.: Chevrolet Onix'],
  anoVeiculo: ['Ano do veículo', 'Vehicle year', 'Año del vehículo'],
  exemplo2022: ['Ex: 2022', 'E.g.: 2022', 'Ej.: 2022'],
  biografia: ['Biografia', 'Biography', 'Biografía'],
  escrevaApresentacao: ['Escreva uma breve apresentação...', 'Write a short introduction...', 'Escribe una breve presentación...'],
  salvando: ['Salvando...', 'Saving...', 'Guardando...'],
  concluir: ['Concluir', 'Complete', 'Completar'],
  filtro: ['Filtro', 'Filter', 'Filtro'],
  todas: ['Todas', 'All', 'Todas'],
  completas: ['Completas', 'Completed', 'Completadas'],
  incompletas: ['Incompletas', 'Incomplete', 'Incompletas'],
  categoriaB: ['Categoria B', 'Category B', 'Categoría B'],
  hoje: ['Hoje', 'Today', 'Hoy'],
  amanha: ['Amanhã', 'Tomorrow', 'Mañana'],
  ontem: ['Ontem', 'Yesterday', 'Ayer'],

  // Calendário e aulas
  statusAgendada: ['Agendada', 'Scheduled', 'Programada'],
  statusConcluida: ['Concluída', 'Completed', 'Completada'],
  statusCancelada: ['Cancelada', 'Cancelled', 'Cancelada'],
  statusCompleta: ['Completa', 'Complete', 'Completa'],
  statusIncompleta: ['Incompleta', 'Incomplete', 'Incompleta'],
  carregandoAulas: ['Carregando aulas...', 'Loading lessons...', 'Cargando clases...'],
  historicoCompleto: [
    'Histórico completo de agendamentos',
    'Complete booking history',
    'Historial completo de reservas'
  ],
  horario: ['Horário', 'Time', 'Horario'],
  local: ['Local', 'Location', 'Lugar'],
  pontoEncontroPadrao: [
    'Ponto de encontro padrão',
    'Default meeting point',
    'Punto de encuentro predeterminado'
  ],
  observacoes: ['Observações', 'Notes', 'Observaciones'],
  nenhumaAulaRegistrada: [
    'Nenhuma aula registrada',
    'No lessons registered',
    'No hay clases registradas'
  ],
  alunoSemHistorico: [
    'Este aluno ainda não possui histórico de aulas cadastradas no sistema.',
    'This student has no lesson history registered in the system yet.',
    'Este alumno todavía no tiene un historial de clases registrado en el sistema.'
  ]
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  readonly darkMode = signal<boolean>(false);
  readonly fontSize = signal<FontSize>('Normal');
  readonly language = signal<Language>('Português (BR)');
  readonly notificacoes = signal<boolean>(true);

  constructor() {
    this.carregarConfiguracoesSalvas();
  }

  t(chave: string): string {
    return T[chave]?.[IDX[this.language()]] ?? chave;
  }

  private ler(chave: string): string | null {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }

  private gravar(chave: string, valor: string): void {
    try {
      localStorage.setItem(chave, valor);
    } catch {
      // Cache local indisponível.
    }
  }

  private carregarConfiguracoesSalvas(): void {
    this.aplicar({
      temaEscuro: this.ler('guidaz_theme') === 'dark',
      tamanhoTexto: this.validarTamanho(this.ler('guidaz_font_size')),
      idioma: this.validarIdioma(this.ler('guidaz_lang')),
      notificacoes: this.ler('guidaz_notif') !== 'off'
    });
  }

  private validarTamanho(valor: string | null): FontSize {
    return valor === 'Pequeno' || valor === 'Grande' || valor === 'Normal'
      ? valor
      : 'Normal';
  }

  private validarIdioma(valor: string | null): Language {
    return valor === 'English (US)' || valor === 'Español' || valor === 'Português (BR)'
      ? valor
      : 'Português (BR)';
  }

  private aplicar(p: Preferencias): void {
    this.darkMode.set(p.temaEscuro);
    this.fontSize.set(p.tamanhoTexto);
    this.language.set(p.idioma);
    this.notificacoes.set(p.notificacoes);

    // Aplica o tema escuro globalmente.
    document.documentElement.classList.toggle('dark', p.temaEscuro);
    document.body.classList.toggle('dark', p.temaEscuro);

    // Mantém a preferência de cores do navegador sincronizada.
    document.documentElement.style.colorScheme = p.temaEscuro ? 'dark' : 'light';

    // Atualiza também o elemento principal do Ionic.
    const app = document.querySelector('ion-app');
    app?.classList.toggle('dark', p.temaEscuro);

    // Aplica o tamanho do texto globalmente.
    const escala = FONT_SCALE[p.tamanhoTexto];

    document.documentElement.style.setProperty('--fs', String(escala));
    document.documentElement.style.fontSize = `${16 * escala}px`;

    document.body.classList.remove(
      'font-pequeno',
      'font-normal',
      'font-grande'
    );

    document.body.classList.add(`font-${p.tamanhoTexto.toLowerCase()}`);

    // Atualiza o idioma do documento.
    document.documentElement.lang = HTML_LANG[p.idioma];

    // Atualiza o armazenamento local somente quando a preferência é aplicada.
    this.gravar('guidaz_theme', p.temaEscuro ? 'dark' : 'light');
    this.gravar('guidaz_font_size', p.tamanhoTexto);
    this.gravar('guidaz_lang', p.idioma);
    this.gravar('guidaz_notif', p.notificacoes ? 'on' : 'off');
  }

  obterPreferencias(): Preferencias {
    return {
      temaEscuro: this.darkMode(),
      tamanhoTexto: this.fontSize(),
      idioma: this.language(),
      notificacoes: this.notificacoes()
    };
  }

  restaurar(preferencias: Preferencias): void {
    this.aplicar(preferencias);
  }

  carregarDoBanco(): Observable<Preferencias> {
    const usuario = this.authService.usuario();
    const id = usuario?.id;

    if (!usuario || !id) {
      return throwError(() => new Error('Usuário não autenticado ou sem ID.'));
    }

    const endpoint = usuario.perfil === 'instrutor' ? 'instrutores' : 'alunos';

    return this.http.get<Preferencias>(
      `${this.apiUrl}/${endpoint}/${id}/preferencias`
    ).pipe(
      tap((preferencias) => {
        if (preferencias) {
          this.aplicar(preferencias);
        }
      })
    );
  }

  salvarNoBanco(
    preferencias: Preferencias = this.obterPreferencias()
  ): Observable<Preferencias> {
    const usuario = this.authService.usuario();
    const id = usuario?.id;

    if (!usuario || !id) {
      return throwError(() => new Error('Usuário não autenticado ou sem ID.'));
    }

    const endpoint = usuario.perfil === 'instrutor' ? 'instrutores' : 'alunos';

    return this.http.put<Preferencias>(
      `${this.apiUrl}/${endpoint}/${id}/preferencias`,
      preferencias
    ).pipe(
      tap((retorno) => {
        // A interface e o cache local só são atualizados após a resposta do backend.
        this.aplicar(retorno ?? preferencias);
      })
    );
  }

  setDarkMode(enabled: boolean): void {
    this.aplicar({
      ...this.obterPreferencias(),
      temaEscuro: enabled
    });
  }

  setFontSize(size: FontSize): void {
    this.aplicar({
      ...this.obterPreferencias(),
      tamanhoTexto: size
    });
  }

  setLanguage(lang: Language): void {
    this.aplicar({
      ...this.obterPreferencias(),
      idioma: lang
    });
  }

  setNotificacoes(ativo: boolean): void {
    this.aplicar({
      ...this.obterPreferencias(),
      notificacoes: ativo
    });
  }
}
