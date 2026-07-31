
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Ensure we are working with a valid length for 16-bit PCM
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const frameCount = (data.byteLength / 2) / numChannels;
  
  if (frameCount <= 0) {
    throw new Error("Invalid audio data length received from engine.");
  }

  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Read 16-bit signed little-endian PCM samples
      const sampleIndex = (i * numChannels + channel) * 2;
      if (sampleIndex + 1 < data.byteLength) {
        channelData[i] = dataView.getInt16(sampleIndex, true) / 32768.0;
      }
    }
  }
  return buffer;
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferWav = new ArrayBuffer(length);
  const view = new DataView(bufferWav);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; 
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferWav], { type: "audio/wav" });
}

export function stitchAudioBuffers(
  buffers: AudioBuffer[],
  ctx: AudioContext,
  pauseDurationSec: number = 1.0
): AudioBuffer {
  if (buffers.length === 0) {
    return ctx.createBuffer(1, 1, 24000);
  }

  const sampleRate = buffers[0].sampleRate;
  const numChannels = buffers[0].numberOfChannels;
  const pauseSamples = Math.floor(sampleRate * pauseDurationSec);

  let totalSamples = 0;
  buffers.forEach((b, idx) => {
    totalSamples += b.length;
    if (idx < buffers.length - 1) {
      totalSamples += pauseSamples;
    }
  });

  const outputBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const outputData = outputBuffer.getChannelData(channel);
    let offset = 0;

    buffers.forEach((b, idx) => {
      const channelData = b.getChannelData(Math.min(channel, b.numberOfChannels - 1));
      outputData.set(channelData, offset);
      offset += b.length;

      if (idx < buffers.length - 1) {
        // Leave pauseSamples as zero (silence)
        offset += pauseSamples;
      }
    });
  }

  return outputBuffer;
}

export function getWaveformData(buffer: AudioBuffer, samplesCount: number = 60): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / samplesCount);
  const peaks: number[] = [];

  for (let i = 0; i < samplesCount; i++) {
    const start = i * step;
    let max = 0;
    for (let j = 0; j < step; j++) {
      const val = Math.abs(data[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  return peaks;
}

