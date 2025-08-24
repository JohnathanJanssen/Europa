import React, { useMemo, useRef, useState, useEffect } from "react";
import "../styles/glow.css";
import { speak } from "../runtime/voice";
import { nanoid } from "nanoid";

// Panels (use whatever you already have – these names match your last setup)
import VisionPanel from "../panels/VisionPanel";
import FilesPanel from "../panels/FilesPanel";
import TerminalPanel from "../panels/TerminalPanel";

// ---------- inline symbol-style icons (no external deps) ----------
const Eye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const Terminal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 8l4 4-4 4"/><path d="M13 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
);
const Folder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h6l2 3h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V6a2 2 0 0 1 2-2h3l2 3"/></svg>
);
const Refresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
);

// ---------- body enum ----------
type Face = "chat" | "vision" | "terminal" | "files";
type Msg = { id: string; role: "user" | "assistant"; content: string };

function ChatBody({ messages, onSend }: { messages: Msg[], onSend: (text: string) => void }) {
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find(m => m.role === "assistant" && typeof m.content === "string" && m.content.trim());

    if (!lastAssistant || (lastAssistant.id && lastSpokenIdRef.current === lastAssistant.id)) {
      return;
    }

    lastSpokenIdRef.current = lastAssistant.id;
    speak(lastAssistant.content);
  }, [messages]);

  return (
    <div className="jupiter-scroll">
      {messages.map((m) => (
        <div key={m.id} style={{
          background: m.role === "user" ? "rgba(64,92,255,0.22)" : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#cfd6e6",
          padding: "12px 16px",
          borderRadius: 16,
          marginBottom: 12,
          alignSelf: m.role === "user" ? "flex-end" : "flex-start",
          maxWidth: "85%",
        }}>
          {m.content}
        </div>
      ))}
    </div>
  );
}

export default function JupiterChat() {
  const [face, setFace] = useState<Face>("chat");
  const [thought, setThought] = useState("Quiet mind.");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: nanoid(), role: "assistant", content: "Hi! How can I help?" }
  ]);

  const openFace = (f: Face) => setFace(f);
  const goHome = () => setFace("chat");

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const newUserMessage: Msg = { id: nanoid(), role: "user", content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");

    // Replace with your actual brain logic
    setTimeout(() => {
      const assistantResponse: Msg = { id: nanoid(), role: "assistant", content: `You said: ${text}` };
      setMessages(prev => [...prev, assistantResponse]);
    }, 500);
  };

  const Body = useMemo(() => {
    if (face === "vision") return <VisionPanel className="panel" onClose={goHome} />;
    if (face === "terminal") return <TerminalPanel className="panel" onClose={goHome} />;
    if (face === "files") return <FilesPanel className="panel" onClose={goHome} />;
    return <ChatBody messages={messages} onSend={handleSend} />;
  }, [face, messages]);

  return (
    <div className="jupiter-stage">
      <div className="jupiter-shell">
        <div className="jupiter-header">
          <div className="jupiter-title" onClick={goHome}>JUPITER</div>
          <div className="jupiter-thoughts" title={thought}>{thought}</div>
        </div>
        <div className="jupiter-body">
          <div className="jupiter-body-frame">
            {Body}
          </div>
        </div>
        <div className="jupiter-footer">
          <input
            className="jupiter-input"
            placeholder={face === "chat" ? "Type or drop a file..." : "Type a command..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(input); }}
          />
          <button className="jupiter-send" onClick={() => handleSend(input)}>▶</button>
          <div className="footer-icons">
            <button aria-label="Vision" className={`footer-btn ${face === "vision" ? "active" : ""}`} onClick={() => openFace("vision")}><Eye /></button>
            <button aria-label="Terminal" className={`footer-btn ${face === "terminal" ? "active" : ""}`} onClick={() => openFace("terminal")}><Terminal /></button>
            <button aria-label="Files" className={`footer-btn ${face === "files" ? "active" : ""}`} onClick={() => openFace("files")}><Folder /></button>
            <button aria-label="Refresh" className="footer-btn" onClick={() => location.reload()}><Refresh /></button>
          </div>
        </div>
      </div>
    </div>
  );
}