import React, { useMemo } from 'react';
import { getWaveformData } from '../utils/audioUtils';

interface WaveformVisualizerProps {
  audioBuffer?: AudioBuffer;
  isPlaying?: boolean;
  color?: string;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioBuffer,
  isPlaying = false,
  color = '#4f46e5',
  height = 36,
}) => {
  const peaks = useMemo(() => {
    if (!audioBuffer) {
      // Fallback pseudo waveform if buffer is still processing
      return Array.from({ length: 40 }, () => Math.random() * 0.4 + 0.1);
    }
    return getWaveformData(audioBuffer, 40);
  }, [audioBuffer]);

  return (
    <div className="flex items-center gap-1 w-full h-[36px] px-1 py-1 bg-gray-50/80 rounded-xl border border-gray-100 overflow-hidden">
      {peaks.map((peak, idx) => {
        const heightPct = Math.max(12, Math.min(100, peak * 100));
        return (
          <div
            key={idx}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              height: `${heightPct}%`,
              backgroundColor: isPlaying ? color : '#cbd5e1',
              opacity: isPlaying ? (idx % 2 === 0 ? 1 : 0.75) : 0.6,
            }}
          />
        );
      })}
    </div>
  );
};
