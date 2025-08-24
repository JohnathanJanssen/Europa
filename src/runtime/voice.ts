// A small, self-contained speech helper with natural pacing.
// Uses Web Speech API by default (no keys), queues utterances, prevents overlaps.

let speaking = false;
let lastUtterance: SpeechSynthesisUtterance | null = null;
const q: string[] = [];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer calm, US/GB female voices if present; otherwise first available.
  const preferred = ["en-US", "en-GB"];
  const nameHints = ["Female", "Jenny", "Samantha", "Serena", "Joanna", "Aria", "Nova"];
  const scored = voices
    .map(v => {
      let score = 0;
      if (preferred.some(p => v.lang?.startsWith(p))) score += 2;
      if (nameHints.some(h => v.name?.toLowerCase().includes(h.toLowerCase()))) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);
  return (scored[0]?.v || voices[0] || null);
}

export function cancelSpeak() {
  window.speechSynthesis.cancel();
  speaking = false;
  lastUtterance = null;
  q.length = 0;
}

async function play(text: string): Promise<void> {
  // Ensure voices are loaded (some browsers fill asynchronously)
  if (window.speechSynthesis.getVoices().length === 0) {
    await new Promise<void>(res => {
      const id = setInterval(() => {
        if (window.speechSynthesis.getVoices().length > 0) {
          clearInterval(id); res();
        }
      }, 100);
      setTimeout(() => { clearInterval(id); res(); }, 1500);
    });
  }

  return new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    lastUtterance = u;

    // Frieren-like pace: slower, calm, slightly lower pitch
    u.rate = 0.82;   // ← main knob
    u.pitch = 0.95;
    u.volume = 1.0;

    const v = pickVoice();
    if (v) u.voice = v;

    u.onend = () => { speaking = false; resolve(); };
    u.onerror = () => { speaking = false; resolve(); };

    speaking = true;
    window.speechSynthesis.speak(u);
  });
}

export async function speak(text: string): Promise<void> {
  if (!text || !text.trim()) return;
  q.push(text.trim());

  // If already speaking, let the queue drain naturally
  if (speaking) return;

  while (q.length > 0) {
    const next = q.shift()!;
    await play(next);
  }
}

// Optional helper for immediate prompts (e.g., identity request in Vision)
export async function speakNow(text: string): Promise<void> {
  cancelSpeak();
  await speak(text);
}