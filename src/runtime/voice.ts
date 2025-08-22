import { pulse } from "../ui/feel";

type SpeakOpts = { rate?: number };
export async function speak(text: string, opts: SpeakOpts = {}){
  // default to a Frieren-like calm pace
  const rate = opts.rate ?? 0.82;
  const pitch = 0.95;

  try {
    pulse(1); // start
    // @ts-ignore
    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = pitch;
      u.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  } catch(e) {
    // fail silent
  } finally {
    setTimeout(() => pulse(0.35), 220); // gentle tail
  }
}