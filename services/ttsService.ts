
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

export class TTSService {
  private ai: any;
  private audioContext: AudioContext | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (this.audioContext.state !== 'running') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("AudioContext resume failed:", e);
      }
    }
    return this.audioContext;
  }

  async previewVoice(voice: VoiceName): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();
    
    const previewTexts: Record<string, string> = {
      [VoiceName.CHARON]: "Greetings. I am Charon. My voice carries the weight of time.",
      [VoiceName.ZEPHYR]: "Hello. I am Zephyr. I provide professional narration for Solitude.",
      [VoiceName.KORE]: "I am Kore. Precise and modern, ideal for structural manuscripts.",
      [VoiceName.FENRIR]: "I am Fenrir. Deep and steady for authoritative storytelling.",
      [VoiceName.PUCK]: "Hi! I'm Puck. Light and engaging for energetic scripts.",
      [VoiceName.ADAM]: "Adam here. Rich and narrative, built for long-form books.",
      [VoiceName.BELLA]: "Bella here. Soft and emotional for deeper connections.",
      [VoiceName.RACHEL]: "Rachel here. Professional, crisp, and executive.",
      [VoiceName.JOSH]: "Josh here. Deeply narrative and dynamic.",
      [VoiceName.SARAH]: "Sarah here. Warmth and professionalism combined.",
      [VoiceName.ANTONI]: "Antoni here. A classic authorial tone.",
      [VoiceName.NICOLE]: "Nicole here. Gentle, whispery, and deeply reflective.",
      [VoiceName.BILL]: "Bill here. The voice of authority and age.",
      [VoiceName.NOTEBOOK_V1]: "Analytical system ready for data extraction.",
      [VoiceName.NOTEBOOK_V2]: "Structural processing engaged for complex vaults.",
      [VoiceName.NOTEBOOK_V3]: "Conversational logic active for podcast output."
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
    if (!base64Audio) throw new Error("No preview audio returned.");

    return await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
  }

  private mapToNativeVoice(voice: VoiceName): string {
    const native = [VoiceName.CHARON, VoiceName.ZEPHYR, VoiceName.KORE, VoiceName.FENRIR, VoiceName.PUCK];
    if (native.includes(voice)) return voice;

    // Map ElevenLabs profiles to Gemini equivalents
    const deepVoices = [VoiceName.ADAM, VoiceName.JOSH, VoiceName.BILL, VoiceName.ANTONI];
    const softVoices = [VoiceName.BELLA, VoiceName.NICOLE, VoiceName.SARAH, VoiceName.RACHEL];
    
    if (deepVoices.includes(voice)) return VoiceName.FENRIR;
    if (softVoices.includes(voice)) return VoiceName.KORE;
    
    // NotebookLM mapping
    if (voice === VoiceName.NOTEBOOK_V3) return VoiceName.PUCK;
    if (voice === VoiceName.NOTEBOOK_V2) return VoiceName.FENRIR;
    
    return VoiceName.ZEPHYR;
  }

  async synthesize(text: string, voice: VoiceName, speed: number, styleDescription: string): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();
    const targetVoice = this.mapToNativeVoice(voice);
    const speedStr = speed.toFixed(2);
    
    const prompt = `Act as a world-class professional audiobook narrator. 
    Vocal Persona: ${styleDescription}
    Reading Speed: ${speedStr}x.

    STRUCTURAL PERFORMANCE CUES:
    - '#' (BOOK TITLE): Maximum resonance. 3s pause.
    - '##' (SUBTITLE): Grounded, steady emphasis. 2.5s pause.
    - '###' (CHAPTER TITLE): Clear energetic shift. 2s pause.
    - '>' (REFLECTIVE PROMPT): Slower, ethereal tone. 3s pause.
    - '[WISDOM CARD]': Warm, revered storytelling cadence. 2s pause.
    
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
    if (!base64Audio) throw new Error("Synthesis failed.");

    return await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
  }
}
