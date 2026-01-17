
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

export class TTSService {
  private ai: any;
  private audioContext: AudioContext;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  async synthesize(text: string, voice: VoiceName, speed: number, styleDescription: string): Promise<AudioBuffer> {
    const prompt = `Act as a professional audiobook narrator. 
    Vocal Style Profile: ${styleDescription}
    Reading Speed: ${speed}x.
    CRITICAL INSTRUCTION: Insert a clear 2-second pause between every paragraph. 
    DO NOT say 'Chapter X' or any metadata unless it is explicitly in the text below.
    
    Text to read: 
    ${text}`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio content received from Gemini.");
    }

    const audioBytes = decodeBase64(base64Audio);
    return await decodeAudioData(audioBytes, this.audioContext, 24000, 1);
  }

  getAudioContext() {
    return this.audioContext;
  }
}
