
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TTSService } from './services/ttsService';
import { VoiceName, AudiobookChunk, AudiobookSettings, BOOK_PROFILES, BookProfile, Platform, PLATFORM_VOICES } from './types';
import { audioBufferToWav } from './utils/audioUtils';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const VolumeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.4 8.38 8.38 0 0 1 3.8.9L21 4.25z"/></svg>;

// Constant Limits
const GEMINI_REQ_LIMIT = 1500; 
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
  
  const [metadata, setMetadata] = useState({
    chapterTitle: 'Chapter 1',
    part: '01'
  });

  const [usage, setUsage] = useState({
    geminiRequests: 0,
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
  const currentCharCount = inputText.length;

  useEffect(() => {
    const savedUsage = localStorage.getItem('studio_usage_v4.2');
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      if (parsed.lastResetDate !== new Date().toLocaleDateString()) {
        setUsage({ geminiRequests: 0, lastResetDate: new Date().toLocaleDateString() });
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

  const handleSynthesize = async () => {
    if (!inputText.trim() || !ttsRef.current) return;
    if (usage.geminiRequests >= GEMINI_REQ_LIMIT) {
      alert("Daily limit reached."); return;
    }

    setIsSynthesizing(true);
    try {
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
      setUsage(prev => {
        const next = { ...prev, geminiRequests: prev.geminiRequests + 1 };
        localStorage.setItem('studio_usage_v4.2', JSON.stringify(next));
        return next;
      });
      setInputText('');
      
      const nextPartNum = parseInt(metadata.part) + 1;
      setMetadata(prev => ({ ...prev, part: nextPartNum.toString().padStart(2, '0') }));
    } catch (err) {
      console.error(err);
      alert("Synthesis encountered an error.");
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
    
    // NOMENCLATURE: BOOK NAME_CHAPTER TITLE_PART.wav
    const fileName = `${chunk.metadata.bookTitle.toUpperCase()}_${chunk.metadata.chapterTitle.toUpperCase()}_${chunk.metadata.part}.wav`.replace(/\s+/g, '_');
    
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
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

  const getSafetyColor = () => {
    if (currentWordCount <= SAFE_BATCH_WORDS) return 'bg-green-500';
    if (currentWordCount <= MAX_BATCH_WORDS) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#1a1a1a] flex flex-col font-sans overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter">KEV SILA STUDIO</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">TEXT TO SPEECH GENERATOR</p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden md:block"></div>
          <select 
            className="bg-transparent border-none text-xs md:text-sm font-bold uppercase tracking-wider text-gray-600 focus:ring-0 cursor-pointer outline-none"
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

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
            {[
              { id: Platform.GEMINI, label: 'Standard', sub: 'Gemini 1.5' },
              { id: Platform.ELEVEN_LABS, label: 'Premium', sub: 'ElevenLabs' },
              { id: Platform.NOTEBOOK_LM, label: 'Vault', sub: 'NotebookLM' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSettings({...settings, platform: p.id, voice: PLATFORM_VOICES[p.id][0]})}
                className={`px-3 md:px-5 py-2 rounded-lg transition-all flex flex-col items-center min-w-[90px] ${
                  settings.platform === p.id ? 'bg-white shadow-sm scale-105 border border-gray-100' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{p.label}</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">{p.sub}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowSpecs(!showSpecs)}
            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-3 shrink-0"
          >
            {showSpecs ? 'HIDE INFO' : 'STUDIO SPECS'}
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* Sidebar Left: Project Tools */}
        <aside className="w-full lg:w-72 flex flex-col gap-6 order-2 lg:order-1">
          {/* Dashboard Meta */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
              <SettingsIcon /> Project Dashboard
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1.5">Chapter Title / Section</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-gray-200 outline-none" 
                  value={metadata.chapterTitle} 
                  onChange={e => setMetadata({...metadata, chapterTitle: e.target.value})}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                   <label className="text-[9px] font-bold uppercase text-gray-400">File Part (Take)</label>
                   <div className="group relative">
                      <InfoIcon />
                      <div className="absolute left-full ml-3 -top-10 w-56 bg-gray-800 text-white text-[9px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 leading-relaxed border border-gray-700">
                         <strong>Sequential Recording:</strong> AI models perform best in takes under 2000 words. Use "Parts" (e.g. 01, 02) to track the segments of a single chapter for final assembly.
                      </div>
                   </div>
                </div>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold" 
                  value={metadata.part} 
                  onChange={e => setMetadata({...metadata, part: e.target.value})} 
                />
              </div>
              <div className="pt-3 border-t border-gray-50">
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mb-1">Live Filename Preview:</p>
                 <p className="text-[10px] text-amber-700 font-mono font-medium break-all bg-amber-50/50 p-2 rounded-lg">
                    {activeBook.title.toUpperCase()}_{metadata.chapterTitle.toUpperCase().replace(/\s+/g, '_')}_{metadata.part}.wav
                 </p>
              </div>
            </div>
          </div>

          {/* Script Guide */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
              <ActivityIcon /> Performance Guide
            </h3>
            <div className="space-y-4">
              {[
                { s: '#', d: 'Main Title (Resonant)' },
                { s: '###', d: 'Chapter Start (Energetic)' },
                { s: '>', d: 'Reflective prompt (Slow)' },
                { s: '[]', d: 'Wisdom Card (Warm)' }
              ].map(item => (
                <div key={item.s} className="flex items-center gap-3">
                   <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-black text-gray-600">{item.s}</span> 
                   <span className="text-[10px] text-gray-500 font-medium leading-none">{item.d}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quota Tracking */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-auto">
             <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">GEMINI CAPACITY</span>
                <span className="text-[9px] font-black text-gray-600">{usage.geminiRequests}/{GEMINI_REQ_LIMIT}</span>
             </div>
             <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 transition-all duration-1000" style={{ width: `${(usage.geminiRequests/GEMINI_REQ_LIMIT)*100}%` }} />
             </div>
          </div>
        </aside>

        {/* Center: Editor & Engine */}
        <section className="flex-1 flex flex-col gap-6 order-1 lg:order-2">
          {showSpecs && (
            <div className="bg-white p-6 md:p-10 rounded-[40px] border-2 border-dashed border-gray-100 animate-in slide-in-from-top-6 duration-700 shadow-sm">
               <h2 className="text-xs font-black uppercase tracking-[.4em] mb-6 flex items-center gap-3 text-gray-900">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Studio Onboarding
               </h2>
               <div className="grid md:grid-cols-2 gap-10 text-[12px] leading-relaxed text-gray-500">
                  <div className="space-y-4">
                    <p className="font-bold text-gray-900 uppercase text-[10px] tracking-widest">Universal Production Suite</p>
                    <p>Welcome to the Kev Sila TTS Studio—a professional-grade workstation that transforms written scripts into high-fidelity audio. Whether you are generating technical docs or soulful audiobooks, our studio adapts to your vision.</p>
                    <p className="font-bold text-gray-900 uppercase text-[10px] tracking-widest pt-2">Multi-Platform Ecosystem</p>
                    <p>Seamlessly switch between <strong>Gemini</strong> for bulk recording, <strong>ElevenLabs</strong> for premium emotional depth, and <strong>Vault</strong> for analytical summaries. Each engine is tuned for accuracy and speed.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="font-bold text-gray-900 uppercase text-[10px] tracking-widest">Workflow Mastery</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Select your <strong>Book/Project Profile</strong> for stylistic consistency.</li>
                      <li>Use the <strong>Script Performance Guide</strong> to insert pauses and vocal shifts.</li>
                      <li>Monitor the <strong>Batch Health</strong> meter to ensure segments stay under the optimal 2,000-word limit.</li>
                    </ol>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-50 p-6 md:p-12 flex flex-col flex-1 min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
               <span className="text-[10px] font-black uppercase tracking-[.2em] text-gray-300">Active Manuscript</span>
               <div className="flex gap-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="bg-gray-50 px-3 py-1 rounded-full">{currentWordCount.toLocaleString()} words</span>
               </div>
            </div>

            <textarea 
              className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-xl md:text-3xl font-serif italic leading-relaxed placeholder:text-gray-100 custom-scrollbar outline-none"
              placeholder="Start your narrative take here..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />

            {/* Health Meter */}
            <div className="mt-10 pt-8 border-t border-gray-50">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                 <span>Batch Health Meter</span>
                 <span className={currentWordCount > SAFE_BATCH_WORDS ? 'text-amber-600' : 'text-green-500'}>
                    {currentWordCount > MAX_BATCH_WORDS ? 'Segment Risk' : 'Optimal Segment'}
                 </span>
               </div>
               <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                 <div className={`h-full transition-all duration-700 ${getSafetyColor()}`} style={{ width: `${Math.min((currentWordCount / MAX_BATCH_WORDS) * 100, 100)}%` }} />
               </div>
            </div>

            {/* Controls */}
            <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
               <div className="flex flex-wrap gap-6 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Narrator Vocal Profile</label>
                    <div className="flex items-center gap-3">
                      <select 
                        className="bg-gray-50 border-none rounded-2xl text-[12px] font-bold px-5 py-4 min-w-[160px] appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-gray-100 transition-all"
                        value={settings.voice}
                        onChange={e => setSettings({...settings, voice: e.target.value as VoiceName})}
                      >
                        {PLATFORM_VOICES[settings.platform].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <button 
                        onClick={async () => {
                          setIsPreviewing(true);
                          const b = await ttsRef.current?.previewVoice(settings.voice);
                          if(b) playBuffer(b);
                          setIsPreviewing(false);
                        }} 
                        disabled={isPreviewing}
                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all active:scale-90"
                      >
                        {isPreviewing ? <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div> : <VolumeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Narrative Pace</label>
                    <select 
                      className="bg-gray-50 border-none rounded-2xl text-[12px] font-bold px-5 py-4 min-w-[130px] outline-none cursor-pointer focus:ring-2 focus:ring-gray-100 transition-all"
                      value={settings.speed.toFixed(2)}
                      onChange={e => setSettings(prev => ({...prev, speed: parseFloat(e.target.value)}))}
                    >
                      <option value="0.80">0.80x Slow</option>
                      <option value="0.95">0.95x Reflective</option>
                      <option value="1.00">1.00x Natural</option>
                      <option value="1.20">1.20x Rapid</option>
                    </select>
                  </div>
               </div>

               <button 
                 disabled={isSynthesizing || !inputText.trim()}
                 onClick={handleSynthesize}
                 className={`w-full md:w-auto px-16 py-6 rounded-full font-black uppercase tracking-[.3em] text-[10px] transition-all shadow-2xl active:scale-95 ${
                   isSynthesizing ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'text-white hover:brightness-110 shadow-gray-200 hover:-translate-y-1'
                 }`}
                 style={{ backgroundColor: !isSynthesizing ? activeBook.themeColor : undefined }}
               >
                 {isSynthesizing ? 'SYNTHESIZING...' : `Record Narrative Take`}
               </button>
            </div>
          </div>
        </section>

        {/* Right: History */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 order-3">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-gray-400">Master Session</h3>
              <span className="text-[10px] font-black bg-white border border-gray-100 px-3 py-1 rounded-full">{chunks.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 max-h-[600px] lg:max-h-none custom-scrollbar pb-10">
              {chunks.length === 0 ? (
                 <div className="py-24 text-center opacity-20 border-4 border-dotted border-gray-200 rounded-[40px]">
                   <p className="text-[10px] font-black uppercase tracking-widest">No Narrative Takes</p>
                 </div>
              ) : (
                 chunks.map(c => (
                   <div key={c.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 hover:shadow-xl transition-all group relative">
                     <p className="text-[11px] italic font-serif text-gray-500 line-clamp-1 mb-3 leading-snug">"{c.text}"</p>
                     <div className="flex items-center justify-between text-[9px] font-black text-gray-300 uppercase mb-5 tracking-widest">
                       <span className="bg-gray-50 px-3 py-1 rounded-lg text-gray-400">{c.metadata?.chapterTitle} Take {c.metadata?.part}</span>
                       <span>{c.duration.toFixed(1)}s</span>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => c.audioBuffer && playBuffer(c.audioBuffer)} className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl flex justify-center transition-all active:scale-95">
                           <PlayIcon />
                        </button>
                        <button onClick={() => handleDownload(c)} className="p-3.5 bg-gray-50 hover:bg-amber-600 hover:text-white rounded-2xl text-gray-400 transition-all active:scale-95">
                           <DownloadIcon />
                        </button>
                        <button onClick={() => setChunks(prev => prev.filter(x => x.id !== c.id))} className="p-3.5 text-gray-100 hover:text-red-500 transition-all">
                           <TrashIcon />
                        </button>
                     </div>
                   </div>
                 ))
              )}
           </div>
        </aside>
      </main>

      {/* Footer Design */}
      <footer className="bg-white border-t border-gray-200 px-6 md:px-12 py-12 md:py-16 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
        <div className="space-y-4">
           <p className="text-[10px] font-black uppercase tracking-[.4em] text-gray-400 leading-none">Developed & Mastered by Kevin Sila</p>
           <p className="text-[11px] font-medium text-gray-300 max-w-sm leading-relaxed serif italic">"Technology is the bridge, but the human voice is the destination." <br/> — K.S. © 2025 All Rights Reserved.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
           <div className="flex gap-6">
             <a href="mailto:kevinsila1002@GMAIL.COM" title="Email Kev" className="p-4 rounded-full bg-gray-50 text-gray-400 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                <MailIcon />
             </a>
             <a href="https://wa.me/254717578394" target="_blank" rel="noopener noreferrer" title="WhatsApp Kev" className="p-4 rounded-full bg-gray-50 text-gray-400 hover:bg-green-500 hover:text-white transition-all shadow-sm">
                <WhatsAppIcon />
             </a>
           </div>
           <div className="text-[10px] font-black bg-gray-900 text-white px-6 py-3 rounded-full uppercase tracking-tighter shrink-0 shadow-lg">High Fidelity Workflow v4.2</div>
        </div>
      </footer>

      {isPlaying && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white p-5 rounded-[32px] flex items-center gap-8 shadow-2xl z-[100] animate-in zoom-in-95 duration-300">
           <div className="flex items-center gap-4">
             <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]"></div>
             <span className="text-[10px] font-black uppercase tracking-[.2em]">Studio Monitoring</span>
           </div>
           <button onClick={() => {sourceRef.current?.stop(); setIsPlaying(false);}} className="text-[10px] font-black px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">TERMINATE PLAYBACK</button>
        </div>
      )}
    </div>
  );
}

export default App;
