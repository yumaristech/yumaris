
export interface Surah {
  number: number;
  name: string;
  arabic: string;
  meaning: string;
  verses: number;
  type: string;
  juz: number;
}

export interface Ayah {
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah?: {
    number: number;
    name: string;
    englishName: string;
  };
}

export type DisplayMode = 'full' | 'first' | 'hidden';

export type ScreenState = 'login' | 'welcome' | 'surah-list' | 'reader' | 'admin' | 'progress' | 'teacher';
