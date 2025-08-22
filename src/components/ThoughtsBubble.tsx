import { useEffect, useState } from "react";
import { onThoughts, type Thought } from '../vision/thoughts/bus';

function useLatestThoughtText() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    const unsub = onThoughts((thoughts: Thought[]) => {
      setT(thoughts[0]?.text || "");
    });
    return () => unsub();
  }, []);
  return t;
}

export default function ThoughtsBubble({ variant = "inline" as "inline" | "card" }) {
  const text = useLatestThoughtText();
  if (variant === "card") {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white/80 text-sm">
        {text || "Quiet mind."}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-[2px] text-white/60 text-[12px] truncate max-w-[220px]">
      {text || "Quiet mind."}
    </div>
  );
}