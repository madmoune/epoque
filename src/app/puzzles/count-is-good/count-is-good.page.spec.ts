import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CountIsGoodPage } from './count-is-good.page';

describe('CountIsGoodPage', () => {
  it('shows the current left-to-right total for a partial equation', async () => {
    await TestBed.configureTestingModule({
      imports: [CountIsGoodPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CountIsGoodPage);
    const component = fixture.componentInstance as any;

    component.expressionNumbers.set([10, 5, 2, undefined, undefined]);
    component.expressionOperations.set(['+', 'x', undefined, undefined]);
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('.current-total') as HTMLElement;
    expect(total.textContent).toContain('Total actuel');
    expect(total.textContent).toContain('30');
  });

  it('keeps updating after a division with a decimal result', async () => {
    await TestBed.configureTestingModule({
      imports: [CountIsGoodPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CountIsGoodPage);
    const component = fixture.componentInstance as any;

    component.expressionNumbers.set([5, 2, undefined, undefined, undefined]);
    component.expressionOperations.set(['/', undefined, undefined, undefined]);
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('.equation-result') as HTMLElement;
    expect(total.textContent).toContain('2.5');

    component.expressionNumbers.set([5, 2, 2, undefined, undefined]);
    component.expressionOperations.set(['/', 'x', undefined, undefined]);
    fixture.detectChanges();

    expect(total.textContent).toContain('5');

    component.undoLastEntry();
    fixture.detectChanges();

    expect(total.textContent).toContain('2.5');
  });
});
