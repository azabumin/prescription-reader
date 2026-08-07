export type Lang = 'ko' | 'ja';

export type MedicationItem = {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  precaution: string;
};

export type AnalysisResult = {
  medicationName: string;
  items: MedicationItem[];
  generalNotes: string;
};
