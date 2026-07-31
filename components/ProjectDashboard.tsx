import React from 'react';
import { Platform } from '../types';
import { Settings, Activity, RotateCcw, Sliders, Layers } from 'lucide-react';

interface ProjectDashboardProps {
  chapterTitle: string;
  onChapterTitleChange: (val: string) => void;
  part: string;
  onPartChange: (val: string) => void;
  masterPauseDuration: number;
  onMasterPauseDurationChange: (val: number) => void;
  usage: {
    geminiRequests: number;
    elevenLabsRequests: number;
    notebookRequests: number;
  };
  limits: Record<Platform, number>;
  activePlatform: Platform;
  onResetUsage: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  chapterTitle,
  onChapterTitleChange,
  part,
  onPartChange,
  masterPauseDuration,
  onMasterPauseDurationChange,
  usage,
  limits,
  activePlatform,
  onResetUsage,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Manuscript & Take Metadata */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-600" /> Take Metadata
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 tracking-wider">
              Chapter Title / Section Name
            </label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              value={chapterTitle}
              onChange={(e) => onChapterTitleChange(e.target.value)}
              placeholder="e.g. Chapter 1: The Arrival"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 tracking-wider">
              Take / Part Number
            </label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              value={part}
              onChange={(e) => onPartChange(e.target.value)}
              placeholder="01"
            />
          </div>
        </div>
      </div>

      {/* Master Track Stitching Pause Setting */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" /> Master Track Pause
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold text-gray-700">
            <span>Inter-Take Silence:</span>
            <span className="text-indigo-600 font-black">{masterPauseDuration.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={masterPauseDuration}
            onChange={(e) => onMasterPauseDurationChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <p className="text-[10px] text-gray-400 leading-tight">
            Silence injected between takes when stitching into a single Master Chapter WAV file.
          </p>
        </div>
      </div>

      {/* Engine Capacity Meters */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Engine Capacities
          </h3>
          <button
            onClick={onResetUsage}
            className="text-[9px] font-black text-amber-600 hover:text-amber-800 flex items-center gap-1 uppercase tracking-wider transition-colors"
            title="Reset local usage counter"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {[
          {
            id: Platform.GEMINI,
            label: 'Gemini 3.1 Flash Takes',
            usage: usage.geminiRequests,
            limit: limits[Platform.GEMINI],
            color: 'bg-amber-500',
          },
          {
            id: Platform.ELEVEN_LABS,
            label: 'ElevenLabs Premium Quota',
            usage: usage.elevenLabsRequests,
            limit: limits[Platform.ELEVEN_LABS],
            color: 'bg-indigo-600',
          },
          {
            id: Platform.NOTEBOOK_LM,
            label: 'Vault (NotebookLM) Limit',
            usage: usage.notebookRequests,
            limit: limits[Platform.NOTEBOOK_LM],
            color: 'bg-emerald-600',
          },
        ].map((eng) => (
          <div
            key={eng.id}
            className={`transition-all duration-300 ${
              activePlatform === eng.id
                ? 'p-3 rounded-2xl bg-gray-50/80 border border-gray-200'
                : 'opacity-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1 px-0.5">
              <span className="text-[9px] font-black uppercase text-gray-600 tracking-wider">
                {eng.label}
              </span>
              <span className="text-[10px] font-black text-gray-700">
                {eng.usage}/{eng.limit}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${eng.color} transition-all duration-500`}
                style={{ width: `${Math.min(100, (eng.usage / eng.limit) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
