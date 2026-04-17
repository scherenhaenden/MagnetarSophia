import { AcademicProgressService } from './academic-progress.service';
import { ChartMargin, ExampleData, ExamRecord, ProcessedExamRecord } from '../models/academic-progress.models';

describe('AcademicProgressService', () => {
  let service: AcademicProgressService;

  beforeEach((): void => {
    service = new AcademicProgressService();
  });

  it('should map json records', (): void => {
    expect(service.mapJsonRecord({ date: '2024-01-02', name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' }).name).toBe('Exam');
  });

  it('should parse example data', (): void => {
    const exampleData: ExampleData = {
      appTitle: 'MagnetarSophia',
      subtitle: 'Academic Progress Analysis',
      degreeTitle: 'B.Sc. Software Development',
      universityName: 'IU International University',
      startDate: '2023-05-24',
      totalExamTarget: 36,
      totalEctsTarget: 180,
      records: [{ date: '2024-01-02', name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' }],
    };

    const parsed = service.parseExampleData(exampleData);

    expect(parsed.startDate.getFullYear()).toBe(2023);
    expect(parsed.records.length).toBe(1);
  });

  it('should sort records by date', (): void => {
    const records: ExamRecord[] = [
      { date: new Date(2024, 5, 1), name: 'Later', examsCount: 2, ects: 5, grade: '1,7' },
      { date: new Date(2024, 1, 1), name: 'Earlier', examsCount: 1, ects: 5, grade: '2,0' },
    ];

    expect(service.sortRecords(records)[0].name).toBe('Earlier');
  });

  it('should process records with days from start', (): void => {
    const processed = service.processRecords(new Date(2024, 0, 1), [
      { date: new Date(2024, 0, 11), name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' },
    ]);

    expect(processed[0].daysFromStart).toBe(10);
  });

  it('should calculate current exams and earned ects', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 10, grade: '1,3', daysFromStart: 30 },
    ];

    expect(service.calculateCurrentExams(records)).toBe(2);
    expect(service.calculateEarnedEcts(records)).toBe(15);
  });

  it('should calculate pace values including fallback branches', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 5, grade: '1,3', daysFromStart: 30 },
    ];

    expect(service.calculatePace([])).toBe(0);
    expect(service.calculatePace(records)).toBe(15);
    expect(service.calculateRecentPace([], 1)).toBe(0);
    expect(service.calculateRecentPace(records, 1)).toBe(20);
  });

  it('should calculate projections including empty input branches', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 10, grade: '1,3', daysFromStart: 30 },
    ];

    expect(service.calculateProjectedDays(36, 12.5)).toBe(450);
    expect(service.calculateRecentProjectedDays([], 4, 8)).toBe(0);
    expect(service.calculateRecentProjectedDays(records, 4, 8)).toBe(46);
    expect(service.calculateProjectedDate(new Date(2024, 0, 1), 30).getDate()).toBe(31);
    expect(service.calculateDynamicMaxDays(2190, 1500, 2600)).toBe(2700);
  });

  it('should build chart helpers', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 10, grade: '1,3', daysFromStart: 30 },
    ];
    const margin: ChartMargin = { top: 40, right: 40, bottom: 60, left: 60 };

    expect(service.buildAxisYears(800, (index: number): string => `Year ${index}`)).toEqual([
      { days: 365, label: 'Year 1' },
      { days: 730, label: 'Year 2' },
    ]);
    expect(service.mapPoints(records, 180, 36, margin, 900, 400)[0].x).toBe(110);
    expect(service.buildActualPath([], 60, 440)).toBe('');
    expect(service.buildActualPath([{ x: 100, y: 200, record: records[0] }], 60, 440)).toBe('M 60 440 L 100 200');
    expect(service.buildProjectionPath(1, 2, 3, 4)).toBe('M 1 2 L 3 4');
  });

  it('should build and parse json payloads', (): void => {
    expect(service.buildJson([{ date: new Date(2024, 0, 2), name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' }])).toContain('2024-01-02');
    expect(service.parseJson('[{"date":"2024-01-02","name":"Exam","examsCount":1,"ects":5,"grade":"1,0"}]')[0].name).toBe('Exam');
    expect((): ExamRecord[] => service.parseJson('{"invalid":true}')).toThrowError('The provided JSON must describe an array of records.');
  });

  it('should parse json input as either records or full datasets', (): void => {
    expect(service.parseJsonInput('[{"date":"2024-01-02","name":"Exam","examsCount":1,"ects":5,"grade":"1,0"}]').records.length).toBe(1);

    const datasetResult = service.parseJsonInput(JSON.stringify({
      appTitle: 'MagnetarSophia',
      subtitle: 'Graduate Progress Observatory',
      degreeTitle: 'M.Sc. Data Science and Intelligent Systems',
      universityName: 'Technical University of Munich',
      startDate: '2024-10-01',
      totalExamTarget: 24,
      totalEctsTarget: 120,
      records: [{ date: '2025-01-02', name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' }]
    }));

    expect(datasetResult.dataset?.universityName).toBe('Technical University of Munich');
    expect(datasetResult.records.length).toBe(1);
    expect(() => service.parseJsonInput('null')).toThrowError('The provided JSON must describe an array of records or a full example dataset.');
    expect(() => service.parseJsonInput('{"invalid":true}')).toThrowError('The provided JSON must describe an array of records or a full example dataset.');
  });

  it('should resolve tooltip positions only for chart targets', (): void => {
    const chartSurface = document.createElement('div');
    const target = document.createElement('div');
    chartSurface.className = 'chart-surface';
    chartSurface.appendChild(target);
    document.body.appendChild(chartSurface);

    chartSurface.getBoundingClientRect = (): DOMRect => ({ x: 0, y: 0, width: 100, height: 100, top: 8, left: 6, right: 106, bottom: 108, toJSON: (): string => '' });

    const validEvent = new MouseEvent('mouseenter', { clientX: 20, clientY: 25 });
    Object.defineProperty(validEvent, 'target', { value: target });

    expect(service.getTooltipPosition(validEvent)).toEqual({ x: 14, y: 17 });
    expect(service.getTooltipPosition(new MouseEvent('mouseenter'))).toBeNull();

    document.body.removeChild(chartSurface);
  });
});
