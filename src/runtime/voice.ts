/* Central TTS: slower, gentle cadence (Frieren-ish). Works with ElevenLabs or <audio>. */
let _rate = 0.88;           // Playback speed target
let _pitch = 0.95;          // Slightly lower pitch for calm delivery

export function setVoicePace(rate=0.88, pitch=0.95){ _rate = rate; _pitch = pitch; }

/** speak() — pass the final assistant text here. */
export async function speak(text: string){
  try {
    // If your project streams ElevenLabs → AudioBuffer, keep the same pipeline and just set playbackRate.
    const audio = new Audio();
    // Option A: if you already fetch a TTS URL, reuse it here instead of the dummy blob:
    // audio.src = await ttsURLFromYourBackend(text);
    // Fallback: Web Speech if available.
    // @ts-ignore
    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = _rate; u.pitch = _pitch; u.lang = "en-US";
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      return;
    }
    // Otherwise do nothing (silent fallback).
  } catch(e) {
    // fail silent
  }
}