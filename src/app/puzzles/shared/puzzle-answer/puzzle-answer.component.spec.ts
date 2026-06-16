import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PuzzleAnswerComponent } from './puzzle-answer.component';

describe('PuzzleAnswerComponent', () => {
  let fixture: ComponentFixture<PuzzleAnswerComponent>;
  let component: PuzzleAnswerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleAnswerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PuzzleAnswerComponent);
    component = fixture.componentInstance;
    component.answer = 'bingo';
    component.partials = [{ answer: 'bins', message: 'You are close.' }];
    fixture.detectChanges();
  });

  it('logs submitted answers with their validation text', async () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const form = fixture.debugElement.query(By.css('form'));

    input.value = 'bins';
    input.dispatchEvent(new Event('input'));
    form.triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    const attempt = fixture.nativeElement.querySelector('.answer-attempt') as HTMLElement;

    expect(attempt.textContent).toContain('bins');
    expect(attempt.textContent).toContain('Indice');
    expect(attempt.textContent).toContain('You are close.');
  });

  it('locks the input after a correct answer by default', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const form = fixture.debugElement.query(By.css('form'));

    input.value = 'bingo';
    input.dispatchEvent(new Event('input'));
    form.triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(input.disabled).toBe(true);
  });

  it('does not repeat default status text as a message', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const form = fixture.debugElement.query(By.css('form'));

    input.value = 'nope';
    input.dispatchEvent(new Event('input'));
    form.triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    const attempt = fixture.nativeElement.querySelector('.answer-attempt') as HTMLElement;
    const resultText = attempt.querySelector('.attempt-result')?.textContent ?? '';

    expect(resultText.match(/Incorrect/g)?.length).toBe(1);
  });
});
