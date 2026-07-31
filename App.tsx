import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TTSService } from './services/ttsService';
import {
  VoiceName,
  AudiobookChunk,
  AudiobookSettings,
  BOOK_PROFILES,
  BookProfile,
  Platform,
  PLATFORM_VOICES,
  RecordingMode,
  ManuscriptAnalysis,
} from './types';
import { audioBufferToWav, stitchAudioBuffers } from './utils/audioUtils';
import { Header } from './components/Header';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ManuscriptEditor } from './components/ManuscriptEditor';
import { VoicePerformanceControls } from './components/VoicePerformanceControls';
import { MasterSessionTakes } from './components/MasterSessionTakes';
import { Mail, MessageCircle, RefreshCw, Volume2 } from 'lucide-react';

const LIMITS = {
  [Platform.GEMINI]: 1500,
  [Platform.ELEVEN_LABS]: 100,
  [Platform.NOTEBOOK_LM]: 200,
};

function App() {
  const [activeBook, setActiveBook] = useState<BookProfile>(BOOK_PROFILES[0]);
  const [inputText, setInputText] = useState('');
  const [chunks, setChunks] = useState<AudiobookChunk[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [engineReady, setEngineReady] = useState(true);
  const [analysis, setAnalysis] = useState<ManuscriptAnalysis | null>(null);

  const [metadata, setMetadata] = useState({
    chapterTitle: 'Chapter 1: The Beginning',
    part: '01',
  });

  const [usage, setUsage] = useState({
    geminiRequests: 0,
    elevenLabsRequests: 0,
    notebookRequests: 0,
    lastResetDate: new Date().toLocaleDateString(),
  });

  const [settings, setSettings] = useState<AudiobookSettings>({
    voice: BOOK_PROFILES[0].defaultVoice,
    speed: 0.95,
    paragraphPause: 2.0,
    platform: Platform.GEMINI,
    mode: RecordingMode.SOLO,
    speakers: [
      { name: 'Narrator', voice: VoiceName.ZEPHYR },
      { name: 'Character', voice: VoiceName.PUCK },
    ],
    masterPauseDuration: 1.0,
  });

  const ttsRef = useRef<TTSService>(new TTSService());
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Check backend engine health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.engineReady !== undefined) {
          setEngineReady(data.engineReady);
        }
      })
      .catch((err) => {
        console.warn('[Engine Health Check Warning]:', err);
      });
  }, []);

  // Load saved session state from localStorage
  useEffect(() => {
    try {
      const savedUsage = localStorage.getItem('studio_usage_v6');
      if (savedUsage) {
        const parsed = JSON.parse(savedUsage);
        if (parsed.lastResetDate !== new Date().toLocaleDateString()) {
          resetLocalUsage();
        } else {
          setUsage(parsed);
        }
      }

      const savedText = localStorage.getItem('studio_manuscript_text');
      if (savedText) {
        setInputText(savedText);
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
  }, []);

  // Save manuscript text to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studio_manuscript_text', inputText);
    } catch (e) {}
  }, [inputText]);

  // Handle Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const resetLocalUsage = () => {
    const fresh = {
      geminiRequests: 0,
      elevenLabsRequests: 0,
      notebookRequests: 0,
      lastResetDate: new Date().toLocaleDateString(),
    };
    setUsage(fresh);
    localStorage.setItem('studio_usage_v6', JSON.stringify(fresh));
  };

  const wordCount = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [inputText]);

  const checkAndIncrementQuota = (platform: Platform) => {
    if (cooldown > 0) return false;

    const currentLimit = LIMITS[platform];
    const currentUsage =
      platform === Platform.GEMINI
        ? usage.geminiRequests
        : platform === Platform.ELEVEN_LABS
        ? usage.elevenLabsRequests
        : usage.notebookRequests;

    if (currentUsage >= currentLimit) {
      alert(`[Session Limit] Daily take limit reached for ${platform.replace('_', ' ')}.`);
      return false;
    }

    const nextUsage = { ...usage };
    if (platform === Platform.GEMINI) nextUsage.geminiRequests += 1;
    if (platform === Platform.ELEVEN_LABS) nextUsage.elevenLabsRequests += 1;
    if (platform === Platform.NOTEBOOK_LM) nextUsage.notebookRequests += 1;

    setUsage(nextUsage);
    localStorage.setItem('studio_usage_v6', JSON.stringify(nextUsage));
    return true;
  };

  const playBuffer = async (buffer: AudioBuffer, chunkId?: string) => {
    const ctx = await ttsRef.current.ensureAudioContext();
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setCurrentlyPlayingId(null);
    source.start(0);
    sourceRef.current = source;
    if (chunkId) setCurrentlyPlayingId(chunkId);
  };

  const stopPlayback = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
    }
    setCurrentlyPlayingId(null);
  };

  const handleSynthesize = async () => {
    if (!inputText.trim()) return;
    if (!checkAndIncrementQuota(settings.platform)) return;

    setIsSynthesizing(true);
    try {
      let buffer: AudioBuffer;

      if (settings.mode === RecordingMode.MULTI_SPEAKER) {
        buffer = await ttsRef.current.synthesizeMultiSpeaker(inputText, settings.speakers);
      } else {
        buffer = await ttsRef.current.synthesize(
          inputText,
          settings.voice,
          settings.speed,
          activeBook.narrationStyle
        );
      }

      const newChunk: AudiobookChunk = {
        id: crypto.randomUUID(),
        text: inputText.slice(0, 100) + (inputText.length > 100 ? '...' : ''),
        timestamp: Date.now(),
        audioBuffer: buffer,
        duration: buffer.duration,
        metadata: {
          bookTitle: activeBook.title,
          chapterTitle: metadata.chapterTitle,
          part: metadata.part,
          mode: settings.mode,
        },
      };

      setChunks((prev) => [newChunk, ...prev]);

      // Auto-increment part/take number
      const nextPartNum = parseInt(metadata.part) + 1;
      setMetadata((prev) => ({
        ...prev,
        part: isNaN(nextPartNum) ? '02' : nextPartNum.toString().padStart(2, '0'),
      }));
    } catch (err: any) {
      console.error('[Studio Recording Error]:', err);
      if (err.message?.includes('quota') || err.message?.includes('429')) {
        setCooldown(60);
      } else {
        alert(`Synthesis Notice: ${err.message || 'Error communicating with studio backend engine.'}`);
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePreviewVoice = async () => {
    if (!checkAndIncrementQuota(settings.platform)) return;

    setIsPreviewing(true);
    try {
      const buffer = await ttsRef.current.previewVoice(settings.voice);
      if (buffer) await playBuffer(buffer);
    } catch (err: any) {
      console.error('[Voice Preview Error]:', err);
      alert(`Preview Notice: ${err.message || 'Could not fetch voice sample.'}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleAnalyzeManuscript = async (): Promise<ManuscriptAnalysis | null> => {
    if (!inputText.trim()) return null;
    setIsAnalyzing(true);
    try {
      const res = await ttsRef.current.analyzeManuscript(inputText, activeBook.title);
      setAnalysis(res);
      return res;
    } catch (err: any) {
      console.error('[Manuscript Analysis Error]:', err);
      alert('Could not analyze manuscript at this time.');
      return null;
    } flex-1;
    setIsAnalyzing(false);
  };

  const handleDownloadChunk = (chunk: AudiobookChunk) => {
    if (!chunk.audioBuffer || !chunk.metadata) return;
    const wavBlob = audioBufferToWav(chunk.audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const fileName = `${chunk.metadata.bookTitle}_${chunk.metadata.chapterTitle}_Part${chunk.metadata.part}.wav`
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .toUpperCase();
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleStitchAndExportMasterTrack = async () => {
    if (chunks.length === 0) return;
    setIsStitching(true);
    try {
      const ctx = await ttsRef.current.ensureAudioContext();
      // Gather buffers in chronological order (reverse of chunks state array)
      const orderedBuffers = chunks
        .slice()
        .reverse()
        .map((c) => c.audioBuffer)
        .filter((b): b is AudioBuffer => Boolean(b));

      if (orderedBuffers.length === 0) {
        alert('No valid audio buffers found to stitch.');
        return;
      }

      const masterBuffer = stitchAudioBuffers(orderedBuffers, ctx, settings.masterPauseDuration);
      const masterWavBlob = audioBufferToWav(masterBuffer);

      const url = URL.createObjectURL(masterWavBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const fileName = `${activeBook.title}_${metadata.chapterTitle}_MASTER_CHAPTER.wav`
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .toUpperCase();
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[Stitch Export Error]:', err);
      alert('Failed to stitch master track.');
    } finally {
      setIsStitching(false);
    }
  };

  const moveChunkUp = (idx: number) => {
    if (idx <= 0) return;
    const copy = [...chunks];
    const temp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = temp;
    setChunks(copy);
  };

  const moveChunkDown = (idx: number) => {
    if (idx >= chunks.length - 1) return;
    const copy = [...chunks];
    const temp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = temp;
    setChunks(copy);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a1a1a] flex flex-col font-sans overflow-x-hidden selection:bg-amber-100">
      {/* Header Bar */}
      <Header
        activeBook={activeBook}
        onBookChange={(b) => {
          setActiveBook(b);
          setSettings((s) => ({ ...s, voice: b.defaultVoice }));
        }}
        platform={settings.platform}
        onPlatformChange={(p) =>
          setSettings((s) => ({ ...s, platform: p, voice: PLATFORM_VOICES[p][0] }))
        }
        recordingMode={settings.mode}
        onRecordingModeChange={(m) => setSettings((s) => ({ ...s, mode: m }))}
        showSpecs={showSpecs}
        onToggleSpecs={() => setShowSpecs(!showSpecs)}
        engineReady={engineReady}
      />

      {/* Main Studio Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Project Dashboard (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ProjectDashboard
            chapterTitle={metadata.chapterTitle}
            onChapterTitleChange={(val) => setMetadata((m) => ({ ...m, chapterTitle: val }))}
            part={metadata.part}
            onPartChange={(val) => setMetadata((m) => ({ ...m, part: val }))}
            masterPauseDuration={settings.masterPauseDuration}
            onMasterPauseDurationChange={(val) =>
              setSettings((s) => ({ ...s, masterPauseDuration: val }))
            }
            usage={usage}
            limits={LIMITS}
            activePlatform={settings.platform}
            onResetUsage={resetLocalUsage}
          />
        </div>

        {/* Middle Column: Manuscript Editor & Performance Controls (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {showSpecs && (
            <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-amber-300 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Production
                & Studio Notes
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-xs leading-relaxed text-gray-600">
                <div>
                  <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
                    Structural Tags
                  </p>
                  <p>
                    Use <b>#</b> for resonant titles, <b>##</b> for subtitles, and <b>&gt;</b> for
                    ethereal pauses.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
                    Master Track Export
                  </p>
                  <p>
                    Record individual takes, then click <b>Export Stitched Master Chapter</b> to render
                    a single compiled WAV file!
                  </p>
                </div>
              </div>
            </div>
          )}

          <ManuscriptEditor
            inputText={inputText}
            onInputTextChange={setInputText}
            wordCount={wordCount}
            recordingMode={settings.mode}
            onAnalyzeManuscript={handleAnalyzeManuscript}
            isAnalyzing={isAnalyzing}
            analysis={analysis}
            onApplyAnnotatedManuscript={(annotated) => setInputText(annotated)}
          />

          <VoicePerformanceControls
            settings={settings}
            onSettingsChange={setSettings}
            onPreviewVoice={handlePreviewVoice}
            isPreviewing={isPreviewing}
            cooldown={cooldown}
            isSynthesizing={isSynthesizing}
            onSynthesize={handleSynthesize}
            inputText={inputText}
            themeColor={activeBook.themeColor}
          />
        </div>

        {/* Right Column: Master Session Takes (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <MasterSessionTakes
            chunks={chunks}
            currentlyPlayingId={currentlyPlayingId}
            onPlayChunk={(c) => c.audioBuffer && playBuffer(c.audioBuffer, c.id)}
            onStopChunk={stopPlayback}
            onDownloadChunk={handleDownloadChunk}
            onDeleteChunk={(id) => setChunks((prev) => prev.filter((x) => x.id !== id))}
            onStitchAndExportMasterTrack={handleStitchAndExportMasterTrack}
            isStitching={isStitching}
            onMoveChunkUp={moveChunkUp}
            onMoveChunkDown={moveChunkDown}
          />
        </div>
      </main>

      {/* Studio Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 md:px-12 py-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">
              AUDIOBOOK STUDIO
            </p>
            <p className="text-xs text-gray-400 font-serif italic mt-0.5">
              "Technology is the bridge, but the human voice is the destination."
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black bg-gray-900 text-white px-5 py-2.5 rounded-full uppercase tracking-widest shadow-xs">
            STUDIO ENGINE v6.0 • GEMINI 3.1
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
