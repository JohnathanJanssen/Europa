import React, { useCallback, useMemo, useRef, useState, Suspense, useEffect } from "react";
import { Eye, Terminal, Folder, RefreshCw } from 'lucide-react';
// Try to use our ElevenLabs voice helper if present; fall back otherwise.
let VoiceMod: any = null;
try { VoiceMod = await import("../runtime/voice"); } catch { /* optional */ }
// Vision panel (this path exists in our app)
import LiveCamera from "./vision/LiveCamera";

export default function JupiterChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role:"user"|"assistant", content:string}>>([
    { role:"assistant", content:"Hi! How can I help?" }
  ]);
  const [sending, setSending] = useState(false);
  const [thoughtText, setThoughtText] = useState<string>("Quiet mind.");
  const thoughtTimerRef = useRef<number | null>(null);

  // Inline feature panels (Vision local; Terminal/Files via events)
  const [showVision, setShowVision] = useState(false);

  const showThought = useCallback((t: string, holdMs = 1200) => {
    setThoughtText(t);
    if (thoughtTimerRef.current) window.clearTimeout(thoughtTimerRef.current);
    thoughtTimerRef.current = window.setTimeout(() => setThoughtText("Quiet mind."), holdMs);
  }, []);

  useEffect(() => () => {
    if (thoughtTimerRef.current) window.clearTimeout(thoughtTimerRef.current);
  }, []);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || "gpt-4o-mini";

  async function openaiReply(history: Array<{role:"user"|"assistant", content:string}>) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_MODEL, messages: history, temperature: 0.6 })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data?.choices?.[0]?.message?.content ?? "").toString();
  }

  // Voice output (ElevenLabs if present, else Web Speech API)
  function speak(text: string) {
    if (!text) return;
    if (VoiceMod && typeof VoiceMod.speak === "function") {
      // ElevenLabs helper the project already uses
      VoiceMod.speak(text);
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92; // closer to Frieren pacing
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  // Fixed size frame (keeps widget dimensions constant; thread scrolls inside)
  const FRAME = useMemo(() => ({ width: 420, height: 600 }), []);
  const frameStyle: React.CSSProperties = { width: FRAME.width, height: FRAME.height, display:"flex", flexDirection:"column" };
  const bodyStyle:  React.CSSProperties = { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" };
  const logStyle:   React.CSSProperties = { flex:1, overflowY:"auto", paddingBottom:8, scrollBehavior: 'smooth' };

  // Quick feature commands (no bubbles)
  function fireEvent(name: string, detail: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
  function handleVision()   { showThought("Opening Vision…", 900); setShowVision(true); }
  function handleTerminal() { showThought("Opening Terminal…", 900); fireEvent("jupiter:open", "terminal"); }
  function handleFiles()    { showThought("Opening Files…", 900);    fireEvent("jupiter:open", "files"); }
  function handleRefresh()  { location.reload(); }

  // Chat submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    // Direct feature intents typed by the user (don’t create a user bubble)
    const t = text.toLowerCase();
    if (t === "open vision")   { setInput(""); handleVision();   return; }
    if (t === "open terminal") { setInput(""); handleTerminal(); return; }
    if (t === "open files")    { setInput(""); handleFiles();    return; }
    if (t === "refresh")       { setInput(""); handleRefresh();  return; }

    try {
      setSending(true);
      setMessages(prev => [...prev, { role:"user", content:text }]);
      setInput("");
      showThought("Thinking…", 2200);
      const history = [...messages, { role:"user" as const, content:text }];
      const reply = await openaiReply(history);
      const brief = reply.split(/(?<=[.!?])\s/)[0]?.slice(0,140) || "OK.";
      showThought(brief, 1400);
      setMessages(prev => [...prev, { role:"assistant", content: reply }]);
      speak(reply);
    } catch (err) {
      setMessages(prev => [...prev, { role:"assistant", content:"Sorry—something went wrong." }]);
      showThought("Connection issue", 1600);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, showThought]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative grid place-items-center min-h-[70vh]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(120,60,255,0.15),_transparent_60%)]" />
      
      <div className="jupiter-widget rounded-[22px] border border-white/10 bg-[#0d0f16]/80 backdrop-blur-xl shadow-2xl p-6" style={frameStyle}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="text-[30px] tracking-[0.25em] font-extrabold text-white">JUPITER</div>
          <div className="jc-thoughts-pill" aria-live="polite">{thoughtText}</div>
        </div>

        {/* Body */}
        <div className="mt-5" style={bodyStyle}>
          {/* Message log */}
          <div className="space-y-3 chat-thread" role="log" aria-live="polite" style={logStyle}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow break-words ${m.role === 'user' ? 'bg-blue-700 text-white' : 'bg-white/5 text-white/90'}`}>
                      {m.content}
                  </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input row */}
          <form className="mt-4 flex items-center gap-3 flex-shrink-0" onSubmit={handleSubmit}>
            <div className="flex-1 rounded-2xl bg-[#171821]/75 border border-white/10 px-5 py-3 text-white/90">
              <input
                placeholder="Type or drop a file..."
                className="bg-transparent outline-none w-full placeholder-white/40"
                value={input}
                onChange={e=>setInput(e.target.value)}
                disabled={sending}
              />
            </div>
            <button className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#5b63ff] to-[#ab35ff] grid place-items-center text-white shadow" type="submit" disabled={sending} aria-label="Send">
              ➤
            </button>
          </form>

          {/* Icon row */}
          <div className="jc-action-row flex-shrink-0">
            <button className="jc-icon" title="Vision" onClick={handleVision} aria-label="Open Vision"><Eye className="text-white/70" size={18} strokeWidth={1.5}/></button>
            <button className="jc-icon" title="Terminal" onClick={handleTerminal} aria-label="Open Terminal"><Terminal className="text-white/70" size={18} strokeWidth={1.5}/></button>
            <button className="jc-icon" title="Files" onClick={handleFiles} aria-label="Open Files"><Folder className="text-white/70" size={18} strokeWidth={1.5}/></button>
            <button className="jc-icon" title="Refresh" onClick={handleRefresh} aria-label="Refresh"><RefreshCw className="text-white/70" size={18} strokeWidth={1.5}/></button>
          </div>

          {/* Inline Vision panel */}
          {showVision && (
            <div className="absolute inset-0 bg-[#0d0f16] flex flex-col p-4 rounded-[22px] z-10">
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div className="text-white/80 font-semibold">Vision</div>
                <button className="text-white/60 hover:text-white text-sm" onClick={()=>setShowVision(false)} aria-label="Close Vision">Close</button>
              </div>
              <div className="flex-1 overflow-auto">
                <Suspense fallback={<div className="grid place-items-center h-full text-white/80">Starting camera…</div>}>
                  <LiveCamera />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}