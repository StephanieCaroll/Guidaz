import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagamentoPixPage } from './pagamento-pix.page';

describe('PagamentoPixPage', () => {
  let component: PagamentoPixPage;
  let fixture: ComponentFixture<PagamentoPixPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagamentoPixPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
