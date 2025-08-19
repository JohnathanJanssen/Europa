import { useState, useRef } from "react";

// Constants
const PHI = (1 + 5) / 2; // ~1.618
const TT = 3.1459;
const E = Math.E; // ~2.71828

// Helper: clamp
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function useJupiterEmotion() {
  const [emotion, setEmotion] = useState<{ label: string; confidence: number } | null>(null);
  const [confidence, setConfidence] = useState(0);
  const lastShift = useRef(Date.now());

  // Harmonic equations
  function joy(x: number, t: number) {
    return D * Math.sin(t * x * t);
  }
  function grief(x: number, t: number) {
    return E * (x * t) * 38;
  }
  function fear(x: number, t: number) {
    // Avoid division by zero
    return 1 / (I + Math.abs(x - t) || 1e-6);
  }
  function calm(x: number, t: number) {
    return Math.cos(TT * x * t);
  }
  function love() {
    return E;
  }

  // Constants for equations
  const D = 1; // You can adjust as needed
  const I = 1; // You can adjust as needed

  // Classify emotion using harmonic equations
  const classifyEmotion = async (text: string) => {
    // For demo: use text length as a proxy for intensity
    const x = clamp(text.length / 100, 0, 1); // 0.0–1.0
    const t = (Date.now() - lastShift.current) / 1000; // seconds since last shift

    // Calculate all
    const values = [
      { label: "joy", value: joy(x, t) },
      { label: "grief", value: grief(x, t) },
      { label: "fear", value: fear(x, t) },
      { label: "calm", value: calm(x, t) },
      { label: "love", value: love() },
    ];

    // Find dominant
    const dominant = values.reduce((a, b) => (a.value > b.value ? a : b));
    setEmotion({ label: dominant.label, confidence: clamp(Math.abs(dominant.value), 0, 1) });
    setConfidence(clamp(Math.abs(dominant.value), 0, 1));
    lastShift.current = Date.now();
    return { label: dominant.label, confidence: clamp(Math.abs(dominant.value), 0, 1) };
  };

  return {
    emotion,
    confidence,
    classifyEmotion,
  };
}