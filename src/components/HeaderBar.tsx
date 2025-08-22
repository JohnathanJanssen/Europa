import React, { useEffect, useState } from 'react';
import ThoughtsInline from './ThoughtsInline';
import { uiBus } from '../runtime/uiBus';

export default function HeaderBar() {
  const [mode, setMode] = useState(uiBus.get());
  useEffect(() => uiBus.on(setMode), []);

  const flipped = mode !== 'front';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="text-[11px] tracking-[0.14em] text-zinc-300 select-none">JUPITER</div>
      <div className="flex-1 min-w-0 flex justify-start">
        <ThoughtsInline />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => uiBus.openVision()}   className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">👁</button>
        <button onClick={() => uiBus.openSettings()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">⚙︎</button>
        <button onClick={() => uiBus.openTerminal()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">⌥</button>
        {flipped && <button onClick={() => uiBus.back()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">↩︎</button>}
      </div>
    </div>
  );
}