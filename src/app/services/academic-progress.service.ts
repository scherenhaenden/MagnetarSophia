import { Injectable } from "@angular/core";
import { AxisYear, ChartMargin, ChartPoint, ExamRecord, ProcessedExamRecord, TooltipPosition } from "../models/academic-progress.models";

@Injectable({ providedIn: "root" })
export class AcademicProgressService {
  public getDefaultRecords(): ExamRecord[] {
    return [
      { date: new Date(2023, 11, 9), name: "Database Modeling (IDBS01)", examsCount: 1, ects: 5, grade: "3,0" },
      { date: new Date(2024, 1, 24), name: "Software Eng. Principles (IGIS01)", examsCount: 2, ects: 5, grade: "2,0" },
      { date: new Date(2024, 3, 27), name: "OOP with Java (IOBP01)", examsCount: 3, ects: 5, grade: "2,0" },
      { date: new Date(2024, 5, 8), name: "Web Application Dev (IPWA01)", examsCount: 4, ects: 5, grade: "1,3" },
      { date: new Date(2024, 9, 18), name: "Requirements Engineering (IREN01)", examsCount: 5, ects: 5, grade: "1,7" },
      { date: new Date(2025, 0, 3), name: "Specification (ISPE01)", examsCount: 6, ects: 5, grade: "2,3" },
      { date: new Date(2025, 1, 14), name: "Software QA (IQSS01)", examsCount: 7, ects: 5, grade: "2,7" },
      { date: new Date(2025, 2, 21), name: "IT Architecture (IAMG01)", examsCount: 8, ects: 5, grade: "2,3" },
      { date: new Date(2025, 6, 19), name: "Data Structures (DLBCSDSJCL02)", examsCount: 9, ects: 5, grade: "1,0" },
      { date: new Date(2025, 9, 20), name: "Prog. Info Systems (IPWA02)", examsCount: 10, ects: 5, grade: "2,0" },
      { date: new Date(2025, 11, 6), name: "IT-Service Mgmt (IWSM01)", examsCount: 11, ects: 5, grade: "1,0" },
      { date: new Date(2025, 11, 21), name: "Intro to Academic Work (DLBWIRITT)", examsCount: 12, ects: 5, grade: "2,3" },
      { date: new Date(2026, 0, 29), name: "Project: Mobile SE (DLBCSEMSE02)", examsCount: 13, ects: 5, grade: "1,0" },
      { date: new Date(2026, 1, 11), name: "Algorithms & Data Structures (DLBIADPS01)", examsCount: 14, ects: 5, grade: "1,0" },
      { date: new Date(2026, 1, 28), name: "Ethics and Sustainability (DLBSEPENIT)", examsCount: 15, ects: 5, grade: "2,3" },
    ];
  }

  public sortRecords(records: ReadonlyArray<ExamRecord>): ExamRecord[] {
    return [...records].sort((left, right) => left.date.getTime() - right.date.getTime());
  }

  public processRecords(startDate: Date, records: ReadonlyArray<ExamRecord>): ProcessedExamRecord[] {
    const start = startDate.getTime();
    return this.sortRecords(records).map((record) => ({ ...record, daysFromStart: Math.floor((record.date.getTime() - start) / 86400000) }));
  }

  public calculateCurrentExams(records: ReadonlyArray<ProcessedExamRecord>): number { return records.length; }
  public calculateEarnedEcts(records: ReadonlyArray<ProcessedExamRecord>): number { return records.reduce((sum, record) => sum + record.ects, 0); }
  public calculatePace(records: ReadonlyArray<ProcessedExamRecord>): number { return records.length === 0 ? 0 : records[records.length - 1].daysFromStart / records[records.length - 1].examsCount; }
  public calculateRecentPace(records: ReadonlyArray<ProcessedExamRecord>, recentWindow: number = 4): number {
    const sampleSize = Math.min(recentWindow, records.length - 1);
    if (sampleSize <= 0) return this.calculatePace(records);
    const last = records[records.length - 1];
    const previous = records[records.length - 1 - sampleSize];
    return (last.daysFromStart - previous.daysFromStart) / sampleSize;
  }
  public calculateProjectedDays(targetExamCount: number, pace: number): number { return Math.max(0, Math.floor(targetExamCount * pace)); }
  public calculateRecentProjectedDays(records: ReadonlyArray<ProcessedExamRecord>, targetExamCount: number, recentPace: number): number {
    if (records.length === 0) return 0;
    const last = records[records.length - 1];
    return last.daysFromStart + Math.floor(recentPace * Math.max(0, targetExamCount - last.examsCount));
  }
  public calculateProjectedDate(startDate: Date, projectedDays: number): Date { const d = new Date(startDate.getTime()); d.setDate(d.getDate() + projectedDays); return d; }
  public calculateDynamicMaxDays(minimumDays: number, projectedDays: number, recentProjectedDays: number): number { return Math.max(minimumDays, projectedDays, recentProjectedDays) + 100; }
  public buildAxisYears(maxDays: number): AxisYear[] { const result: AxisYear[] = []; for (let day = 365, index = 1; day <= maxDays; day += 365, index += 1) result.push({ days: day, label: `Year ${index}` }); return result; }
  public mapPoints(records: ReadonlyArray<ProcessedExamRecord>, maxDays: number, targetExamCount: number, margin: ChartMargin, innerWidth: number, innerHeight: number): ChartPoint[] { return records.map((record) => ({ x: margin.left + (record.daysFromStart / maxDays) * innerWidth, y: margin.top + innerHeight - (record.examsCount / targetExamCount) * innerHeight, record })); }
  public buildActualPath(points: ReadonlyArray<ChartPoint>, originX: number, originY: number): string { if (points.length === 0) return ""; return [`M ${originX} ${originY}`, ...points.map((point) => `L ${point.x} ${point.y}`)].join(" "); }
  public buildProjectionPath(startX: number, startY: number, endX: number, endY: number): string { return `M ${startX} ${startY} L ${endX} ${endY}`; }
  public buildJson(records: ReadonlyArray<ExamRecord>): string { return JSON.stringify(this.sortRecords(records).map((record) => ({ date: `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, "0")}-${String(record.date.getDate()).padStart(2, "0")}`, name: record.name, examsCount: record.examsCount, ects: record.ects, grade: record.grade })), null, 2); }
  public parseJson(json: string): ExamRecord[] { const parsed = JSON.parse(json); if (!Array.isArray(parsed)) throw new Error("The provided JSON must describe an array of records."); return this.sortRecords(parsed.map((item: any) => { const [year, month, day] = String(item.date).split("-").map((value) => Number(value)); return { date: new Date(year, month - 1, day), name: String(item.name), examsCount: Number(item.examsCount), ects: Number(item.ects), grade: String(item.grade) }; })); }
  public getTooltipPosition(event: MouseEvent): TooltipPosition | null { const target = event.target instanceof Element ? event.target : null; const chartArea = target?.closest(".chart-surface") as HTMLElement | null; if (!chartArea) return null; const bounds = chartArea.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; }
}
