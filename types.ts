
export enum VoiceName {
  CHARON = 'Charon',
  PUCK = 'Puck',
  KORE = 'Kore',
  ZEPHYR = 'Zephyr',
  FENRIR = 'Fenrir'
}

export interface BookProfile {
  id: string;
  title: string;
  themeColor: string;
  accentColor: string;
  defaultVoice: VoiceName;
  narrationStyle: string;
}

export interface AudiobookChunk {
  id: string;
  text: string;
  timestamp: number;
  audioBuffer?: AudioBuffer;
  duration: number;
}

export interface AudiobookSettings {
  voice: VoiceName;
  speed: number;
  paragraphPause: number;
}

export const BOOK_PROFILES: BookProfile[] = [
  {
    id: 'solitude',
    title: 'Solitude In The Digital Age',
    themeColor: '#8c7851',
    accentColor: '#f1efe9',
    defaultVoice: VoiceName.ZEPHYR,
    narrationStyle: 'Calm, professional, and reflective. Slightly slow pacing with clear enunciation.'
  },
  {
    id: 'firelit',
    title: 'Firelit Wisdom',
    themeColor: '#c2410c',
    accentColor: '#fff7ed',
    defaultVoice: VoiceName.CHARON,
    narrationStyle: 'Warm, elder-like, and ancestral. A storytelling cadence that feels like wisdom shared around a fire at night.'
  }
];
