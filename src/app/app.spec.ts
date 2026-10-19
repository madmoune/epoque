import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application options menu', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.quick-menu-toggle')?.getAttribute('aria-label')).toBe(
      'Ouvrir le menu des options',
    );
    expect(compiled.querySelector('.quick-menu-title')?.textContent).toContain('Options');
    expect(compiled.querySelector('.theme-button')).not.toBeNull();
  });

  it('requires confirmation before executing a protected action', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset['confirmAction'] = 'restart';
    const action = vi.fn();
    button.addEventListener('click', action);
    document.body.appendChild(button);

    button.click();
    fixture.detectChanges();

    expect(action).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    const cancelButton = fixture.nativeElement.querySelector(
      '.action-confirmation-actions .secondary-button',
    ) as HTMLButtonElement;
    cancelButton.click();
    expect(action).not.toHaveBeenCalled();

    button.click();
    fixture.detectChanges();
    const confirmButton = fixture.nativeElement.querySelector(
      '.confirm-action-button',
    ) as HTMLButtonElement;
    confirmButton.click();

    expect(action).toHaveBeenCalledOnce();
    button.remove();
  });
});
