import { startListening, type ListenCtrl } from "./listen.ts";

const DEFAULT_WORD = (import.meta.env.VITE_WAKE_WORD as string) || "jupiter";

export type WakeCtrl = {
  stop(): void;
  isActive(): boolean;
  arm(): void;            // re-arm wake after a command completes
  disarm(): void;         // temporarily ignore wake word
};

export function startWakeWord(
  onCommand: (utterance: string) => void,
  opts?: { word?: string; lang?: string; onHeard?: (text:string, final:boolean)=>void }
): WakeCtrl {
  const word = (opts?.word || DEFAULT_WORD).toLowerCase();

  let armed = true;        // listening for the wake word
  let capturing = false;   // after wake word, capture next final phrase
  let ctrl: ListenCtrl | null = null;
  let lastInterim = "";

  ctrl = startListening((text, final) => {
    opts?.onHeard?.(text, final);
    const norm = text.trim().toLowerCase();

    if (!capturing && armed && final && norm.includes(word)) {
      // Wake detected; capture the NEXT final phrase as the command
      capturing = true;
      armed = false;
      lastInterim = "";
      return;
    }

    if (capturing && final) {
      const cleaned = text.replace(new RegExp(`\\b${word}\\b`, "i"), "").trim();
      if (cleaned) onCommand(cleaned);
      capturing = false;
      // re-arm automatically after a short beat
      setTimeout(()=> armed = true, 300);
      return;
    }

    // Track interim, but don't trigger any UI noise by default
    if (!final) lastInterim = text;
  }, { lang: opts?.lang });

  return {
    stop(){ ctrl?.stop(); },
    isActive(){ return ctrl?.isActive() ?? false; },
    arm(){ armed = true; },
    disarm(){ armed = false; capturing = false; }
  };
}