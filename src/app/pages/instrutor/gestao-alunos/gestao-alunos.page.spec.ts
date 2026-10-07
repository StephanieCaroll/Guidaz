import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestaoAlunosPage } from './gestao-alunos.page';

describe('GestaoAlunosPage', () => {
  let component: GestaoAlunosPage;
  let fixture: ComponentFixture<GestaoAlunosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestaoAlunosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
