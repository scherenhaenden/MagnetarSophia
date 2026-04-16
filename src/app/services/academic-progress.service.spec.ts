import { AcademicProgressService } from './academic-progress.service';
import { ChartMargin, ExamRecord, ProcessedExamRecord } from '../models/academic-progress.models';

describe('AcademicProgressService', () => {
  let service: AcademicProgressService;

  beforeEach((): void => {
    service = new AcademicProgressService();
  });

  it('should expose the default records', (): void => {
    expect(service.getDefaultRecords().length).toBeGreaterThan(0);
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

  it('should calculate pace values', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 5, grade: '1,3', daysFromStart: 30 },
    ];

    expect(service.calculatePace(records)).toBe(15);
    expect(service.calculateRecentPace(records, 1)).toBe(20);
  });

  it('should calculate projections and json helpers', (): void => {
    const records: ProcessedExamRecord[] = [
      { date: new Date(), name: 'Exam 1', examsCount: 1, ects: 5, grade: '1,0', daysFromStart: 10 },
      { date: new Date(), name: 'Exam 2', examsCount: 2, ects: 10, grade: '1,3', daysFromStart: 30 },
    ];
    const margin: ChartMargin = { top: 40, right: 40, bottom: 60, left: 60 };

    expect(service.calculateCurrentExams(records)).toBe(2);
    expect(service.calculateEarnedEcts(records)).toBe(15);
    expect(service.calculateProjectedDays(36, 12.5)).toBe(450);
    expect(service.calculateRecentProjectedDays(records, 4, 8)).toBe(46);
    expect(service.calculateProjectedDate(new Date(2024, 0, 1), 30).getDate()).toBe(31);
    expect(service.calculateDynamicMaxDays(2190, 1500, 2600)).toBe(2700);
    expect(service.buildAxisYears(800)).toEqual([
      { days: 365, label: 'Year 1' },
      { days: 730, label: 'Year 2' },
    ]);
    expect(service.mapPoints(records, 180, 36, margin, 900, 400)[0].x).toBe(110);
    expect(service.buildActualPath([{ x: 100, y: 200, record: records[0] }], 60, 440)).toBe('M 60 440 L 100 200');
    expect(service.buildProjectionPath(1, 2, 3, 4)).toBe('M 1 2 L 3 4');
    expect(service.buildJson([{ date: new Date(2024, 0, 2), name: 'Exam', examsCount: 1, ects: 5, grade: '1,0' }])).toContain('2024-01-02');
    expect(service.parseJson('[{"date":"2024-01-02","name":"Exam","examsCount":1,"ects":5,"grade":"1,0"}]')[0].name).toBe('Exam');
  });
});
