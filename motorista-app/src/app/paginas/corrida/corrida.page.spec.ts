import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CorridaPage } from './corrida.page';

describe('CorridaPage', () => {
  let component: CorridaPage;
  let fixture: ComponentFixture<CorridaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CorridaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
