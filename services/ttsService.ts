
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
    // Enhanced prompt to handle structure
    const prompt = `Act as a professional audiobook narrator. 
    Vocal Style Profile: ${styleDescription}
    Reading Speed: ${speed}x.

    STRUCTURAL RULES:
    1. Text starting with '#' is a Main Title. Read it with authoritative, resonant emphasis and pause for 2.5 seconds after.
    2. Text starting with '##' is a Subtitle. Read it clearly and slightly slower than normal, and pause for 2 seconds after.
    3. Lines starting with bullet points (•, *, -) should be read as a list. Use a list-cadence and pause for 1.2 seconds between each point.
    4. For all other paragraphs, maintain a clear 2-second pause between them.
    5. DO NOT say 'Chapter X', '#' or 'bullet' symbols. Use the symbols only as cues for your vocal performance.
    
    Text to narrate: 
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
