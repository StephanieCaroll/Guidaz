import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async mostrar(mensagem: string, tipo: 'ok' | 'erro' | 'info' | string = 'info', duracao: number = 3000) {
    let color: 'success' | 'danger' | 'warning' | 'primary' = 'primary';
    
    if (tipo === 'ok' || tipo === 'success') color = 'success';
    if (tipo === 'erro' || tipo === 'danger') color = 'danger';
    if (tipo === 'warning') color = 'warning';

    const toast = await this.toastController.create({
      message: mensagem,
      duration: duracao,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary', duration: number = 3000) {
    await this.mostrar(message, color, duration);
  }
}