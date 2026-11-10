import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  ellipsisHorizontalOutline,
  star,
  personOutline,
  calendarOutline,
  locationOutline,
  alertCircleOutline,
  timeOutline
} from 'ionicons/icons';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

export interface Avaliacao {
  id?: number;
  nomeAluno?: string;
  nome?: string;
  nota?: number;
  comentario?: string;
}

export interface InstrutorDetalhado {
  id: number;
  nome: string;
  fotoUrl?: string;
  categoriasLecionadas?: string | null;
  biografia?: string | null;
  notaMedia?: number;
  totalAvaliacoes?: number;
  precoAulaAvulsa?: number | string;
  precoPacote?: number | string;
  qtdAulasPacote?: number;

  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  localizacaoCompleta?: string;

  veiculoModelo?: string;
  veiculoAno?: number;
  veiculoPlaca?: string;

  disponibilidade?: string;
  avaliacoes?: Avaliacao[];
}

@Component({
  selector: 'app-perfil-instrutor',
  templateUrl: './perfil-instrutor.page.html',
  styleUrls: ['./perfil-instrutor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]
})
export class PerfilInstrutorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = environment.apiUrl;

  instrutorId: number | null = null;
  instrutor: InstrutorDetalhado | null = null;
  
  carregando = true;
  erroCarregamento = false;
  hasImgError = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      ellipsisHorizontalOutline,
      star,
      personOutline,
      calendarOutline,
      locationOutline,
      alertCircleOutline,
      timeOutline
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.instrutorId = Number(idParam);
      this.carregarDadosInstrutor();
    } else {
      this.carregando = false;
      this.erroCarregamento = true;
    }
  }

  carregarDadosInstrutor() {
    if (!this.instrutorId) return;

    this.carregando = true;
    this.erroCarregamento = false;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.apiUrl}/instrutores/${this.instrutorId}`).pipe(
      catchError((err) => {
        console.error('Erro ao carregar perfil do instrutor:', err);
        this.erroCarregamento = true;
        return of(null);
      })
    ).subscribe({
      next: (dados: any) => {
        if (dados) {
          // Monta o endereço completo legível com base nos campos do backend
          const partesEndereco = [
            dados.logradouro ? `${dados.logradouro}${dados.numero ? ', ' + dados.numero : ''}` : '',
            dados.complemento ? `(${dados.complemento})` : '',
            dados.bairro,
            dados.cidade
          ].filter(Boolean);

          const enderecoFormatado = partesEndereco.length > 0
            ? partesEndereco.join(' - ')
            : (dados.regiaoAtendimento || dados.regiao || dados.localizacao || '');

          // Tratamento da disponibilidade em texto ou objeto
          let disp = '';
          if (typeof dados.disponibilidade === 'string') {
            disp = dados.disponibilidade;
          } else if (dados.horarioAtendimento) {
            disp = String(dados.horarioAtendimento);
          } else if (dados.agenda) {
            disp = String(dados.agenda);
          } else if (Array.isArray(dados.disponibilidade)) {
            disp = dados.disponibilidade
              .map((d: any) => (typeof d === 'string' ? d : `${d.dia || ''}: ${d.horario || ''}`))
              .join(', ');
          }

          this.instrutor = {
            ...dados,
            localizacaoCompleta: enderecoFormatado.trim(),
            disponibilidade: String(disp).trim()
          };
        } else {
          this.instrutor = null;
        }

        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFotoUrl(): string {
    const raw = this.instrutor?.fotoUrl;
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const baseUrl = this.apiUrl.replace(/\/api\/?$/, '');
    return raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
  }

  onImgError() {
    this.hasImgError = true;
    this.cdr.detectChanges();
  }

  voltar() {
    this.navCtrl.back();
  }

  agendarAula() {
    if (this.instrutorId) {
      this.router.navigate(['/aluno/pacotes'], {
        queryParams: { instrutorId: this.instrutorId },
        state: { instrutorId: this.instrutorId, instrutorNome: this.instrutor?.nome }
      });
    }
  }
}