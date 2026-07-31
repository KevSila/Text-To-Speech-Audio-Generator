import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  const PORT = 3000;

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Native voice list for validation & mapping
  const NATIVE_VOICES = ["Charon", "Puck", "Kore", "Fenrir", "Zephyr"];

  function mapToNativeVoice(voice: string): string {
    if (NATIVE_VOICES.includes(voice)) return voice;
    const vLower = voice.toLowerCase();
    if (vLower.includes("adam") || vLower.includes("josh") || vLower.includes("bill") || vLower.includes("deep")) {
      return "Fenrir";
    }
    if (vLower.includes("bella") || vLower.includes("nicole") || vLower.includes("sarah") || vLower.includes("rachel")) {
      return "Kore";
    }
    if (vLower.includes("puck") || vLower.includes("energetic") || vLower.includes("podcast")) {
      return "Puck";
    }
    if (vLower.includes("charon") || vLower.includes("firelit")) {
      return "Charon";
    }
    return "Zephyr";
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    const isReady = Boolean(apiKey && apiKey !== "undefined" && apiKey !== "");
    res.json({
      status: "ok",
      engineReady: isReady,
      model: "gemini-3.1-flash-tts-preview",
    });
  });

  // Synthesize single speaker audio
  app.post("/api/tts/synthesize", async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: "API key is not configured on the server." });
      }

      const { text, voice = "Zephyr", speed = 1.0, styleDescription = "" } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text content is required." });
      }

      const targetVoice = mapToNativeVoice(voice);
      const speedStr = typeof speed === "number" ? speed.toFixed(2) : "1.00";

      const prompt = `Act as a world-class professional audiobook narrator.
Vocal Persona: ${styleDescription || "Natural, crisp, articulate, and engaging storytelling."}
Reading Speed: ${speedStr}x.

STRUCTURAL PERFORMANCE CUES:
- '#' (BOOK TITLE): Maximum resonance and grandeur. 3s pause.
- '##' (SUBTITLE): Grounded, steady emphasis. 2.5s pause.
- '###' (CHAPTER TITLE): Clear energetic shift. 2s pause.
- '>' (REFLECTIVE PROMPT): Slower, ethereal, thoughtful tone. 2.5s pause.
- '[WISDOM CARD]': Warm, revered storytelling cadence. 2s pause.

MANUSCRIPT:
${text.trim()}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
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

      const candidate = response.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio payload returned from Gemini TTS model.");
      }

      return res.json({
        audioBase64: base64Audio,
        sampleRate: 24000,
        voiceUsed: targetVoice,
      });
    } catch (err: any) {
      console.error("[Server TTS Error]:", err);
      return res.status(500).json({
        error: err.message || "Failed to synthesize speech.",
      });
    }
  });

  // Voice Preview Endpoint
  app.post("/api/tts/preview", async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: "API key is not configured on the server." });
      }

      const { voice = "Zephyr" } = req.body;
      const targetVoice = mapToNativeVoice(voice);

      const previewTexts: Record<string, string> = {
        Zephyr: "Hello. I am Zephyr, providing smooth, professional narration for long-form manuscripts.",
        Charon: "Greetings. I am Charon. My voice carries resonance, warmth, and depth.",
        Kore: "I am Kore. Precise, clear, and modern, ideal for structural reading.",
        Fenrir: "I am Fenrir. Deep, steady, and authoritative for powerful storytelling.",
        Puck: "Hi! I'm Puck. Lively and engaging for energetic audio scripts.",
      };

      const sampleText = previewTexts[targetVoice] || "Vocal sample ready for studio recording.";
      const prompt = `Say clearly with professional vocal clarity: "${sampleText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
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
      if (!base64Audio) {
        throw new Error("No preview audio returned.");
      }

      return res.json({
        audioBase64: base64Audio,
        sampleRate: 24000,
        voiceUsed: targetVoice,
      });
    } catch (err: any) {
      console.error("[Server Preview Error]:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate vocal preview.",
      });
    }
  });

  // Multi-Speaker Dialog TTS Endpoint
  app.post("/api/tts/multispeaker", async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: "API key is not configured on the server." });
      }

      const { script, speakers = [] } = req.body;
      if (!script || !Array.isArray(speakers) || speakers.length !== 2) {
        return res.status(400).json({
          error: "Multi-speaker performance requires a script and exactly 2 speakers configuration.",
        });
      }

      const speakerVoiceConfigs = speakers.map((sp: { name: string; voice: string }) => ({
        speaker: sp.name,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: mapToNativeVoice(sp.voice) },
        },
      }));

      const prompt = `Perform the following audio dialogue recording between ${speakers[0].name} and ${speakers[1].name}:\n\n${script}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs,
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No multi-speaker audio payload returned.");
      }

      return res.json({
        audioBase64: base64Audio,
        sampleRate: 24000,
      });
    } catch (err: any) {
      console.error("[Multi-speaker TTS Error]:", err);
      return res.status(500).json({
        error: err.message || "Failed to synthesize multi-speaker dialogue.",
      });
    }
  });

  // AI Director Manuscript Analysis Endpoint
  app.post("/api/manuscript/analyze", async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: "API key is not configured on the server." });
      }

      const { text, bookTitle = "Audiobook Project" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required for analysis." });
      }

      const prompt = `You are a professional Audiobook Executive Director.
Analyze the following manuscript excerpt for production.

Manuscript:
"""
${text.slice(0, 3000)}
"""

Provide a structured JSON output with the following fields:
- summary: Short 2-sentence summary of the tone and themes
- recommendedVoice: Recommended prebuilt voice out of ["Zephyr", "Charon", "Kore", "Fenrir", "Puck"] with justification
- recommendedSpeed: Recommended pacing (e.g. 0.95, 1.0, 0.85)
- pacingAdvice: Practical vocal direction notes for narration
- detectedDialogue: boolean indicating if multi-speaker dialogue is detected
- dialogueSpeakers: string array of speaker names if dialogue is detected
- annotatedManuscript: enhanced version of the manuscript with structural markdown tags (# for chapters, > for reflective beats, etc.) where helpful.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const jsonText = response.text || "{}";
      const analysis = JSON.parse(jsonText);

      return res.json({
        status: "success",
        analysis,
      });
    } catch (err: any) {
      console.error("[Manuscript Analysis Error]:", err);
      return res.status(500).json({
        error: err.message || "Failed to analyze manuscript.",
      });
    }
  });

  // Serve Vite in development, static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
