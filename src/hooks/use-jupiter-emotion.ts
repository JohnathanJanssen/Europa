import { useState } from "react";

export function useJupiterEmotion() {
  const [emotion, setEmotion] = useState<{ label: string; confidence: number } | null>(null);
  const [confidence, setConfidence] = useState(0);

  // TODO: Integrate with emotion/sentiment API

  const classifyEmotion = async (text: string) => {
    // Dummy: always neutral
    const result = { label: "neutral", confidence: 0.99 };
    setEmotion(result);
    setConfidence(result.confidence);
    return result;
  };

  return {
    emotion,
    confidence,
    classifyEmotion,
  };
}