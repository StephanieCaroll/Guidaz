import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  alertCircleOutline,
  warningOutline,
  informationCircleOutline,
  closeOutline
} from 'ionicons/icons';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
      warningOutline,
      informationCircleOutline,
      closeOutline
    });
  }

  async mostrar(
    mensagem: string,
    tipo: 'ok' | 'erro' | 'info' | 'warning' | string = 'info',
    duracao: number = 3200
  ): Promise<void> {
    let classeTipo = 'guidaz-toast--info';
    let icon = 'information-circle-outline';

    if (tipo === 'ok' || tipo === 'success') {
      classeTipo = 'guidaz-toast--ok';
      icon = 'checkmark-circle-outline';
    } else if (tipo === 'erro' || tipo === 'danger') {
      classeTipo = 'guidaz-toast--erro';
      icon = 'alert-circle-outline';
    } else if (tipo === 'warning') {
      classeTipo = 'guidaz-toast--warning';
      icon = 'warning-outline';
    }

    const toast = await this.toastController.create({
      message: mensagem,
      duration: duracao,
      position: 'bottom',
      icon,
      cssClass: ['guidaz-toast', classeTipo],
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary',
    duration: number = 3200
  ): Promise<void> {
    await this.mostrar(message, color, duration);
  }
}