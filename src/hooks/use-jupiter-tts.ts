import { useState } from "react";

export function useJupiterTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // TODO: Integrate with ElevenLabs or TTS API

  const speak = (audioUrl: string) => {
    setIsSpeaking(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  };

  return {
    isSpeaking,
    speak,
  };
}