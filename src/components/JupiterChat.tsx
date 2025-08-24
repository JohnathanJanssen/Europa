import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Terminal, Folder, RefreshCw, Send } from 'lucide-react';
import { speak } from "../runtime/voice";
import { useBrain } from "../runtime/brain";
import { useThoughts, think as thoughtsPush } from "../vision/thoughts/bus";
import ThoughtsPill from "./ThoughtsPill";
import VisionPanel from "./panels/VisionPanel";
import TerminalPanel from "./panels/TerminalPanel";
import FilesPanel from "./panels/FilesPanel";

export default function JupiterChat() {
  const thoughts = useThoughts();
  const brain = useBrain();
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<null | "vision" | "terminal" | "files">(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [brain.messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || brain.isThinking) return;
    setInput("");
    const reply = await brain.ask(text);
    if (reply?.text && reply?.speech !== false) {
      speak(reply.text);
    }
  }, [input, brain]);

  const frameStyle: React.CSSProperties = useMemo(() => ({
    width: 420,
    height: 600,
    display: "flex",
    flexDirection: "column",
    position: 'relative'
  }), []);

  function onOpenVision(){ setPanel("vision"); thoughtsPush("Opening Vision…"); }
  function onOpenTerminal(){ setPanel("terminal"); thoughtsPush("Opening Terminal…"); }
  function onOpenFiles(){ setPanel("files"); thoughtsPush("Opening Files…"); }
  function onRefresh(){ window.location.reload(); }

  return (
    <div className="relative grid place-items-center min-h-[70vh]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(120,60,255,0.15),_transparent_60%)]" />
      
      <div className="jupiter-widget rounded-[22px] border border-white/10 bg-[#0d0f16]/80 backdrop-blur-xl shadow-2xl p-6" style={frameStyle}>
        <div className="flex items-center justify-between flex-shrink-0 mb-4">
          <button onClick={() => setPanel(null)} className="tracking-[0.25em] text-left">
            <span className="text-white text-3xl font-black">JUPITER</span>
          </button>
          <ThoughtsPill text={thoughts} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 chat-scroll">
            {brain.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow break-words ${m.role === 'user' ? 'bg-blue-700 text-white' : 'bg-white/5 text-white/90'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-4 flex items-center gap-3 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder="Type a message..."
              disabled={brain.isThinking}
              className="flex-1 rounded-xl px-4 py-2.5 text-slate-200 bg-slate-950/60 ring-1 ring-white/10 focus:outline-none focus:ring-violet-500/50 transition"
            />
            <button onClick={send} disabled={brain.isThinking} aria-label="Send"
              className="h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-500/20 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-around flex-shrink-0">
          <button onClick={onOpenVision} title="Vision" className="p-2 rounded-full hover:bg-white/10 transition"><Eye className="text-white/70" /></button>
          <button onClick={onOpenTerminal} title="Terminal" className="p-2 rounded-full hover:bg-white/10 transition"><Terminal className="text-white/70" /></button>
          <button onClick={onOpenFiles} title="Files" className="p-2 rounded-full hover:bg-white/10 transition"><Folder className="text-white/70" /></button>
          <button onClick={onRefresh} title="Refresh" className="p-2 rounded-full hover:bg-white/10 transition"><RefreshCw className="text-white/70" /></button>
        </div>
        
        {panel === "vision" && (
          <VisionPanel
            onClose={()=>setPanel(null)}
            onSpeak={speak}
            thoughtsPush={thoughtsPush}
          />
        )}
        {panel === "terminal" && (
          <TerminalPanel
            onClose={()=>setPanel(null)}
            onOpenVision={()=>setPanel("vision")}
            onOpenFiles={()=>setPanel("files")}
          />
        )}
        {panel === "files" && <FilesPanel onClose={()=>setPanel(null)} />}
      </div>
    </div>
  );
}