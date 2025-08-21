let playing: HTMLAudioElement | null = null;
let utter: SpeechSynthesisUtterance | null = null;

const XI_KEY   = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const XI_VOICE = import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined;

export async function speak(text: string): Promise<void> {
  if (playing) { playing.pause(); playing.src=''; playing=null; }
  if (utter) { speechSynthesis.cancel(); utter=null; }

  if (XI_KEY && XI_VOICE) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${XI_VOICE}`, {
      method:'POST',
      headers:{ 'xi-api-key': XI_KEY, 'Content-Type':'application/json', 'Accept':'audio/mpeg' },
      body: JSON.stringify({ text, model_id:'eleven_monolingual_v1', voice_settings:{ stability:0.4, similarity_boost:0.85 }})
    });
    if (!r.ok) throw new Error(await r.text());
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    playing = new Audio(url);
    await playing.play();
    return;
  }
  utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}