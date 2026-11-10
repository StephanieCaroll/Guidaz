import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  searchOutline,
  funnelOutline,
  star,
  checkmarkOutline,
  closeOutline,
  personOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../../../../environments/environment';

export interface InstrutorItem {
  id: number;
  nome: string;
  fotoUrl?: string;
  categoriasLecionadas?: string;
  biografia?: string;
  notaMedia?: number;
  totalAvaliacoes?: number;
  hasImgError?: boolean;
}

export type FiltroCategoria = 'todas' | 'A' | 'B' | 'A, B' | 'top_rated';

@Component({
  selector: 'app-instrutores',
  templateUrl: './instrutores.page.html',
  styleUrls: ['./instrutores.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class InstrutoresPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = environment.apiUrl;

  instrutores: InstrutorItem[] = [];
  instrutoresFiltrados: InstrutorItem[] = [];

  termoBusca = '';
  filtroSelecionado: FiltroCategoria = 'todas';
  filtroAberto = false;
  carregando = true;
  erroCarregamento = false;

  readonly opcoesFiltro: { id: FiltroCategoria; label: string }[] = [
    { id: 'todas', label: 'Todas as categorias' },
    { id: 'A', label: 'Categoria A (Moto)' },
    { id: 'B', label: 'Categoria B (Carro)' },
    { id: 'A, B', label: 'Categoria A e B (Ambas)' },
    { id: 'top_rated', label: 'Melhor avaliados (4.5+)' }
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      searchOutline,
      funnelOutline,
      star,
      checkmarkOutline,
      closeOutline,
      personOutline,
      alertCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.carregarInstrutores();
  }

  ionViewWillEnter() {
    this.carregarInstrutores();
  }

  carregarInstrutores() {
    this.carregando = true;
    this.erroCarregamento = false;
    this.cdr.detectChanges();

    this.http.get<InstrutorItem[]>(`${this.apiUrl}/instrutores`).pipe(
      catchError((err) => {
        console.error('Erro ao buscar instrutores:', err);
        this.erroCarregamento = true;
        return of([]);
      })
    ).subscribe({
      next: (dados) => {
        this.instrutores = dados || [];
        this.aplicarFiltros();
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private normalizarTexto(texto: string | undefined | null): string {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private extrairCategorias(raw: string | undefined | null): string[] {
    if (!raw) return [];
    return raw
      .toUpperCase()
      .replace(/E/g, ',')
      .replace(/\//g, ',')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }

  filtrar() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const termo = this.normalizarTexto(this.termoBusca);

    this.instrutoresFiltrados = this.instrutores.filter((item) => {
      const nomeNorm = this.normalizarTexto(item.nome);
      const catNorm = this.normalizarTexto(item.categoriasLecionadas);
      const bioNorm = this.normalizarTexto(item.biografia);

      const bateuTexto = !termo ||
        nomeNorm.includes(termo) ||
        catNorm.includes(termo) ||
        bioNorm.includes(termo);

      let bateuCategoria = true;
      const categoriasDoInstrutor = this.extrairCategorias(item.categoriasLecionadas);

      if (this.filtroSelecionado === 'A') {
        bateuCategoria = categoriasDoInstrutor.includes('A');
      } else if (this.filtroSelecionado === 'B') {
        bateuCategoria = categoriasDoInstrutor.includes('B');
      } else if (this.filtroSelecionado === 'A, B') {
        bateuCategoria = categoriasDoInstrutor.includes('A') && categoriasDoInstrutor.includes('B');
      } else if (this.filtroSelecionado === 'top_rated') {
        const nota = Number(item.notaMedia ?? 5.0);
        bateuCategoria = nota >= 4.5;
      }

      return bateuTexto && bateuCategoria;
    });

    this.cdr.detectChanges();
  }

  toggleFiltroMenu() {
    this.filtroAberto = !this.filtroAberto;
  }

  selecionarFiltro(opcao: FiltroCategoria) {
    this.filtroSelecionado = opcao;
    this.filtroAberto = false;
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroSelecionado = 'todas';
    this.aplicarFiltros();
  }

  getFotoUrl(instrutor: InstrutorItem): string {
    const raw = instrutor.fotoUrl;
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    const baseUrl = this.apiUrl.replace(/\/api\/?$/, '');
    return raw.startsWith('/') ? `${baseUrl}${raw}` : `${baseUrl}/${raw}`;
  }

  onImgError(item: InstrutorItem) {
    item.hasImgError = true;
    this.cdr.detectChanges();
  }

  voltar() {
    this.navCtrl.back();
  }

  verPerfil(instrutor: InstrutorItem) {
    this.router.navigate(['/aluno/perfil-instrutor', instrutor.id]);
  }

  agendarAula(instrutor: InstrutorItem) {
    this.verPerfil(instrutor);
  }
}