import { Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonToggle,
  IonModal,
  IonTextarea,
  IonSpinner,
  AlertController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  imageOutline,
  star,
  mailOutline,
  calendarOutline,
  carSportOutline,
  walletOutline,
  timeOutline,
  notificationsOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
  moonOutline,
  textOutline,
  globeOutline,
  logOutOutline,
  chevronForwardOutline,
  personOutline,
  checkmarkCircleOutline,
  closeOutline,
  createOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { SettingsService, FontSize, Language } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../environments/environment';

interface UsuarioPerfil {
  id?: number | string;
  perfil?: 'aluno' | 'instrutor';
  nome?: string;
  email?: string;
  telefone?: string;
  foto?: string;
  fotoUrl?: string;
  nota?: number;
  cnh?: string;
  credencial?: string;
  veiculoModelo?: string;
  veiculo?: string;
  veiculoPlaca?: string;
  veiculoAno?: number | string;
  valorHora?: number | null;
  categoria?: string;
  categoriasLecionadas?: string[];
  categorias?: string[];
  saldoAulas?: number;
  mostrarTelefone?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  numero?: string;
  complemento?: string;
  biografia?: string;
}

interface EditForm {
  nome: string;
  email: string;
  telefone: string;
  cnh: string;
  credencial: string;
  veiculoModelo: string;
  veiculoPlaca: string;
  veiculoAno: number | string;
  valorHora: number | string | null;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  numero: string;
  complemento: string;
  biografia: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonToggle,
    IonModal,
    IonTextarea,
    IonSpinner,
    BottomNavComponent
  ]
})
export class PerfilPage {
  readonly authService = inject(AuthService);
  readonly settingsService = inject(SettingsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly t = (chave: string): string => this.settingsService.t(chave);

  readonly u = computed(() => this.authService.usuario() as unknown as UsuarioPerfil | null);
  readonly isInstrutor = computed(() => this.u()?.perfil === 'instrutor');

  readonly nome = computed(() => this.u()?.nome || this.t('usuarioPadrao'));

  readonly fotoUrl = computed(() => {
    const raw = this.u()?.fotoUrl || this.u()?.foto || '';
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
  });

  readonly temFoto = computed(() => !!this.fotoUrl());

  readonly notaUsuario = computed(() => this.u()?.nota ?? 5.0);

  readonly biografia = computed(() => this.u()?.biografia || '');

  readonly resumo = computed(() => {
    const u = this.u();
    if (!u) return '';

    if (this.isInstrutor()) {
      return u.valorHora != null && u.valorHora !== ('' as any)
        ? `${Number(u.valorHora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / h`
        : '';
    }

    const partes: string[] = [];
    if (u.categoria) partes.push(`${this.t('categoria')} ${u.categoria}`);
    if (u.saldoAulas != null) partes.push(`${u.saldoAulas} ${this.t('aulas')}`);
    return partes.join(' - ');
  });

  isModalEdicaoAberto = false;
  carregandoSalvar = false;

  editForm: EditForm = this.formVazio();

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      imageOutline,
      star,
      mailOutline,
      calendarOutline,
      carSportOutline,
      walletOutline,
      timeOutline,
      notificationsOutline,
      lockClosedOutline,
      shieldCheckmarkOutline,
      moonOutline,
      textOutline,
      globeOutline,
      logOutOutline,
      chevronForwardOutline,
      personOutline,
      checkmarkCircleOutline,
      closeOutline,
      createOutline
    });
  }

  ionViewWillEnter(): void {
    this.authService.buscarDoBanco().subscribe({
      error: () => {}
    });
  }

  goBack(): void {
    void this.router.navigateByUrl(this.isInstrutor() ? '/instrutor/home' : '/aluno/home');
  }

  private navegar(rota: string): void {
    void this.router.navigateByUrl(rota);
  }

  fazerLogout(): void {
    this.authService.logout();
  }

  abrirDetalheConta(_secao: string): void {
    this.abrirModalEdicao();
  }

  irParaDisponibilidade(): void {
    this.navegar('/instrutor/agenda-disponibilidade');
  }

  abrirOpcao(opcao: string): void {
    switch (opcao) {
      case 'Notificações':
        this.toastService.presentToast(
          `Notificações: ${this.settingsService.notificacoes() ? this.t('ativadas') : this.t('desativadas')}`,
          'primary'
        );
        break;
      case 'Privacidade':
        void this.abrirPrivacidade();
        break;
      case 'Segurança':
        this.toastService.presentToast('Em breve: recursos de segurança.', 'primary');
        break;
      default:
        this.toastService.presentToast(opcao, 'primary');
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  async tratarTrocaFoto(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t('alterarFoto'),
      buttons: [
        { text: this.t('tirarFoto'), icon: 'camera-outline', handler: () => this.abrirSeletor(true) },
        { text: this.t('galeria'), icon: 'image-outline', handler: () => this.abrirSeletor(false) },
        { text: this.t('cancelar'), role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  private abrirSeletor(usarCamera: boolean): void {
    const input = this.fileInput?.nativeElement;
    if (!input) return;
    if (usarCamera) input.setAttribute('capture', 'environment');
    else input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  async onFotoSelecionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.presentToast(this.t('fotoInvalida'), 'danger');
      return;
    }

    this.carregandoSalvar = true;
    this.authService.uploadFoto(arquivo).subscribe({
      next: () => {
        this.carregandoSalvar = false;
        this.toastService.presentToast(this.t('fotoAtualizada'), 'success');
      },
      error: () => {
        this.carregandoSalvar = false;
        this.toastService.presentToast(this.t('erroSalvar'), 'danger');
      }
    });
  }

  private formVazio(): EditForm {
    return {
      nome: '',
      email: '',
      telefone: '',
      cnh: '',
      credencial: '',
      veiculoModelo: '',
      veiculoPlaca: '',
      veiculoAno: '',
      valorHora: null,
      cep: '',
      logradouro: '',
      bairro: '',
      cidade: '',
      numero: '',
      complemento: '',
      biografia: ''
    };
  }

  abrirModalEdicao(): void {
    const u = this.u();
    this.editForm = {
      nome: u?.nome || '',
      email: u?.email || '',
      telefone: u?.telefone || '',
      cnh: u?.cnh || '',
      credencial: u?.credencial || '',
      veiculoModelo: u?.veiculoModelo || u?.veiculo || '',
      veiculoPlaca: u?.veiculoPlaca || '',
      veiculoAno: u?.veiculoAno || '',
      valorHora: u?.valorHora ?? null,
      cep: u?.cep || '',
      logradouro: u?.logradouro || '',
      bairro: u?.bairro || '',
      cidade: u?.cidade || '',
      numero: u?.numero || '',
      complemento: u?.complemento || '',
      biografia: u?.biografia || ''
    };
    this.isModalEdicaoAberto = true;
  }

  fecharModalEdicao(): void {
    this.isModalEdicaoAberto = false;
  }

  salvarPerfil(): void {
    const f = this.editForm;
    const nome = (f.nome || '').trim();
    const email = (f.email || '').trim();

    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) {
      this.toastService.presentToast(this.t('dadosInvalidos'), 'danger');
      return;
    }

    const dados: Record<string, unknown> = {
      nome,
      email,
      telefone: (f.telefone || '').trim(),
      cep: (f.cep || '').trim(),
      logradouro: (f.logradouro || '').trim(),
      bairro: (f.bairro || '').trim(),
      cidade: (f.cidade || '').trim(),
      numero: (f.numero || '').trim(),
      complemento: (f.complemento || '').trim()
    };

    if (this.isInstrutor()) {
      const bruto = f.valorHora;
      const valorHora = bruto === null || bruto === '' ? null : Number(bruto);

      if (valorHora !== null && (Number.isNaN(valorHora) || valorHora < 0)) {
        this.toastService.presentToast(this.t('valorInvalido'), 'danger');
        return;
      }

      Object.assign(dados, {
        cnh: (f.cnh || '').trim(),
        credencial: (f.credencial || '').trim(),
        veiculoModelo: (f.veiculoModelo || '').trim(),
        veiculoPlaca: (f.veiculoPlaca || '').trim().toUpperCase(),
        veiculoAno: (f.veiculoAno || '').toString().trim(),
        biografia: (f.biografia || '').trim(),
        valorHora
      });
    }

    this.persistir(dados, 'perfilAtualizado', () => {
      this.isModalEdicaoAberto = false;
    });
  }

  private persistir(
    dados: Record<string, unknown>,
    msgSucesso: string,
    aoSucesso?: () => void
  ): void {
    this.carregandoSalvar = true;

    this.authService.atualizarPerfil(dados).subscribe({
      next: () => {
        this.carregandoSalvar = false;
        aoSucesso?.();
        this.toastService.presentToast(this.t(msgSucesso), 'success');
      },
      error: () => {
        this.carregandoSalvar = false;
        this.toastService.presentToast(this.t('erroSalvar'), 'danger');
      }
    });
  }

  toggleDarkMode(event: CustomEvent): void {
    this.settingsService.setDarkMode(!!event.detail.checked);
  }

  toggleNotificacoes(event: CustomEvent): void {
    this.settingsService.setNotificacoes(!!event.detail.checked);
  }

  async alterarTamanhoTexto(): Promise<void> {
    const current = this.settingsService.fontSize();
    const opcoes: FontSize[] = ['Pequeno', 'Normal', 'Grande'];

    const alert = await this.alertCtrl.create({
      header: this.t('tamanhoTexto'),
      inputs: opcoes.map((op) => ({
        type: 'radio',
        label: this.t(`fs_${op}`),
        value: op,
        checked: current === op
      })),
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (val: FontSize) => {
            if (val) {
              this.settingsService.setFontSize(val);
              this.toastService.presentToast(
                `${this.t('tamanhoAlterado')}: ${this.t(`fs_${val}`)}`,
                'success'
              );
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async alterarLinguagem(): Promise<void> {
    const current = this.settingsService.language();
    const opcoes: Language[] = ['Português (BR)', 'English (US)', 'Español'];

    const alert = await this.alertCtrl.create({
      header: this.t('idiomaTitulo'),
      inputs: opcoes.map((op) => ({
        type: 'radio',
        label: op,
        value: op,
        checked: current === op
      })),
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (val: Language) => {
            if (val) {
              this.settingsService.setLanguage(val);
              this.toastService.presentToast(`${this.t('idiomaAlterado')}: ${val}`, 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async abrirPrivacidade(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.t('privacidade'),
      subHeader: 'Quem pode ver suas informações',
      message: 'Você controla o que outros usuários enxergam no seu perfil.',
      inputs: [
        {
          type: 'checkbox',
          label: this.t('mostrarTelefone'),
          value: 'telefone',
          checked: !!this.u()?.mostrarTelefone
        }
      ],
      cssClass: 'privacy-alert',
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (marcados: string[]) => {
            this.persistir(
              { mostrarTelefone: (marcados || []).includes('telefone') },
              'perfilAtualizado'
            );
          }
        }
      ]
    });
    await alert.present();
  }
}