
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

export class TTSService {
  private ai: any;
  private audioContext: AudioContext | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Initializes or resumes the AudioContext. 
   * CRITICAL: Must be called inside a user-triggered event handler (onClick).
   */
  async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Resume context if suspended (browser policy)
    if (this.audioContext.state !== 'running') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("AudioContext resume failed, might be blocked by browser policy:", e);
      }
    }
    
    return this.audioContext;
  }

  async previewVoice(voice: VoiceName): Promise<AudioBuffer> {
    // Resume context immediately at the start of the user gesture chain
    const ctx = await this.ensureAudioContext();
    
    const previewTexts: Record<string, string> = {
      [VoiceName.CHARON]: "Greetings. I am Charon. My voice carries the weight of time.",
      [VoiceName.ZEPHYR]: "Hello. I am Zephyr. I provide professional narration for Solitude.",
      [VoiceName.KORE]: "I am Kore. Precise and modern, ideal for structural manuscripts.",
      [VoiceName.FENRIR]: "I am Fenrir. Deep and steady for authoritative storytelling.",
      [VoiceName.PUCK]: "Hi! I'm Puck. Light and engaging for energetic scripts.",
      [VoiceName.ADAM]: "Adam here. Rich and narrative (ElevenLabs Profile).",
      [VoiceName.BELLA]: "Bella here. Soft and emotional (ElevenLabs Profile).",
      [VoiceName.RACHEL]: "Rachel here. Professional and crisp (ElevenLabs Profile).",
      [VoiceName.JOSH]: "Josh here. Deeply narrative (ElevenLabs Profile).",
      [VoiceName.NOTEBOOK_V1]: "NotebookLM voice ready for summary analysis."
    };

    const targetVoice = this.mapToNativeVoice(voice);
    const text = previewTexts[voice] || "Vocal sample ready.";
    const prompt = `Act as a professional narrator. Read clearly: "${text}"`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: targetVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No preview audio returned from API.");

    return await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
  }

  private mapToNativeVoice(voice: VoiceName): string {
    const native = [VoiceName.CHARON, VoiceName.ZEPHYR, VoiceName.KORE, VoiceName.FENRIR, VoiceName.PUCK];
    if (native.includes(voice)) return voice;
    if (voice === VoiceName.ADAM || voice === VoiceName.JOSH) return VoiceName.FENRIR;
    if (voice === VoiceName.BELLA || voice === VoiceName.RACHEL) return VoiceName.KORE;
    return VoiceName.ZEPHYR;
  }

  async synthesize(text: string, voice: VoiceName, speed: number, styleDescription: string): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();
    const targetVoice = this.mapToNativeVoice(voice);
    const speedStr = speed.toFixed(2);
    
    const prompt = `Act as a world-class professional audiobook narrator. 
    Vocal Persona: ${styleDescription}
    Reading Speed: ${speedStr}x.

    STRUCTURAL PERFORMANCE CUES (IMPORTANT):
    - '#' (BOOK TITLE): Maximum resonance, authoritative focus. 3s pause after.
    - '##' (SUBTITLE): Grounded, steady emphasis. 2.5s pause after.
    - '###' (CHAPTER TITLE/SECTION): Clear energetic shift. 2s pause after.
    - '####' (SUB-SECTION): Precise and narrative. 1.5s pause after.
    - '>' (REFLECTIVE PROMPT): Slower, ethereal, questioning tone. 3s pause after.
    - '[WISDOM CARD]': Warm, revered, storytelling cadence. 2s pause after.
    - '•', '*', '-' (BULLET POINTS): Rhythmic list cadence. 1.2s gap between.
    
    PERFORMANCE RULE: Use these markers to adjust your voice, but NEVER speak the symbols themselves.
    
    MANUSCRIPT: 
    ${text}`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: targetVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Synthesis failed. No audio data.");

    return await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
  }

  getAudioContext() {
    return this.audioContext;
  }
}
