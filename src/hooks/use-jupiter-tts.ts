import { useState } from "react";

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string;
const SASHA_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Sasha's ElevenLabs voice ID

export function useJupiterTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Synthesize speech using ElevenLabs API
  const speak = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${SASHA_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (e) {
      setIsSpeaking(false);
      // Optionally: show error toast
    }
  };

  return {
    isSpeaking,
    speak,
  };
}