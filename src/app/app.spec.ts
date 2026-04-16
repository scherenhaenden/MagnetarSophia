
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

const examplePayload = {
  appTitle: 'MagnetarSophia',
  subtitle: 'Academic Progress Analysis',
  degreeTitle: 'B.Sc. Software Development',
  universityName: 'IU International University',
  startDate: '2023-05-24',
  totalExamTarget: 36,
  totalEctsTarget: 180,
  records: [
    { date: '2026-04-01', name: 'New Exam', examsCount: 1, ects: 5, grade: '1,0' },
    { date: '2026-04-15', name: 'Next Exam', examsCount: 2, ects: 5, grade: '1,3' },
  ],
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async (): Promise<void> => {
    globalThis.fetch = vi.fn(async (): Promise<Response> => ({
      json: async (): Promise<typeof examplePayload> => examplePayload,
    } as Response));

    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create the app', (): void => {
    expect(app).toBeTruthy();
  });

  it('should load data from example.json and render the project title', (): void => {
    expect(globalThis.fetch).toHaveBeenCalledWith('/example.json');
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('MagnetarSophia');
    expect(app.rawRecords().length).toBe(2);
  });

  it('should calculate chart x coordinates', (): void => {
    expect(app.getX(0)).toBe(60);
  });

  it('should calculate chart y coordinates', (): void => {
    expect(app.getY(36)).toBe(40);
  });

  it('should build ideal paths', (): void => {
    expect(app.buildIdealPath(365)).toContain('M ');
  });

  it('should set hover data and tooltip position when the chart point is hovered', (): void => {
    const point = app.mappedPoints()[0];
    const chartSurface = document.createElement('div');
    const target = document.createElement('div');
    chartSurface.className = 'chart-surface';
    chartSurface.appendChild(target);
    document.body.appendChild(chartSurface);

    chartSurface.getBoundingClientRect = (): DOMRect => ({ x: 0, y: 0, width: 100, height: 100, top: 20, left: 10, right: 110, bottom: 120, toJSON: (): string => '' });

    const event = new MouseEvent('mouseenter', { clientX: 45, clientY: 70 });
    Object.defineProperty(event, 'target', { value: target });

    app.hoverPoint(point, event);

    expect(app.hoveredData()).toBe(point);
    expect(app.tooltipPos()).toEqual({ x: 35, y: 50 });

    document.body.removeChild(chartSurface);
  });

  it('should keep the previous tooltip position when the event has no chart surface', (): void => {
    const point = app.mappedPoints()[0];
    const event = new MouseEvent('mouseenter');

    app.tooltipPos.set({ x: 12, y: 34 });
    app.hoverPoint(point, event);

    expect(app.hoveredData()).toBe(point);
    expect(app.tooltipPos()).toEqual({ x: 12, y: 34 });
  });

  it('should clear hover state when no event is provided', (): void => {
    app.hoveredData.set(app.mappedPoints()[0]);
    app.hoverPoint(null, null);

    expect(app.hoveredData()).toBeNull();
  });

  it('should apply valid json data', (): void => {
    app.applyJson('[{"date":"2026-04-01","name":"New Exam","examsCount":1,"ects":5,"grade":"1,0"}]');

    expect(app.rawRecords().length).toBe(1);
    expect(app.jsonError()).toBe('');
    expect(app.jsonSuccess()).toBe(true);
  });

  it('should report invalid json data', (): void => {
    app.applyJson('{');

    expect(app.jsonSuccess()).toBe(false);
    expect(app.jsonError()).toContain('JSON parsing failed');
  });

  it('should return an empty recent projection path when no data exists', (): void => {
    app.rawRecords.set([]);

    expect(app.recentProjectionPath()).toBe('');
  });
});
