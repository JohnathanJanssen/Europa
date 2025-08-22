import { pulse } from "../ui/feel";
type SpeakOpts = { rate?: number };
export async function speak(text: string, opts: SpeakOpts = {}){
  const rate = opts.rate ?? 0.82;        // Frieren-like pace
  pulse(1);                               // visual ping
  try{
    if ((window as any).__JUPITER_TTS__) { // if your app set a custom TTS
      await (window as any).__JUPITER_TTS__(text, rate);
      return;
    }
    // Fallback: browser TTS (keeps things alive in dev)
    const synth = (window as any).speechSynthesis;
    if (synth){
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate; synth.speak(u);
      await new Promise(r => u.onend = r);
    }
  } finally {
    setTimeout(()=> pulse(.35), 220);
  }
}