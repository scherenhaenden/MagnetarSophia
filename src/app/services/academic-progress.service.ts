import { Injectable } from '@angular/core';
import { AxisYear, ChartMargin, ChartPoint, ExampleData, ExamRecord, JsonExamRecord, ProcessedExamRecord, TooltipPosition } from '../models/academic-progress.models';

@Injectable({ providedIn: 'root' })
export class AcademicProgressService {
  public mapJsonRecord(record: JsonExamRecord): ExamRecord {
    const [year, month, day] = record.date.split('-').map((value: string) => Number(value));
    return {
      date: new Date(year, month - 1, day),
      name: record.name,
      examsCount: record.examsCount,
      ects: record.ects,
      grade: record.grade,
    };
  }

  public parseExampleData(data: ExampleData): { startDate: Date; records: ExamRecord[] } {
    const [year, month, day] = data.startDate.split('-').map((value: string) => Number(value));
    return {
      startDate: new Date(year, month - 1, day),
      records: this.sortRecords(data.records.map((record: JsonExamRecord) => this.mapJsonRecord(record))),
    };
  }

  public sortRecords(records: ReadonlyArray<ExamRecord>): ExamRecord[] {
    return [...records].sort((left: ExamRecord, right: ExamRecord) => left.date.getTime() - right.date.getTime());
  }

  public processRecords(startDate: Date, records: ReadonlyArray<ExamRecord>): ProcessedExamRecord[] {
    const start: number = startDate.getTime();
    return this.sortRecords(records).map((record: ExamRecord) => ({
      ...record,
      daysFromStart: Math.floor((record.date.getTime() - start) / 86400000),
    }));
  }

  public calculateCurrentExams(records: ReadonlyArray<ProcessedExamRecord>): number {
    return records.length;
  }

  public calculateEarnedEcts(records: ReadonlyArray<ProcessedExamRecord>): number {
    return records.reduce((sum: number, record: ProcessedExamRecord) => sum + record.ects, 0);
  }

  public calculatePace(records: ReadonlyArray<ProcessedExamRecord>): number {
    return records.length === 0 ? 0 : records[records.length - 1].daysFromStart / records[records.length - 1].examsCount;
  }

  public calculateRecentPace(records: ReadonlyArray<ProcessedExamRecord>, recentWindow: number = 4): number {
    const sampleSize: number = Math.min(recentWindow, records.length - 1);
    if (sampleSize <= 0) {
      return this.calculatePace(records);
    }

    const last: ProcessedExamRecord = records[records.length - 1];
    const previous: ProcessedExamRecord = records[records.length - 1 - sampleSize];
    return (last.daysFromStart - previous.daysFromStart) / sampleSize;
  }

  public calculateProjectedDays(targetExamCount: number, pace: number): number {
    return Math.max(0, Math.floor(targetExamCount * pace));
  }

  public calculateRecentProjectedDays(records: ReadonlyArray<ProcessedExamRecord>, targetExamCount: number, recentPace: number): number {
    if (records.length === 0) {
      return 0;
    }

    const last: ProcessedExamRecord = records[records.length - 1];
    return last.daysFromStart + Math.floor(recentPace * Math.max(0, targetExamCount - last.examsCount));
  }

  public calculateProjectedDate(startDate: Date, projectedDays: number): Date {
    const projectedDate: Date = new Date(startDate.getTime());
    projectedDate.setDate(projectedDate.getDate() + projectedDays);
    return projectedDate;
  }

  public calculateDynamicMaxDays(minimumDays: number, projectedDays: number, recentProjectedDays: number): number {
    return Math.max(minimumDays, projectedDays, recentProjectedDays) + 100;
  }

  public buildAxisYears(maxDays: number, labelBuilder: (index: number) => string): AxisYear[] {
    const result: AxisYear[] = [];
    for (let day = 365, index = 1; day <= maxDays; day += 365, index += 1) {
      result.push({ days: day, label: labelBuilder(index) });
    }
    return result;
  }

  public mapPoints(records: ReadonlyArray<ProcessedExamRecord>, maxDays: number, targetExamCount: number, margin: ChartMargin, innerWidth: number, innerHeight: number): ChartPoint[] {
    return records.map((record: ProcessedExamRecord) => ({
      x: margin.left + (record.daysFromStart / maxDays) * innerWidth,
      y: margin.top + innerHeight - (record.examsCount / targetExamCount) * innerHeight,
      record,
    }));
  }

  public buildActualPath(points: ReadonlyArray<ChartPoint>, originX: number, originY: number): string {
    if (points.length === 0) {
      return '';
    }

    return [`M ${originX} ${originY}`, ...points.map((point: ChartPoint) => `L ${point.x} ${point.y}`)].join(' ');
  }

  public buildProjectionPath(startX: number, startY: number, endX: number, endY: number): string {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  public buildJson(records: ReadonlyArray<ExamRecord>): string {
    return JSON.stringify(
      this.sortRecords(records).map((record: ExamRecord) => ({
        date: `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}-${String(record.date.getDate()).padStart(2, '0')}`,
        name: record.name,
        examsCount: record.examsCount,
        ects: record.ects,
        grade: record.grade,
      })),
      null,
      2,
    );
  }

  public parseJson(json: string): ExamRecord[] {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('The provided JSON must describe an array of records.');
    }

    return this.sortRecords(parsed.map((item: JsonExamRecord) => this.mapJsonRecord(item)));
  }

  public parseJsonInput(json: string): { dataset: ExampleData | null; records: ExamRecord[] } {
    const parsed: unknown = JSON.parse(json);

    if (Array.isArray(parsed)) {
      return {
        dataset: null,
        records: this.sortRecords(parsed.map((item: JsonExamRecord) => this.mapJsonRecord(item))),
      };
    }

    if (this.isExampleData(parsed)) {
      const parsedDataset = this.parseExampleData(parsed);
      return {
        dataset: parsed,
        records: parsedDataset.records,
      };
    }

    throw new Error('The provided JSON must describe an array of records or a full example dataset.');
  }

  public getTooltipPosition(event: MouseEvent): TooltipPosition | null {
    const target: Element | null = event.target instanceof Element ? event.target : null;
    const chartArea: HTMLElement | null = target?.closest('.chart-surface') as HTMLElement | null;
    if (!chartArea) {
      return null;
    }

    const bounds: DOMRect = chartArea.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  private isExampleData(value: unknown): value is ExampleData {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate: Partial<ExampleData> = value as Partial<ExampleData>;
    return typeof candidate.appTitle === 'string'
      && typeof candidate.subtitle === 'string'
      && typeof candidate.degreeTitle === 'string'
      && typeof candidate.universityName === 'string'
      && typeof candidate.startDate === 'string'
      && typeof candidate.totalExamTarget === 'number'
      && typeof candidate.totalEctsTarget === 'number'
      && Array.isArray(candidate.records);
  }
}
