import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TTSService } from './services/ttsService';
import { VoiceName, AudiobookChunk, AudiobookSettings, BOOK_PROFILES, BookProfile, Platform, PLATFORM_VOICES } from './types';
import { audioBufferToWav } from './utils/audioUtils';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const VolumeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.4 8.38 8.38 0 0 1 3.8.9L21 4.25z"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;

const LIMITS = {
  [Platform.GEMINI]: 1500,
  [Platform.ELEVEN_LABS]: 100,
  [Platform.NOTEBOOK_LM]: 200,
};

const SAFE_BATCH_WORDS = 1800;
const MAX_BATCH_WORDS = 2200;

function App() {
  const [activeBook, setActiveBook] = useState<BookProfile>(BOOK_PROFILES[0]);
  const [inputText, setInputText] = useState('');
  const [chunks, setChunks] = useState<AudiobookChunk[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  
  const [metadata, setMetadata] = useState({
    chapterTitle: 'Chapter 1',
    part: '01'
  });

  const [usage, setUsage] = useState({
    geminiRequests: 0,
    elevenLabsRequests: 0,
    notebookRequests: 0,
    lastResetDate: new Date().toLocaleDateString()
  });

  const [settings, setSettings] = useState<AudiobookSettings>({
    voice: BOOK_PROFILES[0].defaultVoice,
    speed: 0.95, 
    paragraphPause: 2.0,
    platform: Platform.GEMINI
  });

  const ttsRef = useRef<TTSService | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const currentWordCount = useMemo(() => inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length, [inputText]);

  // Visual status only, no blocking
  const engineReady = useMemo(() => {
    const key = process.env.API_KEY;
    return !!(key && key !== "" && key !== "undefined");
  }, []);

  useEffect(() => {
    const savedUsage = localStorage.getItem('studio_usage_v5.9');
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      if (parsed.lastResetDate !== new Date().toLocaleDateString()) {
        resetLocalUsage();
      } else {
        setUsage(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const resetLocalUsage = () => {
    const fresh = { 
      geminiRequests: 0, 
      elevenLabsRequests: 0, 
      notebookRequests: 0, 
      lastResetDate: new Date().toLocaleDateString() 
    };
    setUsage(fresh);
    localStorage.setItem('studio_usage_v5.9', JSON.stringify(fresh));
  };

  useEffect(() => {
    const key = process.env.API_KEY;
    if (key && key !== "undefined" && key !== "") {
      ttsRef.current = new TTSService(key);
      console.log("[Studio] Engine v5.9 initialized.");
    }
  }, []);

  const checkAndIncrementQuota = (platform: Platform) => {
    if (cooldown > 0) return false;

    const currentLimit = LIMITS[platform];
    const currentUsage = platform === Platform.GEMINI ? usage.geminiRequests :
                         platform === Platform.ELEVEN_LABS ? usage.elevenLabsRequests :
                         usage.notebookRequests;

    if (currentUsage >= currentLimit) {
      alert(`[Session Full] Daily take limit reached for ${platform.replace('_', ' ')}.`);
      return false;
    }

    const nextUsage = { ...usage };
    if (platform === Platform.GEMINI) nextUsage.geminiRequests += 1;
    if (platform === Platform.ELEVEN_LABS) nextUsage.elevenLabsRequests += 1;
    if (platform === Platform.NOTEBOOK_LM) nextUsage.notebookRequests += 1;
    
    setUsage(nextUsage);
    localStorage.setItem('studio_usage_v5.9', JSON.stringify(nextUsage));
    return true;
  };

  const handleSynthesize = async () => {
    if (!ttsRef.current) {
        const key = process.env.API_KEY;
        if (key && key !== "undefined" && key !== "") {
            ttsRef.current = new TTSService(key);
        } else {
            alert("STUDIO ERROR: No API Key found in Netlify. Please check your Site Settings.");
            return;
        }
    }
    
    if (!inputText.trim() || !ttsRef.current) return;
    if (!checkAndIncrementQuota(settings.platform)) return;

    setIsSynthesizing(true);
    try {
      await ttsRef.current.ensureAudioContext();
      const buffer = await ttsRef.current.synthesize(
        inputText, 
        settings.voice, 
        settings.speed, 
        activeBook.narrationStyle
      );
      
      const newChunk: AudiobookChunk = {
        id: crypto.randomUUID(),
        text: inputText.slice(0, 80) + '...',
        timestamp: Date.now(),
        audioBuffer: buffer,
        duration: buffer.duration,
        metadata: { 
          bookTitle: activeBook.title, 
          chapterTitle: metadata.chapterTitle, 
          part: metadata.part 
        }
      };

      setChunks(prev => [newChunk, ...prev]);
      setInputText('');
      const nextPartNum = parseInt(metadata.part) + 1;
      setMetadata(prev => ({ ...prev, part: nextPartNum.toString().padStart(2, '0') }));
    } catch (err: any) {
      console.error("[Studio] Recording Error:", err);
      if (err.message?.includes('quota') || err.status === 429) {
        setCooldown(60);
      } else {
        alert("Synthesis failed. This usually means the API Key is invalid or rate limited.");
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDownload = (chunk: AudiobookChunk) => {
    if (!chunk.audioBuffer || !chunk.metadata) return;
    const wavBlob = audioBufferToWav(chunk.audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const fileName = `${chunk.metadata.bookTitle.toUpperCase()}_${chunk.metadata.chapterTitle.toUpperCase()}_${chunk.metadata.part}.wav`.replace(/\s+/g, '_');
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const playBuffer = async (buffer: AudioBuffer) => {
    if (!ttsRef.current) return;
    const ctx = await ttsRef.current.ensureAudioContext(); 
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceRef.current = source;
    setIsPlaying(true);
  };

  const getSafetyColor = () => {
    if (currentWordCount <= SAFE_BATCH_WORDS) return 'bg-green-500';
    if (currentWordCount <= MAX_BATCH_WORDS) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#1a1a1a] flex flex-col font-sans overflow-x-hidden selection:bg-amber-100">
      
      <nav className="bg-white border-b border-gray-200 px-4 md:px-10 py-5 flex flex-col lg:flex-row justify-between items-center gap-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6 w-full lg:w-auto">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter leading-none">KEV SILA STUDIO</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">TEXT TO SPEECH GENERATOR</p>
          </div>
          <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
          <select 
            className="bg-transparent border-none text-sm font-bold uppercase tracking-wider text-gray-600 focus:ring-0 cursor-pointer outline-none hover:text-gray-900 transition-colors"
            value={activeBook.id}
            onChange={(e) => {
              const b = BOOK_PROFILES.find(p => p.id === e.target.value)!;
              setActiveBook(b);
              setSettings(s => ({...s, voice: b.defaultVoice}));
            }}
          >
            {BOOK_PROFILES.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1.5 shrink-0">
            {[
              { id: Platform.GEMINI, label: 'Standard', sub: 'Gemini Flash' },
              { id: Platform.ELEVEN_LABS, label: 'Premium', sub: 'ElevenLabs' },
              { id: Platform.NOTEBOOK_LM, label: 'Vault', sub: 'NotebookLM' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSettings({...settings, platform: p.id, voice: PLATFORM_VOICES[p.id][0]})}
                className={`px-4 md:px-6 py-2.5 rounded-xl transition-all flex flex-col items-center min-w-[100px] ${
                  settings.platform === p.id ? 'bg-white shadow-md scale-105 border border-gray-100' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{p.label}</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mt-1">{p.sub}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowSpecs(!showSpecs)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 border border-gray-200 rounded-xl px-5 py-4 shrink-0 transition-all active:scale-95"
          >
            {showSpecs ? 'HIDE INFO' : 'STUDIO SPECS'}
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 md:p-8 gap-8">
        <aside className="w-full lg:w-80 flex flex-col gap-8 order-2 lg:order-1">
          <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <SettingsIcon /> Project Dashboard
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-wide">Chapter Title / Section</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-50 outline-none transition-all" 
                  value={metadata.chapterTitle} 
                  onChange={e => setMetadata({...metadata, chapterTitle: e.target.value})}
                  placeholder="e.g. Chapter 1"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-wide">File Part (Take)</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold" 
                  value={metadata.part} 
                  onChange={e => setMetadata({...metadata, part: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100 mt-auto flex flex-col gap-5">
             <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <ActivityIcon /> Engine Capacities
                </h3>
                <button onClick={resetLocalUsage} className="text-[9px] font-black text-amber-600 hover:text-amber-800 flex items-center gap-1 uppercase tracking-widest">
                   <RefreshIcon /> Reset
                </button>
             </div>
             
             {[
               { id: Platform.GEMINI, label: 'Gemini Capacity Takes', usage: usage.geminiRequests, limit: LIMITS[Platform.GEMINI], color: 'bg-amber-600' },
               { id: Platform.ELEVEN_LABS, label: 'ElevenLabs Premium Quota', usage: usage.elevenLabsRequests, limit: LIMITS[Platform.ELEVEN_LABS], color: 'bg-indigo-600' },
               { id: Platform.NOTEBOOK_LM, label: 'Vault (NotebookLM) Limit', usage: usage.notebookRequests, limit: LIMITS[Platform.NOTEBOOK_LM], color: 'bg-emerald-600' }
             ].map(eng => (
               <div key={eng.id} className={`transition-all duration-300 ${settings.platform === eng.id ? 'scale-105 opacity-100 ring-2 ring-gray-50 p-2 rounded-2xl -m-2' : 'opacity-40 grayscale-[0.5]'}`}>
                  <div className="flex justify-between items-center mb-1.5 px-1">
                     <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">{eng.label}</span>
                     <span className="text-[9px] font-black text-gray-600">{eng.usage}/{eng.limit}</span>
                  </div>
                  <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                     <div className={`h-full ${eng.color} transition-all duration-1000 ${settings.platform === eng.id ? 'animate-pulse' : ''}`} style={{ width: `${(eng.usage/eng.limit)*100}%` }} />
                  </div>
               </div>
             ))}
          </div>
        </aside>

        <section className="flex-1 flex flex-col gap-8 order-1 lg:order-2">
          {showSpecs && (
            <div className="bg-white p-8 md:p-12 rounded-[48px] border-2 border-dashed border-gray-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
               <h2 className="text-sm font-black uppercase tracking-[.5em] mb-8 flex items-center gap-4 text-gray-900">
                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> Production Notes
               </h2>
               <div className="grid md:grid-cols-2 gap-12 text-[13px] leading-relaxed text-gray-500">
                  <div className="space-y-5">
                    <p className="font-black text-gray-900 uppercase text-[11px] tracking-widest">Performance Tracking</p>
                    <p>The Gemini Engine handles complex markdown tags. Use <b>#</b> for resonant titles and <b>&gt;</b> for softer thoughts.</p>
                  </div>
                  <div className="space-y-5">
                    <p className="font-black text-gray-900 uppercase text-[11px] tracking-widest">Rate Limit Awareness</p>
                    <p>Free Tier users have a <b>15 Requests Per Minute</b> limit. If hit, the Record button acts as a cooldown timer.</p>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white rounded-[56px] shadow-2xl shadow-gray-200/60 border border-gray-50 p-8 md:p-16 flex flex-col flex-1 min-h-[550px]">
            <div className="flex justify-between items-center mb-10">
               <span className="text-[11px] font-black uppercase tracking-[.3em] text-gray-300">Working Manuscript</span>
               <div className="flex gap-4 text-[12px] font-black uppercase tracking-widest text-gray-400">
                  <span className="bg-gray-50 px-4 py-1.5 rounded-full">{currentWordCount.toLocaleString()} words</span>
               </div>
            </div>

            <textarea 
              className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-2xl md:text-4xl font-serif italic leading-relaxed placeholder:text-gray-100 custom-scrollbar outline-none pb-10"
              placeholder="Paste your manuscript here..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />

            <div className="mt-12 pt-10 border-t border-gray-50">
               <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-4">
                 <span>Batch Health Monitoring</span>
                 <span className={currentWordCount > SAFE_BATCH_WORDS ? 'text-amber-600' : 'text-green-500'}>
                    {currentWordCount > MAX_BATCH_WORDS ? 'Segment Risk Detected' : 'Optimal Take Performance'}
                 </span>
               </div>
               <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                 <div className={`h-full transition-all duration-1000 ease-out ${getSafetyColor()}`} style={{ width: `${Math.min((currentWordCount / MAX_BATCH_WORDS) * 100, 100)}%` }} />
               </div>
            </div>

            <div className="mt-14 flex flex-wrap items-end justify-between gap-10">
               <div className="flex flex-wrap gap-8 items-end">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Narrator Profile</label>
                    <div className="flex items-center gap-4">
                      <select 
                        className="bg-gray-50 border-none rounded-[20px] text-[13px] font-bold px-6 py-5 min-w-[260px] appearance-none outline-none cursor-pointer focus:ring-4 focus:ring-amber-50/50 transition-all shadow-sm"
                        value={settings.voice}
                        onChange={e => setSettings({...settings, voice: e.target.value as VoiceName})}
                      >
                        {PLATFORM_VOICES[settings.platform].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <button 
                        onClick={async () => {
                          if (!ttsRef.current) {
                            const key = process.env.API_KEY;
                            if (key && key !== "undefined" && key !== "") ttsRef.current = new TTSService(key);
                          }
                          if (!ttsRef.current) { alert("API KEY NOT DETECTED IN NETLIFY SETTINGS."); return; }
                          if (!checkAndIncrementQuota(settings.platform)) return;

                          setIsPreviewing(true);
                          try {
                            const ctx = await ttsRef.current.ensureAudioContext();
                            const b = await ttsRef.current.previewVoice(settings.voice);
                            if(b) playBuffer(b);
                          } catch(err: any) { 
                             alert("Preview failed. Verify API Key.");
                          }
                          setIsPreviewing(false);
                        }} 
                        disabled={isPreviewing || cooldown > 0}
                        className={`p-5 rounded-2xl transition-all active:scale-90 shadow-sm ${
                          cooldown > 0 ? 'bg-red-50 text-red-400 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white'
                        }`}
                        title="Vocal Preview"
                      >
                        {isPreviewing ? <div className="w-5 h-5 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div> : cooldown > 0 ? <span className="font-black text-[10px]">{cooldown}s</span> : <VolumeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Narrative Tempo</label>
                    <select 
                      className="bg-gray-50 border-none rounded-[20px] text-[13px] font-bold px-6 py-5 min-w-[150px] outline-none cursor-pointer shadow-sm"
                      value={settings.speed.toFixed(2)}
                      onChange={e => setSettings(prev => ({...prev, speed: parseFloat(e.target.value)}))}
                    >
                      <option value="0.80">0.80x Slow</option>
                      <option value="0.95">0.95x Reflective</option>
                      <option value="1.00">1.00x Natural</option>
                      <option value="1.20">1.20x Fast</option>
                    </select>
                  </div>
               </div>

               <button 
                 disabled={isSynthesizing || !inputText.trim() || cooldown > 0}
                 onClick={handleSynthesize}
                 className={`w-full md:w-auto px-20 py-7 rounded-full font-black uppercase tracking-[.4em] text-[11px] transition-all shadow-2xl active:scale-95 ${
                   isSynthesizing ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 
                   cooldown > 0 ? 'bg-red-50 text-red-400 border border-red-100' :
                   'text-white hover:brightness-110 shadow-gray-200 hover:-translate-y-1'
                 }`}
                 style={{ backgroundColor: (!isSynthesizing && cooldown <= 0) ? activeBook.themeColor : undefined }}
               >
                 {isSynthesizing ? 'RECORDING SESSION...' : cooldown > 0 ? `COOLDOWN: ${cooldown}s` : `Record Narrative Take`}
               </button>
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-96 flex flex-col gap-8 order-3">
           <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[.4em] text-gray-400">Master Session</h3>
              <span className="text-[11px] font-black bg-white border border-gray-100 px-4 py-1.5 rounded-full shadow-sm">{chunks.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-6 max-h-[600px] lg:max-h-none custom-scrollbar pb-16">
              {chunks.length === 0 ? (
                 <div className="py-32 text-center opacity-20 border-4 border-dotted border-gray-200 rounded-[48px]">
                   <p className="text-[11px] font-black uppercase tracking-[.3em]">No Recorded Takes</p>
                 </div>
              ) : (
                 chunks.map(c => (
                   <div key={c.id} className="bg-white p-7 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-2xl transition-all group relative">
                     <p className="text-[12px] italic font-serif text-gray-500 line-clamp-2 mb-4">"{c.text}"</p>
                     <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">
                       <span className="bg-gray-50 px-4 py-1.5 rounded-xl text-amber-900/40">{c.metadata?.chapterTitle} Take {c.metadata?.part}</span>
                       <span>{c.duration.toFixed(1)}s</span>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => c.audioBuffer && playBuffer(c.audioBuffer)} className="flex-1 py-4 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl flex justify-center transition-all active:scale-95 shadow-sm">
                           <PlayIcon />
                        </button>
                        <button onClick={() => handleDownload(c)} className="p-4 bg-gray-50 hover:bg-amber-600 hover:text-white rounded-2xl text-gray-400 transition-all active:scale-95 shadow-sm">
                           <DownloadIcon />
                        </button>
                        <button onClick={() => setChunks(prev => prev.filter(x => x.id !== c.id))} className="p-4 text-gray-100 hover:text-red-500 transition-all">
                           <TrashIcon />
                        </button>
                     </div>
                   </div>
                 ))
              )}
           </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-200 px-8 md:px-20 py-16 flex flex-col md:flex-row justify-between items-center gap-16 text-center md:text-left">
        <div className="flex items-center gap-6">
           <div className="space-y-5">
              <p className="text-[11px] font-black uppercase tracking-[.5em] text-gray-400 leading-none">Designed & Developed by Kevin Sila</p>
              <p className="text-[13px] font-medium text-gray-400 serif italic opacity-70">"Technology is the bridge, but the human voice is the destination."</p>
           </div>
           <div className="h-12 w-px bg-gray-100 hidden md:block"></div>
           <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${engineReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{engineReady ? 'Engine Active' : 'Setup Required'}</span>
              </div>
              <p className="text-[8px] uppercase tracking-widest font-bold text-gray-300">Origin: {window.location.hostname}</p>
           </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
           <div className="flex gap-8">
             <a href="mailto:kevinsila1002@GMAIL.COM" className="p-5 rounded-full bg-gray-50 text-gray-400 hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                <MailIcon />
             </a>
             <a href="https://wa.me/254717578394" target="_blank" className="p-5 rounded-full bg-gray-50 text-gray-400 hover:bg-green-600 hover:text-white transition-all shadow-sm">
                <WhatsAppIcon />
             </a>
           </div>
           <div className="text-[11px] font-black bg-gray-900 text-white px-8 py-4 rounded-full uppercase tracking-[.2em] shrink-0">High Fidelity Workflow v5.9</div>
        </div>
      </footer>

      {isPlaying && (
        <div className="fixed bottom-10 right-10 bg-gray-900 text-white p-6 rounded-[32px] flex items-center gap-10 shadow-2xl z-[100] animate-in slide-in-from-bottom-10">
           <div className="flex items-center gap-5">
             <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
             <span className="text-[11px] font-black uppercase tracking-[.3em]">Monitoring</span>
           </div>
           <button onClick={() => {sourceRef.current?.stop(); setIsPlaying(false);}} className="text-[11px] font-black px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all uppercase tracking-widest">Terminate</button>
        </div>
      )}
    </div>
  );
}

export default App;