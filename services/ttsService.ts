import { VoiceName } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

export class TTSService {
  private audioContext: AudioContext | null = null;

  async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.audioContext.state !== "running") {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("AudioContext resume warning:", e);
      }
    }
    return this.audioContext;
  }

  async previewVoice(voice: VoiceName): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();

    const res = await fetch("/api/tts/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Voice preview failed.");
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error("No preview audio returned from server.");
    }

    const audioBytes = decodeBase64(data.audioBase64);
    return await decodeAudioData(audioBytes, ctx, data.sampleRate || 24000, 1);
  }

  async synthesize(
    text: string,
    voice: VoiceName,
    speed: number,
    styleDescription: string
  ): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();

    const res = await fetch("/api/tts/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, speed, styleDescription }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Speech synthesis failed.");
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error("No audio payload received from server.");
    }

    const audioBytes = decodeBase64(data.audioBase64);
    return await decodeAudioData(audioBytes, ctx, data.sampleRate || 24000, 1);
  }

  async synthesizeMultiSpeaker(
    script: string,
    speakers: { name: string; voice: string }[]
  ): Promise<AudioBuffer> {
    const ctx = await this.ensureAudioContext();

    const res = await fetch("/api/tts/multispeaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, speakers }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Multi-speaker synthesis failed.");
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error("No audio payload returned from server.");
    }

    const audioBytes = decodeBase64(data.audioBase64);
    return await decodeAudioData(audioBytes, ctx, data.sampleRate || 24000, 1);
  }

  async analyzeManuscript(text: string, bookTitle: string) {
    const res = await fetch("/api/manuscript/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, bookTitle }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Manuscript analysis failed.");
    }

    const data = await res.json();
    return data.analysis;
  }
}
