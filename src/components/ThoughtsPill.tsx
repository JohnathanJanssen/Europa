import React from "react";

type Props = { text: string };

export default function ThoughtsPill({ text }: Props){
  return (
    <div
      aria-label="Thoughts"
      className="rounded-full px-3 py-1 text-sm/5 text-slate-200/80 bg-slate-900/70 ring-1 ring-white/10 shadow-[0_0_30px_rgba(90,110,255,0.15)] select-none"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      {text || "Quiet mind."}
    </div>
  );
}