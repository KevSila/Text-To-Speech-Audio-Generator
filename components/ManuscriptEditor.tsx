import React, { useState } from 'react';
import { Sparkles, FileText, Wand2, Check, AlertCircle, PlayCircle, Tag } from 'lucide-react';
import { ManuscriptAnalysis, RecordingMode } from '../types';

interface ManuscriptEditorProps {
  inputText: string;
  onInputTextChange: (text: string) => void;
  wordCount: number;
  recordingMode: RecordingMode;
  onAnalyzeManuscript: () => Promise<ManuscriptAnalysis | null>;
  isAnalyzing: boolean;
  analysis: ManuscriptAnalysis | null;
  onApplyAnnotatedManuscript: (annotatedText: string) => void;
}

const SAFE_BATCH_WORDS = 1800;
const MAX_BATCH_WORDS = 2200;

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  inputText,
  onInputTextChange,
  wordCount,
  recordingMode,
  onAnalyzeManuscript,
  isAnalyzing,
  analysis,
  onApplyAnnotatedManuscript,
}) => {
  const [showDirectorNotes, setShowDirectorNotes] = useState(false);

  const getSafetyColor = () => {
    if (wordCount <= SAFE_BATCH_WORDS) return 'bg-emerald-500';
    if (wordCount <= MAX_BATCH_WORDS) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const insertTag = (tag: string) => {
    onInputTextChange(inputText ? `${inputText}\n\n${tag} ` : `${tag} `);
  };

  return (
    <div className="bg-white rounded-[36px] shadow-lg shadow-gray-200/50 border border-gray-100 p-6 md:p-10 flex flex-col flex-1 min-h-[500px]">
      {/* Top Bar with Word Count & AI Director Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-amber-600" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            Working Manuscript
          </span>
          <span className="bg-gray-100 text-gray-700 text-[11px] font-black px-3.5 py-1 rounded-full">
            {wordCount.toLocaleString()} words
          </span>
        </div>

        {/* Quick Cues & AI Director */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              const res = await onAnalyzeManuscript();
              if (res) setShowDirectorNotes(true);
            }}
            disabled={isAnalyzing || !inputText.trim()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            {isAnalyzing ? 'Analyzing Script...' : 'AI Director Assistant'}
          </button>
        </div>
      </div>

      {/* Structural Performance Insertion Bar */}
      <div className="mb-4 pb-4 border-b border-gray-100 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black mr-1 flex items-center gap-1">
          <Tag className="w-3 h-3 text-amber-500" /> Cues:
        </span>
        <button
          onClick={() => insertTag('# ')}
          className="px-2.5 py-1 bg-gray-50 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-gray-200/70 text-[10px] uppercase font-black transition-all"
        >
          # Title
        </button>
        <button
          onClick={() => insertTag('## ')}
          className="px-2.5 py-1 bg-gray-50 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-gray-200/70 text-[10px] uppercase font-black transition-all"
        >
          ## Subtitle
        </button>
        <button
          onClick={() => insertTag('> ')}
          className="px-2.5 py-1 bg-gray-50 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-gray-200/70 text-[10px] uppercase font-black transition-all"
        >
          &gt; Reflective Beat
        </button>
        <button
          onClick={() => insertTag('[Pause 2s]')}
          className="px-2.5 py-1 bg-gray-50 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-gray-200/70 text-[10px] uppercase font-black transition-all"
        >
          [Pause 2s]
        </button>
        {recordingMode === RecordingMode.MULTI_SPEAKER && (
          <>
            <button
              onClick={() => insertTag('Narrator:')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-[10px] uppercase font-black transition-all"
            >
              Narrator:
            </button>
            <button
              onClick={() => insertTag('Character:')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-[10px] uppercase font-black transition-all"
            >
              Character:
            </button>
          </>
        )}
      </div>

      {/* AI Director Analysis Drawer / Card */}
      {showDirectorNotes && analysis && (
        <div className="mb-6 p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-3 relative animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-amber-600" /> AI Executive Director Insights
            </h4>
            <button
              onClick={() => setShowDirectorNotes(false)}
              className="text-amber-700 hover:text-amber-900 font-bold text-[10px] uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>

          {analysis.summary && (
            <p className="text-gray-700 font-medium leading-relaxed">{analysis.summary}</p>
          )}

          <div className="grid md:grid-cols-2 gap-3 text-[11px]">
            {analysis.pacingAdvice && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                <span className="font-bold text-amber-900 block mb-1">Pacing Advice:</span>
                <span className="text-gray-600">{analysis.pacingAdvice}</span>
              </div>
            )}
            {analysis.recommendedVoice && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                <span className="font-bold text-amber-900 block mb-1">Recommended Voice:</span>
                <span className="text-gray-800 font-black">{analysis.recommendedVoice}</span>
              </div>
            )}
          </div>

          {analysis.annotatedManuscript && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  if (analysis.annotatedManuscript) {
                    onApplyAnnotatedManuscript(analysis.annotatedManuscript);
                    setShowDirectorNotes(false);
                  }
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs"
              >
                Apply Structural Markup Tags to Editor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Manuscript Textarea */}
      <textarea
        className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg md:text-2xl font-serif italic leading-relaxed placeholder:text-gray-300 custom-scrollbar outline-none pb-6 text-gray-800"
        placeholder={
          recordingMode === RecordingMode.MULTI_SPEAKER
            ? "Format dialogue script like:\n\nNarrator: The autumn evening settled softly over the city.\nCharacter: Are you certain we were not followed?"
            : "Paste your manuscript text here...\n\nUse # for chapter titles, ## for subtitles, and > for reflective pauses."
        }
        value={inputText}
        onChange={(e) => onInputTextChange(e.target.value)}
      />

      {/* Batch Health Monitoring Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
          <span className="text-gray-400">Batch Health Monitoring</span>
          <span className={wordCount > SAFE_BATCH_WORDS ? 'text-amber-600' : 'text-emerald-600'}>
            {wordCount > MAX_BATCH_WORDS ? 'Segment Risk Detected (>2200 words)' : 'Optimal Take Size'}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getSafetyColor()}`}
            style={{ width: `${Math.min((wordCount / MAX_BATCH_WORDS) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
