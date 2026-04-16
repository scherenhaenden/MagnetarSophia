import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AcademicProgressService } from './services/academic-progress.service';
import { TranslationService } from './services/translation.service';
import { AxisYear, ChartMargin, ChartPoint, ExampleData, ExamRecord, LanguageOption, ProcessedExamRecord, TooltipPosition, TranslationDictionary } from './models/academic-progress.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
<main class="page-shell" [attr.dir]="isRightToLeft() ? 'rtl' : 'ltr'">
  <section class="page-content">
    <header class="hero-card">
      <div>
        <p class="eyebrow">{{ t('hero.workspace') }}</p>
        <h1>{{ appTitle() }}</h1>
        <p class="subtitle">{{ subtitle() }} · {{ degreeTitle() }} - {{ universityName() }}</p>
      </div>
      <div class="hero-side">
        <label class="language-switcher">
          <span>{{ t('language.label') }}</span>
          <select [value]="languageCode()" (change)="switchLanguage($any($event.target).value)">
            @for (language of supportedLanguages; track language.code) {
              <option [value]="language.code">{{ language.label }}</option>
            }
          </select>
        </label>
        <div class="hero-badges">
          <span class="badge">{{ t('hero.start') }}: {{ formatDate(startDate()) }}</span>
          <span class="badge badge-highlight">{{ t('hero.target') }}: {{ totalEctsTarget() }} ECTS ({{ totalExamTarget() }} {{ t('units.exams') }})</span>
        </div>
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">{{ t('stats.completedExams') }}</p>
        <p class="stat-value">{{ currentExams() }} <span>/ {{ totalExamTarget() }}</span></p>
        <div class="progress-bar"><div class="progress-fill progress-fill-blue" [style.width.%]="(currentExams() / totalExamTarget()) * 100"></div></div>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('stats.ectsCredits') }}</p>
        <p class="stat-value">{{ earnedEcts() }} <span>/ {{ totalEctsTarget() }}</span></p>
        <div class="progress-bar"><div class="progress-fill progress-fill-indigo" [style.width.%]="(earnedEcts() / totalEctsTarget()) * 100"></div></div>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('stats.pace') }}</p>
        <div class="dual-metric">
          <div>
            <p class="mini-label">{{ t('stats.historical') }}</p>
            <p class="metric-primary">{{ formatNumber(pace(), 1, 1) }}</p>
            <p class="metric-footnote">~{{ formatNumber(pace() > 0 ? 365 / pace() : 0, 1, 1) }} {{ t('stats.examsPerYear') }}</p>
          </div>
          <div class="metric-accent">
            <p class="mini-label">{{ t('stats.recentTrend') }}</p>
            <p class="metric-primary">{{ formatNumber(recentPace(), 1, 1) }}</p>
            <p class="metric-footnote">~{{ formatNumber(recentPace() > 0 ? 365 / recentPace() : 0, 1, 1) }} {{ t('stats.examsPerYear') }}</p>
          </div>
        </div>
        <div class="trend-bar"><div class="trend-fill"></div></div>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('stats.estimatedFinish') }}</p>
        <div class="dual-metric">
          <div>
            <p class="mini-label">{{ t('stats.globalAverage') }}</p>
            <p class="metric-primary metric-sm">{{ formatMonthYear(projectedDate()) }}</p>
          </div>
          <div class="metric-accent">
            <p class="mini-label">{{ t('stats.recentTrend') }}</p>
            <p class="metric-primary metric-sm">{{ formatMonthYear(recentProjectedDate()) }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="panel-card chart-card">
      <div class="panel-header">
        <div>
          <p class="eyebrow">{{ t('chart.progressCurve') }}</p>
          <h2>{{ t('chart.daysVsCompletedExams') }}</h2>
        </div>
        <div class="legend-list">
          <span><i class="legend-dot legend-blue"></i> {{ t('chart.realProgress') }}</span>
          <span><i class="legend-dot legend-cyan legend-outline"></i> {{ t('chart.recentTrend') }}</span>
          <span><i class="legend-dot legend-slate legend-outline"></i> {{ t('chart.historicalTrend') }}</span>
          <span><i class="legend-dot legend-green"></i> {{ t('chart.idealThreeYears') }}</span>
          <span><i class="legend-dot legend-amber"></i> {{ t('chart.idealFourYears') }}</span>
          <span><i class="legend-dot legend-orange"></i> {{ t('chart.idealSixYears') }}</span>
        </div>
      </div>

      <div class="chart-surface">
        <svg class="chart-svg" viewBox="0 0 1000 500" preserveAspectRatio="none" [attr.aria-label]="t('chart.ariaLabel')">
          @for (level of yAxisLevels; track level) {
            <line x1="60" [attr.y1]="getY(level)" x2="960" [attr.y2]="getY(level)" class="grid-line"></line>
            <text x="48" [attr.y]="getY(level) + 4" text-anchor="end" class="axis-label">{{ level }}</text>
          }
          @for (year of xAxisYears(); track year.days) {
            <line [attr.x1]="getX(year.days)" y1="40" [attr.x2]="getX(year.days)" y2="440" class="grid-line grid-line-vertical"></line>
            <text [attr.x]="getX(year.days)" y="465" text-anchor="middle" class="axis-label">{{ year.label }}</text>
          }

          <line x1="60" y1="440" x2="960" y2="440" class="axis-line"></line>
          <line x1="60" y1="40" x2="60" y2="440" class="axis-line"></line>

          <path [attr.d]="buildIdealPath(1095)" class="target-line target-line-three"></path>
          <path [attr.d]="buildIdealPath(1460)" class="target-line target-line-four"></path>
          <path [attr.d]="buildIdealPath(2190)" class="target-line target-line-six"></path>

          <path [attr.d]="projectionPath()" class="projection-line"></path>
          <path [attr.d]="recentProjectionPath()" class="projection-line projection-line-recent"></path>
          <path [attr.d]="actualPath()" class="actual-line"></path>

          @for (point of mappedPoints(); track point.record.date.getTime()) {
            <circle [attr.cx]="point.x" [attr.cy]="point.y" r="6" class="chart-point" (mouseenter)="hoverPoint(point, $event)" (mouseleave)="hoverPoint(null, null)"></circle>
          }

          <circle [attr.cx]="getX(projectedDays())" [attr.cy]="getY(totalExamTarget())" r="5" class="chart-endpoint chart-endpoint-historical"></circle>
          <circle [attr.cx]="getX(recentProjectedDays())" [attr.cy]="getY(totalExamTarget())" r="6" class="chart-endpoint chart-endpoint-recent"></circle>
        </svg>

        @if (hoveredData()) {
          <aside class="chart-tooltip" [style.left.px]="tooltipPos().x" [style.top.px]="tooltipPos().y">
            <p class="tooltip-title">{{ hoveredData()?.record?.name }}</p>
            <dl class="tooltip-grid">
              <div>
                <dt>{{ t('chart.date') }}</dt>
                <dd>{{ formatTooltipDate(hoveredData()?.record?.date ?? startDate()) }}</dd>
              </div>
              <div>
                <dt>{{ t('chart.exam') }}</dt>
                <dd>{{ hoveredData()?.record?.examsCount }} / {{ totalExamTarget() }}</dd>
              </div>
              <div>
                <dt>ECTS</dt>
                <dd>{{ hoveredData()?.record?.ects }}</dd>
              </div>
              <div>
                <dt>{{ t('chart.grade') }}</dt>
                <dd>{{ hoveredData()?.record?.grade }}</dd>
              </div>
            </dl>
          </aside>
        }
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <p class="eyebrow">{{ t('editor.editableDataset') }}</p>
          <h2>{{ t('editor.jsonSource') }}</h2>
        </div>
        <p class="panel-note">{{ t('editor.note') }}</p>
      </div>

      <div class="info-card">{{ t('editor.info') }}</div>
      <textarea #jsonTextarea class="json-editor" [value]="jsonContent()"></textarea>
      <div class="editor-toolbar">
        <button type="button" class="primary-button" (click)="applyJson(jsonTextarea.value)">{{ t('editor.updateChart') }}</button>
        <div class="editor-feedback">
          @if (jsonError()) {<span class="feedback-error">{{ jsonError() }}</span>}
          @if (jsonSuccess()) {<span class="feedback-success">{{ t('editor.success') }}</span>}
        </div>
      </div>
    </section>
  </section>
</main>
  `,
  styles: [`
:host {
  display: block;
  min-height: 100vh;
  color: #e5eef9;
}
.page-shell {
  min-height: 100vh;
  padding: 32px 18px 56px;
  background:
    radial-gradient(circle at top left, rgba(0, 195, 255, 0.15), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 149, 0, 0.12), transparent 28%),
    linear-gradient(180deg, #06131d 0%, #091b28 40%, #051018 100%);
}
.page-content {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 24px;
}
.hero-card,
.stat-card,
.panel-card {
  background: rgba(8, 22, 33, 0.84);
  border: 1px solid rgba(134, 181, 212, 0.18);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(18px);
}
.hero-card {
  border-radius: 28px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}
.hero-side {
  display: grid;
  gap: 16px;
  justify-items: end;
}
.language-switcher {
  display: grid;
  gap: 8px;
  color: #acc2d3;
  font-size: 0.84rem;
}
.language-switcher span {
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.language-switcher select {
  min-width: 190px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(126, 175, 207, 0.22);
  background: rgba(4, 17, 26, 0.92);
  color: #e5eef9;
}
.eyebrow {
  margin: 0 0 10px;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #76d0ff;
}
h1,
h2,
p {
  margin: 0;
}
h1 {
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}
h2 {
  font-size: clamp(1.35rem, 2vw, 1.8rem);
}
.subtitle,
.panel-note {
  margin-top: 10px;
  color: #acc2d3;
  max-width: 60ch;
}
.hero-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(118, 208, 255, 0.09);
  border: 1px solid rgba(118, 208, 255, 0.18);
  color: #d6f5ff;
  font-size: 0.88rem;
}
.badge-highlight {
  background: rgba(255, 166, 0, 0.11);
  border-color: rgba(255, 166, 0, 0.24);
  color: #ffe0a3;
}
.stats-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.stat-card {
  border-radius: 24px;
  padding: 22px;
}
.stat-label,
.mini-label {
  color: #8ea8bc;
  font-size: 0.86rem;
}
.stat-value {
  margin-top: 12px;
  font-size: 2.35rem;
  font-weight: 700;
}
.stat-value span {
  color: #7f97aa;
  font-size: 1.1rem;
  font-weight: 500;
}
.progress-bar,
.trend-bar {
  margin-top: 18px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.progress-fill,
.trend-fill {
  height: 100%;
  border-radius: inherit;
}
.progress-fill-blue {
  background: linear-gradient(90deg, #2c83ff 0%, #6ea8ff 100%);
}
.progress-fill-indigo {
  background: linear-gradient(90deg, #6f61ff 0%, #8dc5ff 100%);
}
.trend-fill {
  width: 100%;
  background: linear-gradient(90deg, #6b7f92 0%, #34d2ff 100%);
}
.dual-metric {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.metric-primary {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
}
.metric-sm {
  font-size: 1.3rem;
}
.metric-footnote {
  margin-top: 4px;
  color: #7f97aa;
  font-size: 0.8rem;
}
.metric-accent .mini-label,
.metric-accent .metric-primary {
  color: #7de4ff;
}
.panel-card {
  border-radius: 28px;
  padding: 28px;
}
.chart-card {
  position: relative;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 22px;
}
.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #9db5c6;
  font-size: 0.88rem;
}
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 999px;
}
.legend-outline {
  background: transparent;
  border: 2px dashed currentColor;
}
.legend-blue {
  color: #3f8cff;
  background: #3f8cff;
}
.legend-cyan {
  color: #34d2ff;
}
.legend-slate {
  color: #8497a7;
}
.legend-green {
  color: rgba(47, 208, 144, 0.5);
  background: rgba(47, 208, 144, 0.35);
}
.legend-amber {
  color: rgba(240, 192, 95, 0.5);
  background: rgba(240, 192, 95, 0.35);
}
.legend-orange {
  color: rgba(243, 138, 74, 0.5);
  background: rgba(243, 138, 74, 0.35);
}
.chart-surface {
  position: relative;
  width: 100%;
  min-height: 430px;
  overflow: visible;
}
.chart-svg {
  width: 100%;
  min-height: 430px;
}
.grid-line {
  stroke: rgba(187, 218, 242, 0.14);
  stroke-width: 1;
  stroke-dasharray: 4 6;
}
.grid-line-vertical {
  stroke-dasharray: 2 0;
}
.axis-line {
  stroke: rgba(183, 212, 234, 0.5);
  stroke-width: 2;
}
.axis-label {
  fill: #8ea8bc;
  font-size: 12px;
}
.target-line,
.projection-line,
.actual-line {
  fill: none;
}
.target-line {
  stroke-width: 2;
  opacity: 0.35;
}
.target-line-three {
  stroke: #2fd090;
}
.target-line-four {
  stroke: #f0c05f;
}
.target-line-six {
  stroke: #f38a4a;
}
.projection-line {
  stroke: #7b8f9f;
  stroke-width: 2;
  stroke-dasharray: 8 7;
}
.projection-line-recent {
  stroke: #34d2ff;
  stroke-width: 3;
}
.actual-line {
  stroke: #3f8cff;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chart-point {
  fill: #081621;
  stroke: #3f8cff;
  stroke-width: 3;
  cursor: pointer;
  transition:
    r 0.2s ease,
    stroke 0.2s ease;
}
.chart-point:hover {
  stroke: #7de4ff;
  r: 8;
}
.chart-endpoint {
  fill: #081621;
  stroke-width: 3;
}
.chart-endpoint-historical {
  stroke: #8497a7;
}
.chart-endpoint-recent {
  stroke: #34d2ff;
}
.chart-tooltip {
  position: absolute;
  z-index: 4;
  min-width: 220px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(7, 18, 28, 0.95);
  border: 1px solid rgba(126, 175, 207, 0.22);
  transform: translate(-50%, -120%);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
.tooltip-title {
  color: #7de4ff;
  font-weight: 700;
  margin-bottom: 12px;
}
.tooltip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.tooltip-grid dt {
  color: #8ea8bc;
  font-size: 0.76rem;
}
.tooltip-grid dd {
  margin: 4px 0 0;
  font-weight: 600;
}
.info-card {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(102, 136, 168, 0.12);
  border: 1px solid rgba(126, 175, 207, 0.16);
  color: #acc2d3;
  font-size: 0.92rem;
}
.json-editor {
  width: 100%;
  min-height: 340px;
  resize: vertical;
  border: 1px solid rgba(126, 175, 207, 0.22);
  border-radius: 20px;
  padding: 18px;
  background: #04111a;
  color: #dcebf7;
  font-family: monospace;
  font-size: 0.92rem;
  line-height: 1.6;
}
.editor-toolbar {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}
.primary-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  background: linear-gradient(90deg, #1d99ff 0%, #1fc6ff 100%);
  color: #04111a;
  font-weight: 700;
  cursor: pointer;
}
.feedback-error,
.feedback-success {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.9rem;
}
.feedback-error {
  background: rgba(255, 107, 107, 0.12);
  color: #ff9e9e;
}
.feedback-success {
  background: rgba(52, 208, 140, 0.12);
  color: #93f0c7;
}
@media (max-width: 1080px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 780px) {
  .hero-card,
  .panel-header,
  .editor-toolbar,
  .dual-metric {
    flex-direction: column;
  }
  .hero-side {
    justify-items: start;
  }
  .hero-badges {
    justify-content: flex-start;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .chart-surface,
  .chart-svg {
    min-height: 360px;
  }
}
  `]
})
export class App implements OnInit {
  public readonly appTitle = signal<string>('MagnetarSophia');
  public readonly subtitle = signal<string>('Academic Progress Analysis');
  public readonly degreeTitle = signal<string>('B.Sc. Software Development');
  public readonly universityName = signal<string>('IU International University');
  public readonly totalExamTarget = signal<number>(36);
  public readonly totalEctsTarget = signal<number>(180);
  public readonly startDate = signal<Date>(new Date(2023, 4, 24));
  public readonly languageCode = signal<string>('en');
  public readonly translations = signal<TranslationDictionary>({ labels: {}, languageName: 'English' });
  public readonly svgWidth: number = 1000;
  public readonly svgHeight: number = 500;
  public readonly margin: ChartMargin = { top: 40, right: 40, bottom: 60, left: 60 };
  public readonly innerWidth: number = this.svgWidth - this.margin.left - this.margin.right;
  public readonly innerHeight: number = this.svgHeight - this.margin.top - this.margin.bottom;
  public readonly yAxisLevels: number[] = [0, 6, 12, 18, 24, 30, 36];
  protected readonly academicProgressService = inject(AcademicProgressService);
  protected readonly translationService = inject(TranslationService);
  public readonly supportedLanguages: LanguageOption[] = this.translationService.getSupportedLanguages();
  public readonly rawRecords = signal<ExamRecord[]>([]);
  public readonly jsonContent = signal<string>('[]');
  public readonly jsonError = signal<string>('');
  public readonly jsonSuccess = signal<boolean>(false);
  public readonly hoveredData = signal<ChartPoint | null>(null);
  public readonly tooltipPos = signal<TooltipPosition>({ x: 0, y: 0 });
  public readonly processedRecords = computed<ProcessedExamRecord[]>(() => this.academicProgressService.processRecords(this.startDate(), this.rawRecords()));
  public readonly currentExams = computed<number>(() => this.academicProgressService.calculateCurrentExams(this.processedRecords()));
  public readonly earnedEcts = computed<number>(() => this.academicProgressService.calculateEarnedEcts(this.processedRecords()));
  public readonly pace = computed<number>(() => this.academicProgressService.calculatePace(this.processedRecords()));
  public readonly recentPace = computed<number>(() => this.academicProgressService.calculateRecentPace(this.processedRecords()));
  public readonly projectedDays = computed<number>(() => this.academicProgressService.calculateProjectedDays(this.totalExamTarget(), this.pace()));
  public readonly recentProjectedDays = computed<number>(() => this.academicProgressService.calculateRecentProjectedDays(this.processedRecords(), this.totalExamTarget(), this.recentPace()));
  public readonly projectedDate = computed<Date>(() => this.academicProgressService.calculateProjectedDate(this.startDate(), this.projectedDays()));
  public readonly recentProjectedDate = computed<Date>(() => this.academicProgressService.calculateProjectedDate(this.startDate(), this.recentProjectedDays()));
  public readonly dynamicMaxDays = computed<number>(() => this.academicProgressService.calculateDynamicMaxDays(2190, this.projectedDays(), this.recentProjectedDays()));
  public readonly xAxisYears = computed<AxisYear[]>(() => this.academicProgressService.buildAxisYears(this.dynamicMaxDays(), (index: number) => this.t('chart.yearLabel', { index: String(index) })));
  public readonly mappedPoints = computed<ChartPoint[]>(() => this.academicProgressService.mapPoints(this.processedRecords(), this.dynamicMaxDays(), this.totalExamTarget(), this.margin, this.innerWidth, this.innerHeight));
  public readonly actualPath = computed<string>(() => this.academicProgressService.buildActualPath(this.mappedPoints(), this.getX(0), this.getY(0)));
  public readonly projectionPath = computed<string>(() => this.academicProgressService.buildProjectionPath(this.getX(0), this.getY(0), this.getX(this.projectedDays()), this.getY(this.totalExamTarget())));
  public readonly recentProjectionPath = computed<string>(() => {
    const points: ChartPoint[] = this.mappedPoints();
    if (points.length === 0) {
      return '';
    }

    const lastPoint: ChartPoint = points[points.length - 1];
    return this.academicProgressService.buildProjectionPath(lastPoint.x, lastPoint.y, this.getX(this.recentProjectedDays()), this.getY(this.totalExamTarget()));
  });

  public async ngOnInit(): Promise<void> {
    const initialLanguageCode: string = this.translationService.resolveLanguage([this.translationService.getStoredLanguage(), ...this.getBrowserLanguages()]);
    const [response, dictionary]: [Response, TranslationDictionary] = await Promise.all([
      fetch('/example.json'),
      this.translationService.loadLanguage(initialLanguageCode),
    ]);
    const data: ExampleData = await response.json();
    const parsed: { startDate: Date; records: ExamRecord[] } = this.academicProgressService.parseExampleData(data);

    this.setLanguageState(initialLanguageCode, dictionary);
    this.appTitle.set(data.appTitle);
    this.subtitle.set(data.subtitle);
    this.degreeTitle.set(data.degreeTitle);
    this.universityName.set(data.universityName);
    this.totalExamTarget.set(data.totalExamTarget);
    this.totalEctsTarget.set(data.totalEctsTarget);
    this.startDate.set(parsed.startDate);
    this.rawRecords.set(parsed.records);
    this.jsonContent.set(this.academicProgressService.buildJson(parsed.records));
  }

  public async switchLanguage(languageCode: string): Promise<void> {
    const resolvedLanguageCode: string = this.translationService.resolveLanguage([languageCode]);
    const dictionary: TranslationDictionary = await this.translationService.loadLanguage(resolvedLanguageCode);
    this.setLanguageState(resolvedLanguageCode, dictionary);
  }

  public t(key: string, params: Record<string, string> = {}): string {
    return this.translationService.translate(this.translations(), key, params);
  }

  public isRightToLeft(): boolean {
    return this.translationService.isRightToLeft(this.languageCode());
  }

  public formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.languageCode(), { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  public formatMonthYear(date: Date): string {
    return new Intl.DateTimeFormat(this.languageCode(), { month: 'short', year: 'numeric' }).format(date);
  }

  public formatTooltipDate(date: Date): string {
    return new Intl.DateTimeFormat(this.languageCode(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  public formatNumber(value: number, minimumFractionDigits: number, maximumFractionDigits: number): string {
    return new Intl.NumberFormat(this.languageCode(), { minimumFractionDigits, maximumFractionDigits }).format(value);
  }

  public getX(days: number): number {
    return this.margin.left + (days / this.dynamicMaxDays()) * this.innerWidth;
  }

  public getY(examCount: number): number {
    return this.margin.top + this.innerHeight - (examCount / this.totalExamTarget()) * this.innerHeight;
  }

  public buildIdealPath(dayCount: number): string {
    return this.academicProgressService.buildProjectionPath(this.getX(0), this.getY(0), this.getX(dayCount), this.getY(this.totalExamTarget()));
  }

  public hoverPoint(point: ChartPoint | null, event: MouseEvent | null): void {
    this.hoveredData.set(point);
    if (!event) {
      return;
    }

    const tooltipPosition: TooltipPosition | null = this.academicProgressService.getTooltipPosition(event);
    if (tooltipPosition) {
      this.tooltipPos.set(tooltipPosition);
    }
  }

  public applyJson(json: string): void {
    try {
      const parsedRecords: ExamRecord[] = this.academicProgressService.parseJson(json);
      this.jsonError.set('');
      this.jsonSuccess.set(true);
      this.rawRecords.set(parsedRecords);
      this.jsonContent.set(this.academicProgressService.buildJson(parsedRecords));
      setTimeout((): void => this.jsonSuccess.set(false), 3000);
    } catch {
      this.jsonSuccess.set(false);
      this.jsonError.set(this.t('editor.error'));
    }
  }

  public getBrowserLanguages(): string[] {
    if (typeof navigator === 'undefined') {
      return [];
    }

    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      return navigator.languages;
    }

    return navigator.language ? [navigator.language] : [];
  }

  private setLanguageState(languageCode: string, dictionary: TranslationDictionary): void {
    this.languageCode.set(languageCode);
    this.translations.set(dictionary);
    this.translationService.setStoredLanguage(languageCode);
    if (this.jsonError()) {
      this.jsonError.set(this.t('editor.error'));
    }
  }
}
