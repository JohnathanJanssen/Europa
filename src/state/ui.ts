/* Simple UI store for active face + thoughts badge */
import { useState } from "react";

export type Face = "chat" | "vision" | "terminal" | "files";

export function useUIController() {
  const [face, setFace] = useState<Face>("chat");
  const [thinking, setThinking] = useState<string>("Quiet mind.");

  return {
    face, setFace,
    thinking, setThinking,
  };
}

/* Singleton-ish helper for non-React modules (optional & safe) */
let _lastSetThinking: ((t: string)=>void) | null = null;
export function _bindSetThinking(fn: (t:string)=>void) { _lastSetThinking = fn; }
export function postThought(t: string) { _lastSetThinking?.(t); }