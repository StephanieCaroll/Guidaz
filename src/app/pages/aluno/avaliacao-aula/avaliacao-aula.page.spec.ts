import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvaliacaoAulaPage } from './avaliacao-aula.page';

describe('AvaliacaoAulaPage', () => {
  let component: AvaliacaoAulaPage;
  let fixture: ComponentFixture<AvaliacaoAulaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AvaliacaoAulaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
