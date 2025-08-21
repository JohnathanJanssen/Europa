export type ListenCtrl = { stop(): void; isActive(): boolean };

export function startListening(
  onText: (text: string, final: boolean) => void,
  opts?: { lang?: string }
): ListenCtrl {
  const SR: any =
    (window as any).webkitSpeechRecognition ||
    (window as any).SpeechRecognition;
  if (!SR) {
    console.warn("[stt] SpeechRecognition not available in this browser");
    return { stop() {}, isActive() { return false; } };
  }

  const rec = new SR();
  rec.lang = opts?.lang || (navigator.language || "en-US");
  rec.continuous = true;
  rec.interimResults = true;

  let stopped = false;

  rec.onresult = (e: any) => {
    let finalChunk = "";
    let interimChunk = "";

    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const txt = res[0]?.transcript || "";
      if (res.isFinal) finalChunk += txt;
      else interimChunk += txt;
    }
    if (interimChunk.trim()) onText(interimChunk.trim(), false);
    if (finalChunk.trim()) onText(finalChunk.trim(), true);
  };

  rec.onerror = (ev: any) => {
    console.warn("[stt] error", ev?.error || ev);
  };

  rec.onend = () => {
    // Chrome/Safari will end recognition periodically.
    if (!stopped) {
      try { rec.start(); } catch {}
    }
  };

  try { rec.start(); } catch {}

  return {
    stop() { stopped = true; try { rec.stop(); } catch {} },
    isActive() { return !stopped; }
  };
}