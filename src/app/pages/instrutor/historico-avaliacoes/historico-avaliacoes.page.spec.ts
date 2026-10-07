import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricoAvaliacoesPage } from './historico-avaliacoes.page';

describe('HistoricoAvaliacoesPage', () => {
  let component: HistoricoAvaliacoesPage;
  let fixture: ComponentFixture<HistoricoAvaliacoesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricoAvaliacoesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
