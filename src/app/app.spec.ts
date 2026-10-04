import { TestBed } from '@angular/core/testing';
import { App } from './app';

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
});
