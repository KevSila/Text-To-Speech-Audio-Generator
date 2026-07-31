import React from 'react';
import { BookProfile, BOOK_PROFILES, Platform, RecordingMode } from '../types';
import { Settings, Sparkles, Mic, Users, Info, Radio } from 'lucide-react';

interface HeaderProps {
  activeBook: BookProfile;
  onBookChange: (book: BookProfile) => void;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  recordingMode: RecordingMode;
  onRecordingModeChange: (mode: RecordingMode) => void;
  showSpecs: boolean;
  onToggleSpecs: () => void;
  engineReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeBook,
  onBookChange,
  platform,
  onPlatformChange,
  recordingMode,
  onRecordingModeChange,
  showSpecs,
  onToggleSpecs,
  engineReady,
}) => {
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-xs">
      {/* Left Branding & Book Selector */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-900 text-white rounded-2xl shadow-sm">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none text-gray-900">
              AUDIOBOOK STUDIO
            </h1>
            <p className="text-[9px] uppercase tracking-widest font-black text-amber-600 mt-1 flex items-center gap-1">
              <span>GEMINI 3.1 FLASH TTS</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

        {/* Project Profile Select */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-2xl px-3 py-1.5">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider hidden sm:inline">
            Project:
          </span>
          <select
            className="bg-transparent text-xs font-bold uppercase tracking-wider text-gray-800 focus:ring-0 cursor-pointer outline-none hover:text-amber-700 transition-colors"
            value={activeBook.id}
            onChange={(e) => {
              const b = BOOK_PROFILES.find((p) => p.id === e.target.value);
              if (b) onBookChange(b);
            }}
          >
            {BOOK_PROFILES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle Mode & Engine Selectors */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-center">
        {/* Solo vs Multi-Speaker Mode */}
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => onRecordingModeChange(RecordingMode.SOLO)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              recordingMode === RecordingMode.SOLO
                ? 'bg-white text-gray-900 shadow-sm font-bold scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Solo Narrator
          </button>
          <button
            onClick={() => onRecordingModeChange(RecordingMode.MULTI_SPEAKER)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              recordingMode === RecordingMode.MULTI_SPEAKER
                ? 'bg-indigo-600 text-white shadow-md font-bold scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Multi-Speaker
          </button>
        </div>

        {/* Platform Tier */}
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          {[
            { id: Platform.GEMINI, label: 'Gemini 3.1', sub: 'Native TTS' },
            { id: Platform.ELEVEN_LABS, label: 'ElevenLabs', sub: 'Profiles' },
            { id: Platform.NOTEBOOK_LM, label: 'NotebookLM', sub: 'Vault' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onPlatformChange(p.id)}
              className={`px-3 py-1 rounded-xl transition-all flex flex-col items-center ${
                platform === p.id
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="text-[10px] font-black uppercase leading-none">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Specs & Status Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSpecs}
            className={`p-2 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              showSpecs
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'
            }`}
            title="Toggle Production Notes"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">{showSpecs ? 'Hide Notes' : 'Notes'}</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
              engineReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                engineReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>{engineReady ? 'Engine Active' : 'Connecting'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
