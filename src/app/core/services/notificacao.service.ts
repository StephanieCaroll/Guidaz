
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { SettingsService } from './settings.service';

export interface NotificacaoApi {
  id: number;
  destinatarioId: number;
  perfilDestinatario: string;
  tipo: 'cancelada' | 'agendada' | 'pagamento';
  titulo: string;
  descricao: string;
  referenciaTipo?: 'PEDIDO' | 'AULA' | string | null;
  referenciaId?: number | null;
  lida: boolean;
  criadaEm: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly http = inject(HttpClient);
  private readonly settings = inject(SettingsService);
  private readonly apiUrl = environment.apiUrl;

  listar(usuarioId: number, perfil: string): Observable<NotificacaoApi[]> {
    if (!this.settings.notificacoes()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('usuarioId', String(usuarioId))
      .set('perfil', perfil.toUpperCase());

    return this.http
      .get<NotificacaoApi[]>(`${this.apiUrl}/notificacoes`, { params })
      .pipe(
        timeout(15000),
        map((lista) => (Array.isArray(lista) ? lista : [])),
        catchError(() => of([]))
      );
  }

  marcarComoLida(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/notificacoes/${id}/lida`, {})
      .pipe(
        timeout(10000),
        catchError(() => of(void 0))
      );
  }
}
