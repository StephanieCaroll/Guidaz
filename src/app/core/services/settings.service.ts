import { Injectable, signal } from '@angular/core';

export type FontSize = 'Pequeno' | 'Normal' | 'Grande';
export type Language = 'Português (BR)' | 'English (US)' | 'Español';

const FONT_SCALE: Record<FontSize, number> = { Pequeno: 0.9, Normal: 1, Grande: 1.15 };
const FONT_SIZES: FontSize[] = ['Pequeno', 'Normal', 'Grande'];
const LANGS: Language[] = ['Português (BR)', 'English (US)', 'Español'];
const HTML_LANG: Record<Language, string> = {
  'Português (BR)': 'pt-BR',
  'English (US)': 'en',
  'Español': 'es'
};
const IDX: Record<Language, 0 | 1 | 2> = { 'Português (BR)': 0, 'English (US)': 1, 'Español': 2 };

/** [pt, en, es] */
const T: Record<string, [string, string, string]> = {
  // menu inferior
  navInicio: ['Início', 'Home', 'Inicio'],
  navAgenda: ['Agenda', 'Schedule', 'Agenda'],
  navHistorico: ['Histórico', 'History', 'Historial'],
  navPerfil: ['Perfil', 'Profile', 'Perfil'],

  // perfil
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

  // foto
  alterarFoto: ['Alterar foto de perfil', 'Change profile photo', 'Cambiar foto de perfil'],
  tirarFoto: ['Tirar Foto', 'Take Photo', 'Tomar foto'],
  galeria: ['Escolher da Galeria', 'Choose from Gallery', 'Elegir de la galería'],
  fotoAtualizada: ['Foto atualizada!', 'Photo updated!', '¡Foto actualizada!'],
  fotoInvalida: ['Selecione um arquivo de imagem válido.', 'Select a valid image file.', 'Selecciona un archivo de imagen válido.'],

  // modal
  cancelar: ['Cancelar', 'Cancel', 'Cancelar'],
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

  // privacidade / segurança
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

  // resumo
  categoria: ['Categoria', 'Category', 'Categoría'],
  aulas: ['aulas', 'lessons', 'clases']
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly darkMode = signal<boolean>(false);
  readonly fontSize = signal<FontSize>('Normal');
  readonly language = signal<Language>('Português (BR)');
  readonly notificacoes = signal<boolean>(true);

  constructor() {
    this.carregarConfiguracoesSalvas();
  }

  /** Tradução simples. Lê o signal de idioma, então funciona em templates e computed(). */
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
      /* armazenamento indisponível: segue sem persistir */
    }
  }

  private carregarConfiguracoesSalvas(): void {
    this.setDarkMode(this.ler('guidaz_theme') === 'dark');

    const size = this.ler('guidaz_font_size') as FontSize;
    this.setFontSize(FONT_SIZES.includes(size) ? size : 'Normal');

    const lang = this.ler('guidaz_lang') as Language;
    this.setLanguage(LANGS.includes(lang) ? lang : 'Português (BR)');

    this.notificacoes.set(this.ler('guidaz_notif') !== 'off');
  }

  public setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    document.body.classList.toggle('dark', enabled);
    this.gravar('guidaz_theme', enabled ? 'dark' : 'light');
  }

  public setFontSize(size: FontSize): void {
    this.fontSize.set(size);
    this.gravar('guidaz_font_size', size);

    const escala = FONT_SCALE[size];
    const root = document.documentElement;
    root.style.setProperty('--fs', String(escala)); // usado no SCSS: fs(14)
    root.style.fontSize = `${16 * escala}px`;       // escala tudo que usa rem (Ionic)

    document.body.classList.remove('font-pequeno', 'font-normal', 'font-grande');
    document.body.classList.add(`font-${size.toLowerCase()}`);
  }

  public setLanguage(lang: Language): void {
    this.language.set(lang);
    this.gravar('guidaz_lang', lang);
    document.documentElement.lang = HTML_LANG[lang];
  }

  public setNotificacoes(ativo: boolean): void {
    if (this.notificacoes() === ativo) return;
    this.notificacoes.set(ativo);
    this.gravar('guidaz_notif', ativo ? 'on' : 'off');
  }
}