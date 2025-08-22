import React from 'react';

type Props = { text: string; onHide?: () => void; };

export default function ThoughtsBubble({ text, onHide }: Props) {
  return (
    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10
                    rounded-2xl bg-[#12131a]/90 text-white/80 border border-white/10
                    px-4 py-2 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 text-xs">
        <span className="tracking-wide font-semibold text-white/70">THOUGHTS</span>
        <button onClick={onHide} className="text-white/50 hover:text-white/80">Hide</button>
      </div>
      <div className="mt-1 text-sm">{text || 'Quiet mind.'}</div>
    </div>
  );
}