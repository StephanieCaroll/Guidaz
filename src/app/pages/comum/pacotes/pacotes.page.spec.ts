import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PacotesPage } from './pacotes.page';

describe('PacotesPage', () => {
  let component: PacotesPage;
  let fixture: ComponentFixture<PacotesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PacotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
