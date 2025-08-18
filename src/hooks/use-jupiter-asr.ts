import { useState, useRef } from "react";

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string;
const HF_WHISPER_MODEL = "openai/whisper-large-v3";

export function useJupiterASR() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start mic recording
  const startRecording = async () => {
    setIsTranscribing(true);
    setTranscript("");
    setAudioBlob(null);
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      setAudioBlob(audioBlob);
      // Transcribe with HuggingFace
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${HF_WHISPER_MODEL}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HF_TOKEN}`,
            },
            body: audioBlob,
          }
        );
        if (!response.ok) throw new Error("ASR failed");
        const result = await response.json();
        setTranscript(result.text || "");
      } catch (e) {
        setTranscript("");
      }
      setIsTranscribing(false);
    };
    mediaRecorder.start();
  };

  // Stop mic recording
  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  return {
    isTranscribing,
    audioBlob,
    transcript,
    startRecording,
    stopRecording,
  };
}