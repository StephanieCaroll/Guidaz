import { Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonToggle,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
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
  chevronForwardOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { SettingsService, FontSize, Language } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

/** Campos esperados no registro do banco (aluno e instrutor) */
interface UsuarioPerfil {
  id?: number | string;
  perfil?: 'aluno' | 'instrutor';
  nome?: string;
  email?: string;
  telefone?: string;
  foto?: string;
  fotoUrl?: string;
  nota?: number;
  // instrutor
  cnh?: string;
  credencial?: string;
  veiculoModelo?: string;
  veiculo?: string;
  veiculoPlaca?: string;
  valorHora?: number | null;
  // aluno
  categoria?: string;
  saldoAulas?: number;
  // privacidade
  mostrarTelefone?: boolean;
}

interface EditForm {
  nome: string;
  email: string;
  telefone: string;
  cnh: string;
  credencial: string;
  veiculoModelo: string;
  veiculoPlaca: string;
  valorHora: number | string | null;
}

interface ItemMenu {
  id: string;
  icone: string;
  label: string;
  valor?: string;
  acao: () => void;
}

const FOTO_PADRAO = 'assets/guidaz.png';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonToggle,
    IonModal,
    IonItem,
    IonLabel,
    IonInput,
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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /** Atalho de tradução para o template */
  readonly t = (chave: string): string => this.settingsService.t(chave);

  /** Usuário logado (sessão), tipado */
  readonly u = computed(() => this.authService.usuario() as unknown as UsuarioPerfil | null);
  readonly isInstrutor = computed(() => this.u()?.perfil === 'instrutor');

  readonly nome = computed(() => this.u()?.nome || this.t('usuarioPadrao'));
  readonly fotoUrl = computed(() => this.u()?.fotoUrl || this.u()?.foto || FOTO_PADRAO);
  readonly nota = computed(() => this.u()?.nota ?? null);

  /** Linha de resumo abaixo do papel: valor/hora (instrutor) ou categoria e saldo (aluno) */
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
    return partes.join(' • ');
  });

  readonly veiculoTexto = computed(() => {
    const u = this.u();
    const modelo = u?.veiculoModelo || u?.veiculo || '';
    return [modelo, u?.veiculoPlaca].filter(Boolean).join(' • ');
  });

  /** Itens do bloco "Conta": mudam conforme aluno ou instrutor */
  readonly itensConta = computed<ItemMenu[]>(() => {
    const u = this.u();
    const lista: ItemMenu[] = [
      {
        id: 'email',
        icone: 'mail-outline',
        label: this.t('email'),
        valor: u?.email,
        acao: () => this.abrirModalEdicao()
      }
    ];

    if (this.isInstrutor()) {
      lista.push(
        {
          id: 'agenda',
          icone: 'calendar-outline',
          label: this.t('agenda'),
          acao: () => this.navegar('/instrutor/agenda-disponibilidade')
        },
        {
          id: 'veiculo',
          icone: 'car-sport-outline',
          label: this.t('veiculo'),
          valor: this.veiculoTexto() || u?.credencial,
          acao: () => this.abrirModalEdicao()
        }
      );
    } else {
      lista.push(
        {
          id: 'saldo',
          icone: 'wallet-outline',
          label: this.t('saldoAulas'),
          valor: u?.saldoAulas != null ? `${u.saldoAulas} ${this.t('aulas')}` : undefined,
          acao: () => this.navegar('/aluno/saldo-aulas')
        },
        {
          id: 'historico',
          icone: 'time-outline',
          label: this.t('historico'),
          acao: () => this.navegar('/aluno/historico-avaliacoes')
        }
      );
    }

    lista.push(
      {
        id: 'privacidade',
        icone: 'lock-closed-outline',
        label: this.t('privacidade'),
        acao: () => void this.abrirPrivacidade()
      },
      {
        id: 'seguranca',
        icone: 'shield-checkmark-outline',
        label: this.t('seguranca'),
        acao: () => void this.alterarSenha()
      }
    );

    return lista;
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
      chevronForwardOutline
    });
  }

  /** Toda vez que a página abre, busca os dados atualizados no banco */
  ionViewWillEnter(): void {
    this.authService.buscarDoBanco().subscribe({
      error: () => {
        /* sem conexão: continua com os dados da sessão */
      }
    });
  }

  // ---------- Navegação ----------

  goBack(): void {
    void this.router.navigateByUrl(this.isInstrutor() ? '/instrutor/home' : '/aluno/home');
  }

  private navegar(rota: string): void {
    void this.router.navigateByUrl(rota);
  }

  fazerLogout(): void {
    this.authService.logout();
  }

  // ---------- Foto ----------

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = FOTO_PADRAO;
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
    const input = this.fileInput.nativeElement;
    if (usarCamera) {
      input.setAttribute('capture', 'environment');
    } else {
      input.removeAttribute('capture');
    }
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

    try {
      const dataUrl = await this.redimensionar(arquivo, 400);
      this.persistir({ fotoUrl: dataUrl }, 'fotoAtualizada');
    } catch {
      this.toastService.presentToast(this.t('fotoInvalida'), 'danger');
    }
  }

  /** Reduz a imagem para no máximo `lado` px e converte para JPEG (evita salvar foto gigante no banco) */
  private redimensionar(arquivo: File, lado: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('IMAGEM_INVALIDA'));
        img.onload = () => {
          const escala = Math.min(1, lado / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(arquivo);
    });
  }

  // ---------- Edição de perfil ----------

  private formVazio(): EditForm {
    return {
      nome: '',
      email: '',
      telefone: '',
      cnh: '',
      credencial: '',
      veiculoModelo: '',
      veiculoPlaca: '',
      valorHora: null
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
      valorHora: u?.valorHora ?? null
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
      telefone: (f.telefone || '').trim()
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
        valorHora
      });
    }

    this.persistir(dados, 'perfilAtualizado', () => {
      this.isModalEdicaoAberto = false;
    });
  }

  /** Salva no banco e só mostra sucesso se o servidor realmente aceitou */
  private persistir(dados: Record<string, unknown>, msgSucesso: string, aoSucesso?: () => void): void {
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

  // ---------- Configurações do aplicativo ----------

  toggleDarkMode(event: CustomEvent): void {
    this.settingsService.setDarkMode(!!event.detail.checked);
  }

  toggleNotificacoes(event: CustomEvent): void {
    this.settingsService.setNotificacoes(!!event.detail.checked);
  }

  async alterarTamanhoTexto(): Promise<void> {
    const atual = this.settingsService.fontSize();
    const opcoes: FontSize[] = ['Pequeno', 'Normal', 'Grande'];

    const alert = await this.alertCtrl.create({
      header: this.t('tamanhoTexto'),
      inputs: opcoes.map((op) => ({
        type: 'radio' as const,
        label: this.t(`fs_${op}`),
        value: op,
        checked: atual === op
      })),
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (val: FontSize) => {
            if (val) {
              this.settingsService.setFontSize(val);
              this.toastService.presentToast(`${this.t('tamanhoAlterado')}: ${this.t(`fs_${val}`)}`, 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async alterarLinguagem(): Promise<void> {
    const atual = this.settingsService.language();
    const opcoes: Language[] = ['Português (BR)', 'English (US)', 'Español'];

    const alert = await this.alertCtrl.create({
      header: this.t('idiomaTitulo'),
      inputs: opcoes.map((op) => ({
        type: 'radio' as const,
        label: op,
        value: op,
        checked: atual === op
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

  // ---------- Privacidade e Segurança ----------

  async abrirPrivacidade(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.t('privacidade'),
      inputs: [
        {
          type: 'checkbox',
          label: this.t('mostrarTelefone'),
          value: 'telefone',
          checked: !!this.u()?.mostrarTelefone
        }
      ],
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (marcados: string[]) => {
            this.persistir({ mostrarTelefone: (marcados || []).includes('telefone') }, 'perfilAtualizado');
          }
        }
      ]
    });
    await alert.present();
  }

  async alterarSenha(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.t('seguranca'),
      subHeader: this.t('alterarSenha'),
      inputs: [
        { name: 'atual', type: 'password', placeholder: this.t('senhaAtual') },
        { name: 'nova', type: 'password', placeholder: this.t('novaSenha') },
        { name: 'confirma', type: 'password', placeholder: this.t('confirmarSenha') }
      ],
      buttons: [
        { text: this.t('cancelar'), role: 'cancel' },
        {
          text: this.t('confirmar'),
          handler: (v: { atual: string; nova: string; confirma: string }) => {
            if (!v.atual || !v.nova || !v.confirma) {
              this.toastService.presentToast(this.t('preenchaCampos'), 'danger');
              return false; // mantém o alerta aberto
            }
            if (v.nova.length < 6) {
              this.toastService.presentToast(this.t('senhaCurta'), 'danger');
              return false;
            }
            if (v.nova !== v.confirma) {
              this.toastService.presentToast(this.t('senhaDiferente'), 'danger');
              return false;
            }

            this.authService.alterarSenha(v.atual, v.nova).subscribe({
              next: () => this.toastService.presentToast(this.t('senhaAlterada'), 'success'),
              error: (e: Error) =>
                this.toastService.presentToast(
                  this.t(e.message === 'SENHA_ATUAL' ? 'senhaAtualErrada' : 'erroSalvar'),
                  'danger'
                )
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}