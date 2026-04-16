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

const dictionaries = {
  en: {
    languageName: 'English',
    labels: {
      'language.label': 'Language',
      'hero.workspace': 'Academic Analytics Workspace',
      'hero.start': 'Start',
      'hero.target': 'Target',
      'units.exams': 'exams',
      'stats.completedExams': 'Completed exams',
      'stats.ectsCredits': 'ECTS credits',
      'stats.pace': 'Pace (days per exam)',
      'stats.historical': 'Historical',
      'stats.recentTrend': 'Recent trend',
      'stats.examsPerYear': 'exams/year',
      'stats.estimatedFinish': 'Estimated finish',
      'stats.globalAverage': 'Global average',
      'chart.progressCurve': 'Progress curve',
      'chart.daysVsCompletedExams': 'Days vs completed exams',
      'chart.realProgress': 'Real progress',
      'chart.historicalTrend': 'Historical trend',
      'chart.idealThreeYears': 'Ideal 3 years',
      'chart.idealFourYears': 'Ideal 4 years',
      'chart.idealSixYears': 'Ideal 6 years',
      'chart.ariaLabel': 'Academic progress chart',
      'chart.date': 'Date',
      'chart.exam': 'Exam',
      'chart.grade': 'Grade',
      'chart.yearLabel': 'Year {index}',
      'editor.editableDataset': 'Editable dataset',
      'editor.jsonSource': 'JSON source',
      'editor.note': 'note',
      'editor.info': 'info',
      'editor.updateChart': 'Update chart',
      'editor.success': 'Chart data updated.',
      'editor.error': 'JSON parsing failed. Review the date and comma structure.',
    },
  },
  de: {
    languageName: 'Deutsch',
    labels: {
      'language.label': 'Sprache',
      'hero.workspace': 'Akademischer Analysebereich',
      'hero.start': 'Start',
      'hero.target': 'Ziel',
      'units.exams': 'Prüfungen',
      'stats.completedExams': 'Abgeschlossene Prüfungen',
      'stats.ectsCredits': 'ECTS-Punkte',
      'stats.pace': 'Tempo (Tage pro Prüfung)',
      'stats.historical': 'Historisch',
      'stats.recentTrend': 'Jüngster Trend',
      'stats.examsPerYear': 'Prüfungen/Jahr',
      'stats.estimatedFinish': 'Geschätzter Abschluss',
      'stats.globalAverage': 'Gesamtdurchschnitt',
      'chart.progressCurve': 'Fortschrittskurve',
      'chart.daysVsCompletedExams': 'Tage vs. abgeschlossene Prüfungen',
      'chart.realProgress': 'Realer Fortschritt',
      'chart.historicalTrend': 'Historischer Trend',
      'chart.idealThreeYears': 'Ideal 3 Jahre',
      'chart.idealFourYears': 'Ideal 4 Jahre',
      'chart.idealSixYears': 'Ideal 6 Jahre',
      'chart.ariaLabel': 'Diagramm zum Studienfortschritt',
      'chart.date': 'Datum',
      'chart.exam': 'Prüfung',
      'chart.grade': 'Note',
      'chart.yearLabel': 'Jahr {index}',
      'editor.editableDataset': 'Bearbeitbarer Datensatz',
      'editor.jsonSource': 'JSON-Quelle',
      'editor.note': 'hinweis',
      'editor.info': 'info',
      'editor.updateChart': 'Diagramm aktualisieren',
      'editor.success': 'Diagrammdaten aktualisiert.',
      'editor.error': 'JSON konnte nicht verarbeitet werden. Prüfe Datums- und Kommastruktur.',
    },
  },
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async (): Promise<void> => {
    localStorage.clear();
    localStorage.setItem('magnetar-sophia-language', 'de');

    globalThis.fetch = vi.fn(async (input: string | URL | Request): Promise<Response> => {
      const url = String(input);
      if (url === '/example.json') {
        return { json: async (): Promise<typeof examplePayload> => examplePayload } as Response;
      }
      if (url === '/i18n/de.json') {
        return { json: async (): Promise<typeof dictionaries.de> => dictionaries.de } as Response;
      }
      if (url === '/i18n/en.json') {
        return { json: async (): Promise<typeof dictionaries.en> => dictionaries.en } as Response;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

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

  it('should load example data and the preferred translation', (): void => {
    expect(globalThis.fetch).toHaveBeenCalledWith('/example.json');
    expect(globalThis.fetch).toHaveBeenCalledWith('/i18n/de.json');
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('MagnetarSophia');
    expect(app.rawRecords().length).toBe(2);
    expect(app.languageCode()).toBe('de');
    expect(app.t('stats.completedExams')).toBe('Abgeschlossene Prüfungen');
  });

  it('should switch the current language', async (): Promise<void> => {
    await app.switchLanguage('en');
    fixture.detectChanges();

    expect(app.languageCode()).toBe('en');
    expect(app.t('stats.completedExams')).toBe('Completed exams');
  });

  it('should translate using placeholders', (): void => {
    expect(app.t('chart.yearLabel', { index: '3' })).toBe('Jahr 3');
  });

  it('should report rtl only for arabic', (): void => {
    expect(app.isRightToLeft()).toBe(false);
    app.languageCode.set('ar');
    expect(app.isRightToLeft()).toBe(true);
  });

  it('should format dates and numbers using the selected locale', (): void => {
    expect(app.formatDate(new Date(2026, 0, 5))).toContain('2026');
    expect(app.formatMonthYear(new Date(2026, 0, 5))).toContain('2026');
    expect(app.formatTooltipDate(new Date(2026, 0, 5))).toContain('2026');
    expect(typeof app.formatNumber(12.5, 1, 1)).toBe('string');
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

  it('should report invalid json data using the active translation', (): void => {
    app.applyJson('{');

    expect(app.jsonSuccess()).toBe(false);
    expect(app.jsonError()).toContain('JSON konnte nicht verarbeitet werden');
  });

  it('should return an empty recent projection path when no data exists', (): void => {
    app.rawRecords.set([]);

    expect(app.recentProjectionPath()).toBe('');
  });

  it('should return browser languages', (): void => {
    expect(Array.isArray(app.getBrowserLanguages())).toBe(true);
  });
});
