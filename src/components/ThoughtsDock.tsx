import React, { useEffect, useState } from 'react';
import { onThoughts, type Thought } from '../vision/thoughts/bus';

export default function ThoughtsDock() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<Thought[]>([]);
  useEffect(() => onThoughts(setItems), []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50">
      <div className="pointer-events-auto select-none bg-zinc-900/80 backdrop-blur
                      rounded-2xl shadow-xl border border-zinc-800 w-[360px] max-w-[90vw]">
        <div className="flex items-center px-3 py-2">
          <div className="text-sm font-semibold tracking-wide text-zinc-200">THOUGHTS</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setOpen(o=>!o)} className="text-xs px-2 py-1 rounded-md hover:bg-zinc-800">
              {open ? 'Hide' : 'Show'}
            </button>
            <div className="text-[10px] text-zinc-400">{items.length}</div>
          </div>
        </div>
        {open && (
          <div className="px-3 pb-3 max-h-[240px] overflow-auto space-y-1">
            {items.length === 0 ? (
              <div className="text-xs text-zinc-500 py-2">Quiet mind.</div>
            ) : items.slice(0,30).map((it, i) => (
              <div key={i} className="text-[13px] leading-[1.15rem] text-zinc-200
                                     bg-zinc-950/60 border border-zinc-800 rounded-lg px-2 py-1">
                {it.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}