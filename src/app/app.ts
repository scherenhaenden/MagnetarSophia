import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AxisYear, ChartMargin, ChartPoint, ExamRecord, ProcessedExamRecord, TooltipPosition } from './models/academic-progress.models';
import { AcademicProgressService } from './services/academic-progress.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
<main class="page-shell">
  <section class="page-content">
    <header class="hero-card">
      <div>
        <p class="eyebrow">Academic Analytics Workspace</p>
        <h1>{{ projectTitle }}</h1>
        <p class="subtitle">{{ degreeTitle }} progress analysis workspace</p>
      </div>
      <div class="hero-badges">
        <span class="badge">Start: {{ startDate | date: 'dd MMM yyyy' }}</span>
        <span class="badge badge-highlight">Target: {{ totalExamTarget }} exams / {{ totalEctsTarget }} ECTS</span>
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card"><p class="stat-label">Completed exams</p><p class="stat-value">{{ currentExams() }} <span>/ {{ totalExamTarget }}</span></p></article>
      <article class="stat-card"><p class="stat-label">Earned ECTS</p><p class="stat-value">{{ earnedEcts() }} <span>/ {{ totalEctsTarget }}</span></p></article>
      <article class="stat-card"><p class="stat-label">Average pace</p><p class="stat-value">{{ pace() | number: '1.0-1' }} <span>days / exam</span></p></article>
      <article class="stat-card"><p class="stat-label">Estimated finish</p><p class="stat-value">{{ projectedDate() | date: 'MMM yyyy' }}</p></article>
    </section>

    <section class="panel-card">
      <div class="panel-header"><div><p class="eyebrow">Progress chart</p><h2>Days from start vs completed exams</h2></div></div>
      <div class="chart-surface">
        <svg class="chart-svg" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-label="Academic progress chart">
          @for (level of yAxisLevels; track level) {
            <line x1="60" [attr.y1]="getY(level)" x2="960" [attr.y2]="getY(level)" class="grid-line"></line>
          }
          @for (year of xAxisYears(); track year.days) {
            <line [attr.x1]="getX(year.days)" y1="40" [attr.x2]="getX(year.days)" y2="440" class="grid-line"></line>
          }
          <line x1="60" y1="440" x2="960" y2="440" class="axis-line"></line>
          <line x1="60" y1="40" x2="60" y2="440" class="axis-line"></line>
          <path [attr.d]="projectionPath()" class="projection-line"></path>
          <path [attr.d]="recentProjectionPath()" class="projection-line projection-line-recent"></path>
          <path [attr.d]="actualPath()" class="actual-line"></path>
          @for (point of mappedPoints(); track point.record.date.getTime()) {
            <circle [attr.cx]="point.x" [attr.cy]="point.y" r="6" class="chart-point" (mouseenter)="hoverPoint(point, $event)" (mouseleave)="hoverPoint(null, null)"></circle>
          }
        </svg>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-header"><div><p class="eyebrow">Editable dataset</p><h2>JSON source</h2></div></div>
      <textarea #jsonTextarea class="json-editor" [value]="jsonContent()"></textarea>
      <div class="editor-toolbar">
        <button type="button" class="primary-button" (click)="applyJson(jsonTextarea.value)">Update chart</button>
        <div class="editor-feedback">
          @if (jsonError()) {<span class="feedback-error">{{ jsonError() }}</span>}
          @if (jsonSuccess()) {<span class="feedback-success">Chart data updated.</span>}
        </div>
      </div>
    </section>
  </section>
</main>
  `,
  styles: [`
