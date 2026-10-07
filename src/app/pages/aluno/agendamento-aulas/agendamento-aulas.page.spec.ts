import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendamentoAulasPage } from './agendamento-aulas.page';

describe('AgendamentoAulasPage', () => {
  let component: AgendamentoAulasPage;
  let fixture: ComponentFixture<AgendamentoAulasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgendamentoAulasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
