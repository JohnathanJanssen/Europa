import React, { useCallback, useRef, useState } from "react";
import { Eye, Terminal, Folder, RefreshCw } from 'lucide-react';

export default function JupiterChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role:"user"|"assistant", content:string}>>([
    { role:"assistant", content:"Hi! How can I help?" }
  ]);
  const [sending, setSending] = useState(false);
  const [thoughtText, setThoughtText] = useState<string>("Quiet mind.");
  const thoughtTimerRef = useRef<number | null>(null);

  // helper to show a transient thought
  const showThought = useCallback((t: string, holdMs = 1200) => {
    setThoughtText(t);
    if (thoughtTimerRef.current) window.clearTimeout(thoughtTimerRef.current);
    thoughtTimerRef.current = window.setTimeout(() => setThoughtText("Quiet mind."), holdMs);
  }, []);

  React.useEffect(() => () => { if (thoughtTimerRef.current) window.clearTimeout(thoughtTimerRef.current); }, []);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || "gpt-4o-mini";

  async function askOpenAI(history: Array<{role:"user"|"assistant", content:string}>) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: history.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.6
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "(no response)";
    return content as string;
  }

  function isQuickCommand(s: string) {
    const t = s.trim().toLowerCase();
    return t === "open vision" || t === "open terminal" || t === "open files" ||
           t === "close vision" || t === "close terminal" || t === "close files" || t === "refresh";
  }

  function runQuickCommand(cmd: string) {
    const t = cmd.trim().toLowerCase();
    if (t === "refresh") { window.location.reload(); return; }
    window.dispatchEvent(new CustomEvent("jupiter:command", { detail: t }));
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string') e?.preventDefault();
    const text = (typeof e === 'string' ? e : input).trim();
    if (!text || sending) return;

    if (isQuickCommand(text)) {
      setMessages(prev => [...prev, { role:"user", content: text }]);
      runQuickCommand(text);
      setInput("");
      return;
    }

    try {
      setSending(true);
      setMessages(prev => [...prev, { role:"user", content: text }]);
      setInput("");
      showThought("Thinking…", 2500);

      const history = [...messages, { role:"user" as const, content: text }];
      const reply = await askOpenAI(history);

      const brief = reply.split(/(?<=[.!?])\s/)[0]?.slice(0, 140) || "OK.";
      showThought(brief, 1600);

      setMessages(prev => [...prev, { role:"assistant", content: reply }]);
    } catch (err:any) {
      console.error(err);
      setMessages(prev => [...prev, { role:"assistant", content: "Sorry—something went wrong reaching the model." }]);
      showThought("Error reaching model", 2000);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, showThought]);

  function openVision(){ handleSubmit("open vision"); }
  function openTerminal(){ handleSubmit("open terminal"); }
  function openFiles(){ handleSubmit("open files"); }
  function refreshUI(){ handleSubmit("refresh"); }

  return (
    <div className="relative grid place-items-center min-h-[70vh]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(120,60,255,0.15),_transparent_60%)]" />

      <div className="jupiter-widget w-[680px] max-w-[92vw] rounded-[22px] border border-white/10 bg-[#0d0f16]/80 backdrop-blur xl:backdrop-blur-md shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="text-[30px] tracking-[0.25em] font-extrabold text-white">JUPITER</div>
          <div className="jc-thoughts-pill" aria-live="polite">{thoughtText}</div>
        </div>

        <div className="mt-5 space-y-3 chat-thread" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow break-words ${m.role === 'user' ? 'bg-blue-700 text-white' : 'bg-white/5 text-white/90'}`}>
                    {m.content}
                </div>
            </div>
          ))}
        </div>

        <form className="mt-4 flex items-center gap-3" onSubmit={handleSubmit}>
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