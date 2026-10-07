import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaldoAulasPage } from './saldo-aulas.page';

describe('SaldoAulasPage', () => {
  let component: SaldoAulasPage;
  let fixture: ComponentFixture<SaldoAulasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SaldoAulasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
