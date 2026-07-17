import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PivotWordPage } from './pivot-word.page';

describe('PivotWordPage', () => {
  it('completes the puzzle immediately when the correct word is typed', async () => {
    await TestBed.configureTestingModule({
      imports: [PivotWordPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PivotWordPage);
    const page = fixture.componentInstance as any;

    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#pivot-word-answer') as HTMLInputElement;
    const answer = page.puzzle().answer;

    expect(fixture.nativeElement.textContent).not.toContain('Vérifier');

    input.value = answer;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(page.isSolved()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-puzzle-success-popup')).not.toBeNull();
  });
});