:host { display: block; min-height: 100vh; color: #e5eef9; }
.page-shell { min-height: 100vh; padding: 32px 18px 56px; background: radial-gradient(circle at top left, rgba(0,195,255,.15), transparent 30%), radial-gradient(circle at top right, rgba(255,149,0,.12), transparent 28%), linear-gradient(180deg, #06131d 0%, #091b28 40%, #051018 100%); }
.page-content { width: min(1180px, 100%); margin: 0 auto; display: grid; gap: 24px; }
.hero-card,.stat-card,.panel-card { background: rgba(8,22,33,.84); border: 1px solid rgba(134,181,212,.18); box-shadow: 0 18px 60px rgba(0,0,0,.22); backdrop-filter: blur(18px); }
.hero-card { border-radius: 28px; padding: 28px; display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.eyebrow { margin: 0 0 10px; font-size: .76rem; text-transform: uppercase; letter-spacing: .18em; color: #76d0ff; }
h1,h2,p { margin: 0; }
h1 { font-size: clamp(2.2rem, 4vw, 3.6rem); line-height: .95; letter-spacing: -.05em; }
h2 { font-size: clamp(1.35rem, 2vw, 1.8rem); }
.subtitle { margin-top: 10px; color: #acc2d3; max-width: 60ch; }
.hero-badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.badge { display: inline-flex; align-items: center; padding: 10px 14px; border-radius: 999px; background: rgba(118,208,255,.09); border: 1px solid rgba(118,208,255,.18); color: #d6f5ff; font-size: .88rem; }
.badge-highlight { background: rgba(255,166,0,.11); border-color: rgba(255,166,0,.24); color: #ffe0a3; }
.stats-grid { display: grid; gap: 18px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.stat-card { border-radius: 24px; padding: 22px; }
.stat-label { color: #8ea8bc; font-size: .86rem; }
.stat-value { margin-top: 12px; font-size: 2.35rem; font-weight: 700; }
.stat-value span { color: #7f97aa; font-size: 1.1rem; font-weight: 500; }
.panel-card { border-radius: 28px; padding: 28px; }
.panel-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 22px; }
.chart-surface { position: relative; width: 100%; min-height: 430px; overflow: visible; }
.chart-svg { width: 100%; min-height: 430px; }
.grid-line { stroke: rgba(187,218,242,.14); stroke-width: 1; stroke-dasharray: 4 6; }
.axis-line { stroke: rgba(183,212,234,.5); stroke-width: 2; }
.projection-line,.actual-line { fill: none; }
.projection-line { stroke: #7b8f9f; stroke-width: 2; stroke-dasharray: 8 7; }
.projection-line-recent { stroke: #34d2ff; stroke-width: 3; }
.actual-line { stroke: #3f8cff; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.chart-point { fill: #081621; stroke: #3f8cff; stroke-width: 3; }
.json-editor { width: 100%; min-height: 340px; resize: vertical; border: 1px solid rgba(126,175,207,.22); border-radius: 20px; padding: 18px; background: #04111a; color: #dcebf7; font-family: monospace; font-size: .92rem; line-height: 1.6; }
.editor-toolbar { margin-top: 18px; display: flex; justify-content: space-between; gap: 14px; align-items: center; }
.primary-button { border: 0; border-radius: 999px; padding: 12px 20px; background: linear-gradient(90deg, #1d99ff 0%, #1fc6ff 100%); color: #04111a; font-weight: 700; cursor: pointer; }
.feedback-error,.feedback-success { display: inline-flex; align-items: center; min-height: 42px; padding: 0 14px; border-radius: 999px; font-size: .9rem; }
.feedback-error { background: rgba(255,107,107,.12); color: #ff9e9e; }
.feedback-success { background: rgba(52,208,140,.12); color: #93f0c7; }
@media (max-width: 1080px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 780px) { .hero-card,.panel-header,.editor-toolbar { flex-direction: column; } .hero-badges { justify-content: flex-start; } .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class App {
  public readonly projectTitle = 'MagnetarSophia';
  public readonly degreeTitle = 'B.Sc. Software Development';
  public readonly totalExamTarget = 36;
  public readonly totalEctsTarget = 180;
  public readonly startDate = new Date(2023, 4, 24);
  public readonly svgWidth = 1000;
  public readonly svgHeight = 500;
  public readonly margin: ChartMargin = { top: 40, right: 40, bottom: 60, left: 60 };
  public readonly innerWidth = this.svgWidth - this.margin.left - this.margin.right;
  public readonly innerHeight = this.svgHeight - this.margin.top - this.margin.bottom;
  public readonly yAxisLevels = [0, 6, 12, 18, 24, 30, 36];
  protected readonly academicProgressService = inject(AcademicProgressService);
  public readonly rawRecords = signal<ExamRecord[]>(this.academicProgressService.getDefaultRecords());
  public readonly jsonContent = signal<string>(this.academicProgressService.buildJson(this.rawRecords()));
  public readonly jsonError = signal<string>('');
  public readonly jsonSuccess = signal<boolean>(false);
  public readonly hoveredData = signal<ChartPoint | null>(null);
  public readonly tooltipPos = signal<TooltipPosition>({ x: 0, y: 0 });
  public readonly processedRecords = computed<ProcessedExamRecord[]>(() => this.academicProgressService.processRecords(this.startDate, this.rawRecords()));
  public readonly currentExams = computed<number>(() => this.academicProgressService.calculateCurrentExams(this.processedRecords()));
  public readonly earnedEcts = computed<number>(() => this.academicProgressService.calculateEarnedEcts(this.processedRecords()));
  public readonly pace = computed<number>(() => this.academicProgressService.calculatePace(this.processedRecords()));
  public readonly recentPace = computed<number>(() => this.academicProgressService.calculateRecentPace(this.processedRecords()));
  public readonly projectedDays = computed<number>(() => this.academicProgressService.calculateProjectedDays(this.totalExamTarget, this.pace()));
  public readonly recentProjectedDays = computed<number>(() => this.academicProgressService.calculateRecentProjectedDays(this.processedRecords(), this.totalExamTarget, this.recentPace()));
  public readonly projectedDate = computed<Date>(() => this.academicProgressService.calculateProjectedDate(this.startDate, this.projectedDays()));
  public readonly recentProjectedDate = computed<Date>(() => this.academicProgressService.calculateProjectedDate(this.startDate, this.recentProjectedDays()));
  public readonly dynamicMaxDays = computed<number>(() => this.academicProgressService.calculateDynamicMaxDays(2190, this.projectedDays(), this.recentProjectedDays()));
  public readonly xAxisYears = computed<AxisYear[]>(() => this.academicProgressService.buildAxisYears(this.dynamicMaxDays()));
  public readonly mappedPoints = computed<ChartPoint[]>(() => this.academicProgressService.mapPoints(this.processedRecords(), this.dynamicMaxDays(), this.totalExamTarget, this.margin, this.innerWidth, this.innerHeight));
  public readonly actualPath = computed<string>(() => this.academicProgressService.buildActualPath(this.mappedPoints(), this.getX(0), this.getY(0)));
  public readonly projectionPath = computed<string>(() => this.academicProgressService.buildProjectionPath(this.getX(0), this.getY(0), this.getX(this.projectedDays()), this.getY(this.totalExamTarget)));
  public readonly recentProjectionPath = computed<string>(() => {
    const points = this.mappedPoints();
    if (points.length === 0) return '';
    const lastPoint = points[points.length - 1];
    return this.academicProgressService.buildProjectionPath(lastPoint.x, lastPoint.y, this.getX(this.recentProjectedDays()), this.getY(this.totalExamTarget));
  });
  public readonly currentYear = new Date().getFullYear();

  public getX(days: number): number { return this.margin.left + (days / this.dynamicMaxDays()) * this.innerWidth; }
  public getY(examCount: number): number { return this.margin.top + this.innerHeight - (examCount / this.totalExamTarget) * this.innerHeight; }
  public hoverPoint(point: ChartPoint | null, event: MouseEvent | null): void { this.hoveredData.set(point); if (!event) return; const pos = this.academicProgressService.getTooltipPosition(event); if (pos) this.tooltipPos.set(pos); }
  public applyJson(json: string): void { try { const parsedRecords = this.academicProgressService.parseJson(json); this.jsonError.set(''); this.jsonSuccess.set(true); this.rawRecords.set(parsedRecords); this.jsonContent.set(this.academicProgressService.buildJson(parsedRecords)); setTimeout(() => this.jsonSuccess.set(false), 3000); } catch { this.jsonSuccess.set(false); this.jsonError.set('JSON parsing failed. Review the date and comma structure.'); } }
}
