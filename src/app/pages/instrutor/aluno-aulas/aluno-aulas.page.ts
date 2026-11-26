import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  documentTextOutline,
  calendarClearOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-aluno-aulas',
  templateUrl: './aluno-aulas.page.html',
  styleUrls: ['./aluno-aulas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonBadge
  ]
})
export class AlunoAulasPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = environment.apiUrl;

  alunoId: string | null = null;
  alunoNome: string = 'Aluno';
  aulas: any[] = [];
  carregando: boolean = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      timeOutline,
      locationOutline,
      documentTextOutline,
      calendarClearOutline
    });

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.alunoNome = nav.extras.state['alunoNome'] || 'Aluno';
    }
  }

  ngOnInit() {
    this.alunoId = this.route.snapshot.paramMap.get('id');
    if (this.alunoId) {
      this.carregarAulasDoAluno();
    }
  }

  carregarAulasDoAluno() {
    this.carregando = true;
    this.cdr.detectChanges();

    const url = `${this.apiUrl}/aulas/historico/aluno/${this.alunoId}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.aulas = data || [];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar histórico de aulas :', err);
        this.toastService.mostrar('Erro ao buscar as aulas do aluno.', 'erro');
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'REALIZADA':
      case 'CONCLUIDA':
        return 'success';
      case 'AGENDADA':
        return 'primary';
      case 'CANCELADA':
        return 'danger';
      default:
        return 'medium';
    }
  }

  voltar() {
    this.location.back();
  }
} 