import React, { useState, useEffect } from 'react';
import type { Face } from '../../vision/types';
import { setFaceName } from '../../vision/face/db';
import { speakNow } from '@/runtime/voice';

export default function NameFace({
  candidate, onDone
}: { candidate: Face & { trackId?: string } | null; onDone: ()=>void }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (candidate) {
      speakNow("I don’t recognize you yet. What should I call you?");
    }
  }, [candidate]);

  if (!candidate) return null;
  return (
    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-lg p-2 text-xs flex items-center gap-2 z-10">
      <span>new face — name?</span>
      <input
        className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 outline-none"
        placeholder="name"
        value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>{
          if (e.key==='Enter' && name.trim() && candidate.trackId) {
            setFaceName(candidate.trackId, name.trim());
            setName(''); onDone();
          }
        }}
      />
      <button
        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
        onClick={()=>onDone()}
        title="dismiss"
      >×</button>
    </div>
  );
}