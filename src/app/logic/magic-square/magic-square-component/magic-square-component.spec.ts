import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicSquareComponent } from './magic-square-component';

describe('MagicSquareComponent', () => {
  let component: MagicSquareComponent;
  let fixture: ComponentFixture<MagicSquareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicSquareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MagicSquareComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
