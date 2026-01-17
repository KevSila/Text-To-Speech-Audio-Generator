
export enum VoiceName {
  // Gemini Native Voices
  CHARON = 'Charon',
  PUCK = 'Puck',
  KORE = 'Kore',
  ZEPHYR = 'Zephyr',
  FENRIR = 'Fenrir',
  // ElevenLabs Premium (Placeholders for UI)
  ADAM = 'Adam (Deep)',
  BELLA = 'Bella (Soft)',
  RACHEL = 'Rachel (Professional)',
  JOSH = 'Josh (Narrative)',
  // NotebookLM
  NOTEBOOK_V1 = 'NotebookLM v1'
}

export enum Platform {
  GEMINI = 'GEMINI_STANDARD',
  ELEVEN_LABS = 'ELEVEN_LABS_PREMIUM',
  NOTEBOOK_LM = 'NOTEBOOK_LM_VAULT'
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
  metadata?: {
    bookTitle: string;
    chapterTitle: string;
    part: string;
  };
}

export interface AudiobookSettings {
  voice: VoiceName;
  speed: number;
  paragraphPause: number;
  platform: Platform;
}

export const PLATFORM_VOICES: Record<Platform, VoiceName[]> = {
  [Platform.GEMINI]: [VoiceName.ZEPHYR, VoiceName.CHARON, VoiceName.KORE, VoiceName.FENRIR, VoiceName.PUCK],
  [Platform.ELEVEN_LABS]: [VoiceName.ADAM, VoiceName.BELLA, VoiceName.RACHEL, VoiceName.JOSH],
  [Platform.NOTEBOOK_LM]: [VoiceName.NOTEBOOK_V1]
};

export const BOOK_PROFILES: BookProfile[] = [
  {
    id: 'solitude',
    title: 'Solitude In The Digital Age',
    themeColor: '#8c7851',
    accentColor: '#F5F5F3',
    defaultVoice: VoiceName.ZEPHYR,
    narrationStyle: 'Calm, professional, and reflective. Slightly slow pacing with clear enunciation.'
  },
  {
    id: 'firelit',
    title: 'Firelit Wisdom',
    themeColor: '#c2410c',
    accentColor: '#F5F5F3',
    defaultVoice: VoiceName.CHARON,
    narrationStyle: 'Warm, elder-like, and ancestral. A storytelling cadence that feels like wisdom shared around a fire at night.'
  },
  {
    id: 'generic',
    title: 'Custom Project',
    themeColor: '#4b5563',
    accentColor: '#F5F5F3',
    defaultVoice: VoiceName.KORE,
    narrationStyle: 'Neutral, standard narration style suitable for any general text or script.'
  }
];
