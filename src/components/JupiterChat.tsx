import React, { useState } from 'react';
import { Eye, Terminal, Folder, RefreshCw } from 'lucide-react';
import { uiBus } from '../runtime/uiBus';

export default function JupiterChat() {
  const [thoughtText, setThoughtText] = useState('Quiet mind.');

  function openVision(){ uiBus.openVision(); }
  function openTerminal(){ uiBus.openTerminal(); }
  function openFiles(){ uiBus.openFiles(); }
  function refreshUI(){ window.location.reload(); }

  return (
    <div className="relative grid place-items-center min-h-[70vh]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(120,60,255,0.15),_transparent_60%)]" />

      <div className="jupiter-widget w-[680px] max-w-[92vw] rounded-[22px] border border-white/10 bg-[#0d0f16]/80 backdrop-blur xl:backdrop-blur-md shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="text-[30px] tracking-[0.25em] font-extrabold text-white">JUPITER</div>
          <div className="jc-thoughts-pill" aria-live="polite">{thoughtText ?? "Quiet mind."}</div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white/5 text-white/90 p-6">
            This is a placeholder chat bubble. (Your prior chat logic remains.)
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-2xl bg-[#171821]/75 border border-white/10 px-5 py-3 text-white/90">
            <input placeholder="Type or drop a file..." className="bg-transparent outline-none w-full placeholder-white/40" />
          </div>
          <button className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#5b63ff] to-[#ab35ff] grid place-items-center text-white shadow">
            ➤
          </button>
        </div>

        <div className="jc-action-row">
          <button className="jc-icon" title="Vision" onClick={openVision} aria-label="Open Vision"><Eye className="text-white/70" size={18} strokeWidth={1.5}/></button>
          <button className="jc-icon" title="Terminal" onClick={openTerminal} aria-label="Open Terminal"><Terminal className="text-white/70" size={18} strokeWidth={1.5}/></button>
          <button className="jc-icon" title="Files" onClick={openFiles} aria-label="Open Files"><Folder className="text-white/70" size={18} strokeWidth={1.5}/></button>
          <button className="jc-icon" title="Refresh" onClick={refreshUI} aria-label="Refresh"><RefreshCw className="text-white/70" size={18} strokeWidth={1.5}/></button>
        </div>
      </div>
    </div>
  );
}