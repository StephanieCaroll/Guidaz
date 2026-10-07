import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaDisponibilidadePage } from './agenda-disponibilidade.page';

describe('AgendaDisponibilidadePage', () => {
  let component: AgendaDisponibilidadePage;
  let fixture: ComponentFixture<AgendaDisponibilidadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgendaDisponibilidadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
