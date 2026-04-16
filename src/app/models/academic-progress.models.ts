export interface JsonExamRecord {
  date: string;
  name: string;
  examsCount: number;
  ects: number;
  grade: string;
}

export interface ExampleData {
  appTitle: string;
  subtitle: string;
  degreeTitle: string;
  universityName: string;
  startDate: string;
  totalExamTarget: number;
  totalEctsTarget: number;
  records: JsonExamRecord[];
}

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

export interface LanguageOption {
  code: string;
  label: string;
}

export interface TranslationDictionary {
  labels: Record<string, string>;
  languageName: string;
}
