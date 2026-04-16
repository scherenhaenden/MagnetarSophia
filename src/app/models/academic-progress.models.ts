export interface ExamRecord {
  date: Date;
  name: string;
  examsCount: number;
  ects: number;
  grade: string;
}

export interface ProcessedExamRecord extends ExamRecord {
  daysFromStart: number;
}

export interface ChartPoint {
  x: number;
  y: number;
  record: ProcessedExamRecord;
}

export interface AxisYear {
  days: number;
  label: string;
}

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TooltipPosition {
  x: number;
  y: number;
}
