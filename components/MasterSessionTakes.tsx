import React from 'react';
import { AudiobookChunk } from '../types';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Play, Pause, Download, Trash2, Layers, ArrowUp, ArrowDown, Music } from 'lucide-react';

interface MasterSessionTakesProps {
  chunks: AudiobookChunk[];
  currentlyPlayingId: string | null;
  onPlayChunk: (chunk: AudiobookChunk) => void;
  onStopChunk: () => void;
  onDownloadChunk: (chunk: AudiobookChunk) => void;
  onDeleteChunk: (id: string) => void;
  onStitchAndExportMasterTrack: () => void;
  isStitching: boolean;
  onMoveChunkUp: (idx: number) => void;
  onMoveChunkDown: (idx: number) => void;
}

export const MasterSessionTakes: React.FC<MasterSessionTakesProps> = ({
  chunks,
  currentlyPlayingId,
  onPlayChunk,
  onStopChunk,
  onDownloadChunk,
  onDeleteChunk,
  onStitchAndExportMasterTrack,
  isStitching,
  onMoveChunkUp,
  onMoveChunkDown,
}) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header & Stitch Export Master Track */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-600" /> Master Session Takes
          </h3>
          <span className="text-[11px] font-black bg-white border border-gray-200 px-3 py-1 rounded-full shadow-2xs text-gray-700">
            {chunks.length} {chunks.length === 1 ? 'Take' : 'Takes'}
          </span>
        </div>

        {/* Export Stitched Master Track Button */}
        {chunks.length > 0 && (
          <button
            onClick={onStitchAndExportMasterTrack}
            disabled={isStitching}
            className="w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              {isStitching ? 'Stitching Audio Track...' : 'Export Stitched Master Chapter (.wav)'}
            </span>
          </button>
        )}
      </div>

      {/* List of Recorded Takes */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[650px] custom-scrollbar pb-12">
        {chunks.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl p-6 bg-white/50">
            <Music className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
              No Recorded Takes
            </p>
            <p className="text-[10px] text-gray-400 mt-1 leading-normal">
              Type or paste script in the manuscript editor and click Record to generate audio.
            </p>
          </div>
        ) : (
          chunks.map((c, idx) => {
            const isPlaying = currentlyPlayingId === c.id;

            return (
              <div
                key={c.id}
                className={`bg-white p-5 rounded-3xl shadow-xs border transition-all duration-300 flex flex-col gap-3 relative ${
                  isPlaying
                    ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-md'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Take Metadata Header */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/50">
                    {c.metadata?.chapterTitle || 'Chapter'} • Part {c.metadata?.part || '01'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{c.duration.toFixed(1)}s</span>
                    {/* Re-order buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onMoveChunkUp(idx)}
                        disabled={idx === 0}
                        className="p-1 hover:text-gray-900 disabled:opacity-20 text-gray-400"
                        title="Move take up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onMoveChunkDown(idx)}
                        disabled={idx === chunks.length - 1}
                        className="p-1 hover:text-gray-900 disabled:opacity-20 text-gray-400"
                        title="Move take down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Excerpt text */}
                <p className="text-xs italic font-serif text-gray-600 line-clamp-2 leading-relaxed">
                  "{c.text}"
                </p>

                {/* Waveform Visualization */}
                <WaveformVisualizer audioBuffer={c.audioBuffer} isPlaying={isPlaying} />

                {/* Take Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => (isPlaying ? onStopChunk() : onPlayChunk(c))}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      isPlaying
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play Take'}</span>
                  </button>

                  <button
                    onClick={() => onDownloadChunk(c)}
                    className="p-2.5 bg-gray-100 text-gray-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all active:scale-95"
                    title="Download WAV File"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteChunk(c.id)}
                    className="p-2.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                    title="Delete Take"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
