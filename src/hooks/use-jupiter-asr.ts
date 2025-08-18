import { useState } from "react";

export function useJupiterASR() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  // TODO: Integrate with Whisper/ASR API

  const startRecording = () => {
    setIsTranscribing(true);
    // TODO: Start mic recording
  };

  const stopRecording = async () => {
    setIsTranscribing(false);
    // TODO: Stop mic, set audioBlob, set transcript
  };

  return {
    isTranscribing,
    audioBlob,
    transcript,
    startRecording,
    stopRecording,
  };
}