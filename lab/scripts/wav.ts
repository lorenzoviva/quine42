// Minimal WAV writer for Node (mono, 16 bit), so lab scripts can save what the synthesizer renders.

export function wavOf(samples: Float32Array, sampleRate: number): Buffer {
  const data = samples.length * 2;
  const out = Buffer.alloc(44 + data);
  out.write('RIFF', 0, 'ascii');
  out.writeUInt32LE(36 + data, 4);
  out.write('WAVEfmt ', 8, 'ascii');
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); // PCM
  out.writeUInt16LE(1, 22); // mono
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36, 'ascii');
  out.writeUInt32LE(data, 40);
  for (let i = 0; i < samples.length; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return out;
}
