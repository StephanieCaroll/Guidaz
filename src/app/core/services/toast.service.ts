import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly ctrl = inject(ToastController);

  async mostrar(message: string, tipo: 'ok' | 'erro' | 'info' = 'info'): Promise<void> {
    const color = tipo === 'ok' ? 'success' : tipo === 'erro' ? 'danger' : 'primary';
    const toast = await this.ctrl.create({ message, duration: 2600, position: 'top', color });
    await toast.present();
  }
}
