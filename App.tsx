
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

function App() {
  const [activeBook, setActiveBook] = useState<BookProfile>(BOOK_PROFILES[0]);
  const [inputText, setInputText] = useState('');
  const [chunks, setChunks] = useState<AudiobookChunk[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<AudiobookSettings>({
    voice: BOOK_PROFILES[0].defaultVoice,
    speed: 1.0, // Defaulting to normal speed
    paragraphPause: 2.0
  });

  const ttsRef = useRef<TTSService | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      ttsRef.current = new TTSService(process.env.API_KEY);
    }
  }, []);

  const handleBookChange = (bookId: string) => {
    const book = BOOK_PROFILES.find(b => b.id === bookId);
    if (book) {
      setActiveBook(book);
      // We update the voice to match the book theme, but we keep the user's selected speed
      setSettings(prev => ({ ...prev, voice: book.defaultVoice }));
    }
  };

  const handleSynthesize = async () => {
    if (!inputText.trim() || !ttsRef.current) return;
    
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
        text: inputText.slice(0, 80) + (inputText.length > 80 ? '...' : ''),
        timestamp: Date.now(),
        audioBuffer: buffer,
        duration: buffer.duration
      };

      setChunks(prev => [newChunk, ...prev]);
      setInputText('');
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
    anchor.download = `Audio_Take_${new Date(chunk.timestamp).getTime()}.wav`;
    anchor.click();
    URL.revokeObjectURL(url);
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
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        {/* Editor Section */}
        <section className="flex-1 p-6 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif italic text-gray-800">Manuscript Script</h2>
              <span className="text-sm text-gray-400 font-mono">{inputText.length} characters</span>
            </div>
            <textarea
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-xl leading-relaxed placeholder:italic placeholder:text-gray-300 font-serif"
              placeholder="Paste the text you want narrated here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="mt-6 flex flex-wrap items-center justify-between gap-6 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap gap-6">
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Narrator Voice</label>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50 outline-none cursor-pointer"
                        value={settings.voice}
                        onChange={(e) => setSettings({...settings, voice: e.target.value as VoiceName})}
                    >
                        <option value={VoiceName.CHARON}>Charon (Elderly Deep)</option>
                        <option value={VoiceName.ZEPHYR}>Zephyr (Calm Narrator)</option>
                        <option value={VoiceName.KORE}>Kore (Professional Female)</option>
                        <option value={VoiceName.FENRIR}>Fenrir (Rich Male)</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Speed Multiplier</label>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50 outline-none cursor-pointer"
                        value={settings.speed.toString()}
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
                disabled={isSynthesizing || !inputText.trim()}
                className={`px-10 py-4 rounded-full font-bold transition-all shadow-xl flex items-center gap-3 text-white ${
                  isSynthesizing || !inputText.trim() 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'hover:scale-105 active:scale-95'
                }`}
                style={{ backgroundColor: !isSynthesizing && inputText.trim() ? activeBook.themeColor : undefined }}
              >
                {isSynthesizing ? 'Synthesizing...' : 'Start Narrating'}
              </button>
            </div>
          </div>
        </section>

        {/* Chunks Sidebar */}
        <aside className="w-full lg:w-[450px] p-6 lg:border-l border-gray-200 flex flex-col gap-4 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs tracking-tighter">Generated Master Takes</h3>
            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">{chunks.length} Saved</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
            {chunks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 opacity-40 border-2 border-dashed border-gray-300 rounded-3xl">
                <p className="text-sm italic">Generate audio to see takes here.</p>
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
        <p className="text-[11px] font-bold uppercase tracking-wide">
          Kev Sila Text to Speech Audio Generator
        </p>
        <p className="text-[11px] font-bold text-gray-300 uppercase">WAV High-Fidelity Export Enabled</p>
      </footer>
    </div>
  );
}

export default App;
