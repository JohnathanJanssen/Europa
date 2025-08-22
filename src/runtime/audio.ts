export type SilenceCtrl = { stop(): void };

export async function startMicStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone not available");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
}

export function detectSilence(
  stream: MediaStream,
  opts: { threshold?: number; silenceMs?: number; intervalMs?: number },
  onSilence: () => void
): SilenceCtrl {
  const threshold = opts.threshold ?? 0.02;      // lower = more sensitive
  const silenceMs = opts.silenceMs ?? 3000;      // stop after 3s quiet
  const intervalMs = opts.intervalMs ?? 100;

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let quietFor = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(data);

    // RMS energy
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // [-1,1]
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    if (rms < threshold) quietFor += intervalMs;
    else quietFor = 0;

    if (quietFor >= silenceMs) {
      try { onSilence(); } finally { cleanup(); }
      return;
    }
    setTimeout(tick, intervalMs);
  };

  const cleanup = () => {
    stopped = true;
    try { source.disconnect(); } catch {}
    try { analyser.disconnect(); } catch {}
    try { audioCtx.close(); } catch {}
  };

  setTimeout(tick, intervalMs);
  return { stop: cleanup };
}