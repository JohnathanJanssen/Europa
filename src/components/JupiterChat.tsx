import React, { useRef, useState } from 'react';
import ThoughtsBubble from './ThoughtsBubble';
import LiveCamera from './vision/LiveCamera';

export default function JupiterChat() {
  const [showThoughts, setShowThoughts] = useState(true);
  const [thoughtText] = useState('Quiet mind.');
  const [showVision, setShowVision] = useState(false);

  return (
    <div className="relative grid place-items-center min-h-[70vh]">
      {/* Halo */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(120,60,255,0.15),_transparent_60%)]" />

      {/* Thoughts strip above widget */}
      {showThoughts && (
        <ThoughtsBubble text={thoughtText} onHide={() => setShowThoughts(false)} />
      )}

      {/* Widget */}
      <div className="w-[680px] max-w-[92vw] rounded-[22px] border border-white/10
                      bg-[#0d0f16]/80 backdrop-blur xl:backdrop-blur-md shadow-2xl p-6">
        {/* Header row: big JUPITER + small icon row to the right */}
        <div className="flex items-center justify-between">
          <div className="text-[30px] tracking-[0.25em] font-extrabold text-white">JUPITER</div>
          <div className="flex items-center gap-2">
            {/* vision toggle icon */}
            <button
              title="Vision"
              onClick={() => setShowVision(v => !v)}
              className="h-8 w-8 grid place-items-center rounded-xl bg-white/6 text-white/80 hover:text-white"
            >👁</button>
            {/* settings placeholder */}
            <button
              title="Settings"
              className="h-8 w-8 grid place-items-center rounded-xl bg-white/6 text-white/80 hover:text-white"
            >⚙️</button>
            {/* flip icon (no vertical inversion) */}
            <button
              title="Flip"
              className="h-8 w-8 grid place-items-center rounded-xl bg-white/6 text-white/80 hover:text-white"
            >⤿</button>
          </div>
        </div>

        {/* Chat body (unchanged content placeholder) */}
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white/5 text-white/90 p-6">
            This is a placeholder chat bubble. (Your prior chat logic remains.)
          </div>
        </div>

        {/* Chat input row — original look */}
        <div className="mt-4 flex items-center gap-3">
          <button className="h-12 w-12 rounded-2xl bg-white/6 grid place-items-center text-white/80">🎙</button>
          <div className="flex-1 rounded-2xl bg-[#171821]/75 border border-white/10 px-5 py-3 text-white/90">
            <input placeholder="Type or drop a file..." className="bg-transparent outline-none w-full placeholder-white/40" />
          </div>
          <button className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#5b63ff] to-[#ab35ff] grid place-items-center text-white shadow">
            ➤
          </button>
        </div>

        {/* Vision panel appears BELOW the chat (like your screenshot) */}
        {showVision && (
          <div className="mt-6">
            <div className="text-xs text-white/60 mb-2">Vision</div>
            <LiveCamera onClose={() => setShowVision(false)} onEnrolledName={() => { /* optional hook */ }} />
          </div>
        )}
      </div>
    </div>
  );
}