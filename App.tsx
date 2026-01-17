
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TTSService } from './services/ttsService';
import { VoiceName, AudiobookChunk, AudiobookSettings, BOOK_PROFILES, BookProfile } from './types';
import { audioBufferToWav } from './utils/audioUtils';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const VolumeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

// Constant for Free Tier Limits
const DAILY_REQUEST_LIMIT = 1500; 

function App() {
  const [activeBook, setActiveBook] = useState<BookProfile>(BOOK_PROFILES[0]);
  const [inputText, setInputText] = useState('');
  const [chunks, setChunks] = useState<AudiobookChunk[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  
  // Usage tracking state
  const [usage, setUsage] = useState({
    requestsToday: 0,
    wordsProcessed: 0,
    lastResetDate: new Date().toLocaleDateString()
  });

  const [settings, setSettings] = useState<AudiobookSettings>({
    voice: BOOK_PROFILES[0].defaultVoice,
    speed: 1.0, 
    paragraphPause: 2.0
  });

  const ttsRef = useRef<TTSService | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Persistence and reset logic for usage
  useEffect(() => {
    const savedUsage = localStorage.getItem('studio_usage');
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      if (parsed.lastResetDate !== new Date().toLocaleDateString()) {
        const freshUsage = { requestsToday: 0, wordsProcessed: 0, lastResetDate: new Date().toLocaleDateString() };
        setUsage(freshUsage);
        localStorage.setItem('studio_usage', JSON.stringify(freshUsage));
      } else {
        setUsage(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (process.env.API_KEY) {
      ttsRef.current = new TTSService(process.env.API_KEY);
    }
  }, []);

  const updateUsage = (wordCount: number) => {
    const newUsage = {
      ...usage,
      requestsToday: usage.requestsToday + 1,
      wordsProcessed: usage.wordsProcessed + wordCount
    };
    setUsage(newUsage);
    localStorage.setItem('studio_usage', JSON.stringify(newUsage));
  };

  const handleBookChange = (bookId: string) => {
    const book = BOOK_PROFILES.find(b => b.id === bookId);
    if (book) {
      setActiveBook(book);
      setSettings(prev => ({ ...prev, voice: book.defaultVoice }));
    }
  };

  const handleVoicePreview = async () => {
    if (!ttsRef.current || isPreviewing) return;
    setIsPreviewing(true);
    try {
      const buffer = await ttsRef.current.previewVoice(settings.voice);
      playBuffer(buffer);
      updateUsage(15); // Avg words in preview
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!inputText.trim() || !ttsRef.current) return;
    if (usage.requestsToday >= DAILY_REQUEST_LIMIT) {
      alert("Daily free-tier request limit reached. It will refresh tomorrow.");
      return;
    }
    
    setIsSynthesizing(true);
    const wordCount = inputText.split(/\s+/).length;
    
    try {
      const buffer = await ttsRef.current.synthesize(
        inputText, 
        settings.voice, 
        settings.speed, 
        activeBook.narrationStyle
      );
      
      const newChunk: AudiobookChunk = {
        id: crypto.randomUUID(),
        text: inputText.slice(0, 80) + (inputText.length > 80 ? '...' : ''),
        timestamp: Date.now(),
        audioBuffer: buffer,
        duration: buffer.duration
      };

      setChunks(prev => [newChunk, ...prev]);
      setInputText('');
      updateUsage(wordCount);
    } catch (err) {
      console.error(err);
      alert("Error synthesizing speech. Ensure your API Key is valid.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!ttsRef.current) return;
    if (sourceRef.current) sourceRef.current.stop();

    const ctx = ttsRef.current.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    
    source.start(0);
    sourceRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleDownload = (chunk: AudiobookChunk) => {
    if (!chunk.audioBuffer) return;
    const wavBlob = audioBufferToWav(chunk.audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Take_${new Date(chunk.timestamp).getTime()}.wav`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const getSpeedValue = (speed: number) => {
    if (speed === 1) return "1.0";
    if (speed === 0.8) return "0.8";
    if (speed === 0.95) return "0.95";
    if (speed === 1.2) return "1.2";
    if (speed === 1.5) return "1.5";
    return speed.toString();
  };

  return (
    <div className="min-h-screen text-[#2c2c2c] flex flex-col transition-colors duration-500" style={{ backgroundColor: activeBook.accentColor }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold transition-colors duration-500" style={{ backgroundColor: activeBook.themeColor }}>
            {activeBook.title[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Text to Speech Studio</h1>
            <div className="flex items-center gap-2">
               <BookIcon />
               <select 
                  className="bg-transparent border-none text-sm font-semibold uppercase tracking-widest focus:ring-0 cursor-pointer outline-none"
                  style={{ color: activeBook.themeColor }}
                  value={activeBook.id}
                  onChange={(e) => handleBookChange(e.target.value)}
               >
                 {BOOK_PROFILES.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
               </select>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSpecs(!showSpecs)}
          className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors border border-gray-100 px-3 py-1.5 rounded-full"
        >
          {showSpecs ? "Hide Specs" : "Studio Specs"}
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        {/* Editor Section */}
        <section className="flex-1 p-6 flex flex-col gap-6">
          {showSpecs && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-dashed border-gray-100 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                How Kev Sila Studio Works
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-xs text-gray-600 leading-relaxed">
                <div>
                  <p className="font-bold text-gray-800 mb-1">Neural Synthesis Engine</p>
                  <p>This studio uses **Gemini 2.5 Flash Native Audio**, a generative multimodal AI. It doesn't just synthesize text; it predicts human-like inflection based on linguistic context.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800 mb-1">Structural Interpretation</p>
                  <p>Markdown markers (#, ##, •) are parsed and converted into *Vocal Directives* that tell the AI exactly when to pause and how to change its pitch and authority.</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif italic text-gray-800">Manuscript Script</h2>
              <div className="flex gap-4 items-center">
                 <span className="text-sm text-gray-400 font-mono">{inputText.length} characters</span>
              </div>
            </div>
            <textarea
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-xl leading-relaxed placeholder:italic placeholder:text-gray-200 font-serif"
              placeholder={`Write your script here using structural markers for professional results...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="mt-6 flex flex-wrap items-center justify-between gap-6 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap gap-6">
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Narrator Voice</label>
                    <div className="flex items-center gap-2">
                        <select 
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50 outline-none cursor-pointer"
                            value={settings.voice}
                            onChange={(e) => setSettings({...settings, voice: e.target.value as VoiceName})}
                        >
                            {Object.values(VoiceName).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <button 
                          onClick={handleVoicePreview}
                          disabled={isPreviewing}
                          className={`p-2 rounded-lg transition-all border flex items-center justify-center ${
                            isPreviewing 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 animate-pulse' 
                            : 'hover:bg-gray-100 text-gray-600 border-gray-200 active:scale-95'
                          }`}
                        >
                          {isPreviewing ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div> : <VolumeIcon />}
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-tight pr-1">Listen</span>
                        </button>
                    </div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Speed Multiplier</label>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50 outline-none cursor-pointer"
                        value={getSpeedValue(settings.speed)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSettings(prev => ({...prev, speed: val}));
                        }}
                    >
                        <option value="0.8">0.8x (Very Slow)</option>
                        <option value="0.95">0.95x (Reflective)</option>
                        <option value="1.0">1.0x (Normal)</option>
                        <option value="1.2">1.2x (Conversational)</option>
                        <option value="1.5">1.5x (Fast Pace)</option>
                    </select>
                 </div>
              </div>

              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || !inputText.trim() || usage.requestsToday >= DAILY_REQUEST_LIMIT}
                className={`px-10 py-4 rounded-full font-bold transition-all shadow-xl flex items-center gap-3 text-white ${
                  isSynthesizing || !inputText.trim() || usage.requestsToday >= DAILY_REQUEST_LIMIT
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'hover:scale-105 active:scale-95'
                }`}
                style={{ backgroundColor: !isSynthesizing && inputText.trim() && usage.requestsToday < DAILY_REQUEST_LIMIT ? activeBook.themeColor : undefined }}
              >
                {isSynthesizing ? 'Synthesizing...' : 'Start Narrating'}
              </button>
            </div>
          </div>
        </section>

        {/* Chunks Sidebar */}
        <aside className="w-full lg:w-[450px] p-6 lg:border-l border-gray-200 flex flex-col gap-6 bg-white/50 backdrop-blur-md">
          
          {/* Studio Health Monitor */}
          <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-sm border-l-4" style={{ borderColor: activeBook.themeColor }}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-2">
                 <ActivityIcon /> Studio Health & Quota
               </h3>
               <span className="text-[9px] text-gray-400 font-bold uppercase">Daily Free Tier</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                  <span>Daily Capacity</span>
                  <span>{usage.requestsToday} / {DAILY_REQUEST_LIMIT} req</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ 
                      width: `${(usage.requestsToday / DAILY_REQUEST_LIMIT) * 100}%`,
                      backgroundColor: activeBook.themeColor
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Estimated Tokens</span>
                <span className="text-[10px] font-mono text-gray-700">~{Math.round(usage.wordsProcessed * 1.3).toLocaleString()} used</span>
              </div>
            </div>
          </div>

          {/* Structural Reference Guide */}
          <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-blue-500"><InfoIcon /></div>
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-[10px]">Studio Reference Guide</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-bold">#</span>
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Main Title</p>
                  <p className="text-[10px] text-gray-500">Authoritative focus + 2.5s pause</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-bold">##</span>
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Subtitle</p>
                  <p className="text-[10px] text-gray-500">Steady emphasis + 2s pause</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-bold">•</span>
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Bullet Points</p>
                  <p className="text-[10px] text-gray-500">List cadence + 1.2s gap</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs">Master Takes</h3>
            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">{chunks.length} Saved</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
            {chunks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 opacity-40 border-2 border-dashed border-gray-200 rounded-3xl text-center px-6">
                <p className="text-sm italic">Generate audio takes to build your project here.</p>
              </div>
            ) : (
              chunks.map((chunk) => (
                <div 
                  key={chunk.id} 
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group"
                >
                  <p className="text-sm font-serif italic text-gray-700 line-clamp-2 mb-4 leading-relaxed">"{chunk.text}"</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-5">
                    <span>{new Date(chunk.timestamp).toLocaleTimeString()}</span>
                    <span>{chunk.duration.toFixed(1)}s Runtime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => chunk.audioBuffer && playBuffer(chunk.audioBuffer)}
                      className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                      style={{ backgroundColor: activeBook.accentColor, color: activeBook.themeColor }}
                    >
                      <PlayIcon /> Play Take
                    </button>
                    <button 
                      onClick={() => handleDownload(chunk)}
                      title="Download WAV"
                      className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <DownloadIcon />
                    </button>
                    <button 
                      onClick={() => setChunks(prev => prev.filter(c => c.id !== chunk.id))}
                      className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {isPlaying && (
            <div className="text-white p-5 rounded-2xl flex items-center justify-between shadow-2xl animate-pulse transition-colors duration-500" style={{ backgroundColor: activeBook.themeColor }}>
                <div className="flex items-center gap-4">
                    <PauseIcon />
                    <span className="text-sm font-bold uppercase tracking-widest">Master Playback Active</span>
                </div>
                <button onClick={stopAudio} className="text-xs font-bold bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">STOP</button>
            </div>
          )}
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-6 flex justify-between items-center text-gray-400">
        <p className="text-[11px] font-bold uppercase tracking-wide leading-tight">
          Kev Sila Text to Speech Audio Generator from '' Solitude In The Digital Age Project''
        </p>
        <p className="text-[11px] font-bold text-gray-300 uppercase shrink-0 ml-4">WAV Export Enabled</p>
      </footer>
    </div>
  );
}

export default App;
