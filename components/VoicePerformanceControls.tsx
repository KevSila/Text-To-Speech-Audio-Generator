import React from 'react';
import { VoiceName, PLATFORM_VOICES, AudiobookSettings, RecordingMode, SpeakerConfig } from '../types';
import { Volume2, Play, Users, Disc3 } from 'lucide-react';

interface VoicePerformanceControlsProps {
  settings: AudiobookSettings;
  onSettingsChange: (newSettings: AudiobookSettings) => void;
  onPreviewVoice: () => void;
  isPreviewing: boolean;
  cooldown: number;
  isSynthesizing: boolean;
  onSynthesize: () => void;
  inputText: string;
  themeColor?: string;
}

export const VoicePerformanceControls: React.FC<VoicePerformanceControlsProps> = ({
  settings,
  onSettingsChange,
  onPreviewVoice,
  isPreviewing,
  cooldown,
  isSynthesizing,
  onSynthesize,
  inputText,
  themeColor = '#8c7851',
}) => {
  const currentVoices = PLATFORM_VOICES[settings.platform] || [];

  const updateSpeaker = (index: number, key: keyof SpeakerConfig, value: string) => {
    const updated = [...settings.speakers];
    updated[index] = { ...updated[index], [key]: value };
    onSettingsChange({ ...settings, speakers: updated });
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Solo Voice Persona vs Multi-Speaker Config */}
        {settings.mode === RecordingMode.SOLO ? (
          <div className="flex flex-wrap gap-6 items-end flex-1">
            <div className="flex flex-col gap-2 flex-1 min-w-[220px]">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Narrator Voice Persona
              </label>
              <div className="flex items-center gap-3">
                <select
                  className="bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-bold px-4 py-3.5 w-full appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs text-gray-800"
                  value={settings.voice}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, voice: e.target.value as VoiceName })
                  }
                >
                  {currentVoices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onPreviewVoice}
                  disabled={isPreviewing || cooldown > 0}
                  className={`p-3.5 rounded-2xl transition-all active:scale-90 shadow-2xs flex items-center justify-center shrink-0 ${
                    cooldown > 0
                      ? 'bg-rose-50 text-rose-500 cursor-not-allowed border border-rose-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white'
                  }`}
                  title="Audition Voice Sample"
                >
                  {isPreviewing ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin"></div>
                  ) : cooldown > 0 ? (
                    <span className="font-black text-[10px]">{cooldown}s</span>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Narrative Tempo
              </label>
              <select
                className="bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-bold px-4 py-3.5 outline-none cursor-pointer shadow-2xs text-gray-800 focus:ring-2 focus:ring-amber-500/20"
                value={settings.speed.toFixed(2)}
                onChange={(e) =>
                  onSettingsChange({ ...settings, speed: parseFloat(e.target.value) })
                }
              >
                <option value="0.80">0.80x Slow / Dramatic</option>
                <option value="0.95">0.95x Reflective / Standard</option>
                <option value="1.00">1.00x Natural Pace</option>
                <option value="1.20">1.20x Fast / Concise</option>
              </select>
            </div>
          </div>
        ) : (
          /* Multi-Speaker Dialogue Setup */
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2 text-indigo-700 font-black text-[11px] uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-600" /> Multi-Speaker Audio Recording Setup
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[10px] font-black text-indigo-900 uppercase block">
                  Speaker 1 (e.g. Narrator)
                </span>
                <input
                  type="text"
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                  value={settings.speakers[0]?.name || 'Narrator'}
                  onChange={(e) => updateSpeaker(0, 'name', e.target.value)}
                  placeholder="Speaker Name"
                />
                <select
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                  value={settings.speakers[0]?.voice || VoiceName.ZEPHYR}
                  onChange={(e) => updateSpeaker(0, 'voice', e.target.value as VoiceName)}
                >
                  {currentVoices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[10px] font-black text-indigo-900 uppercase block">
                  Speaker 2 (e.g. Character)
                </span>
                <input
                  type="text"
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                  value={settings.speakers[1]?.name || 'Character'}
                  onChange={(e) => updateSpeaker(1, 'name', e.target.value)}
                  placeholder="Speaker Name"
                />
                <select
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                  value={settings.speakers[1]?.voice || VoiceName.PUCK}
                  onChange={(e) => updateSpeaker(1, 'voice', e.target.value as VoiceName)}
                >
                  {currentVoices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Primary Record Button */}
        <button
          disabled={isSynthesizing || !inputText.trim() || cooldown > 0}
          onClick={onSynthesize}
          className={`w-full md:w-auto px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
            isSynthesizing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : cooldown > 0
              ? 'bg-rose-50 text-rose-500 border border-rose-200 cursor-not-allowed'
              : 'text-white hover:brightness-110 shadow-gray-200 hover:-translate-y-0.5'
          }`}
          style={{
            backgroundColor:
              !isSynthesizing && cooldown <= 0
                ? settings.mode === RecordingMode.MULTI_SPEAKER
                  ? '#4f46e5'
                  : themeColor
                : undefined,
          }}
        >
          {isSynthesizing ? (
            <>
              <Disc3 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Synthesizing Audio Take...</span>
            </>
          ) : cooldown > 0 ? (
            <span>Cooldown Active ({cooldown}s)</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>
                {settings.mode === RecordingMode.MULTI_SPEAKER
                  ? 'Record Dialogue Take'
                  : 'Record Narrative Take'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
