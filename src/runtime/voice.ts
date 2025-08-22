import { pulse } from "../ui/feel";
export type SpeakOpts = { rate?: number };
export async function speak(text:string, opts:SpeakOpts={}){
  const rate = opts.rate ?? 0.82; // calm/Frieren
  pulse(1);
  try{
    // If an app-specific TTS exists, use it.
    if ((window as any).__JUPITER_TTS__) {
      await (window as any).__JUPITER_TTS__(text, rate);
      return;
    }
    // Fallback: browser TTS
    const synth=(window as any).speechSynthesis;
    if (synth){
      const u=new SpeechSynthesisUtterance(text); u.rate=rate;
      await new Promise<void>(res=>{ u.onend=()=>res(); synth.speak(u); });
    }
  } finally { setTimeout(()=>pulse(.35),220); }
}
// Expose a global for any legacy call sites
;(window as any).__JUPITER_SPEAK__ = speak;