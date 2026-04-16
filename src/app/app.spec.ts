import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async (): Promise<void> => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', (): void => {
    expect(app).toBeTruthy();
  });

  it('should render the project title', (): void => {
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('MagnetarSophia');
  });

  it('should calculate chart x coordinates', (): void => {
    expect(app.getX(0)).toBe(60);
  });

  it('should calculate chart y coordinates', (): void => {
    expect(app.getY(36)).toBe(40);
  });
});
