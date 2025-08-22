import React, { useMemo, useRef, useState } from "react";
import "../styles/glow.css";
import { speak } from "../runtime/voice";

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

export default function JupiterChat() {
  const [face, setFace] = useState<Face>("chat");
  const [thought, setThought] = useState("Quiet mind.");
  const [input, setInput] = useState("");

  // helper: unified action to open faces
  const openFace = (f: Face) => setFace(f);

  // When you click JUPITER, always return home (chat body)
  const goHome = () => setFace("chat");

  // Example of using your existing brain output to thoughts
  // call setThought(msg) where appropriate in your pipeline.

  // ---------- BODY RENDERER (only this swaps) ----------
  const Body = useMemo(() => {
    if (face === "vision") return <VisionPanel className="panel" onClose={goHome} />;
    if (face === "terminal") return <TerminalPanel className="panel" onClose={goHome} />;
    if (face === "files") return <FilesPanel className="panel" onClose={goHome} />;
    // CHAT BODY: keep your existing chat bubbles list. This is a placeholder wrapper
    return (
      <div className="jupiter-scroll">
        {/* Mount your real chat bubbles here; this placeholder preserves spacing */}
        <div style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.12)",
          color: "#cfd6e6",
          padding: "18px 16px",
          borderRadius: 16
        }}>
          This is a placeholder chat bubble. (Your prior chat logic remains.)
        </div>
      </div>
    );
  }, [face]);

  // ---------- SEND (chat) ----------
  const onSend = async () => {
    if (!input.trim()) return;
    // Pipe into your existing chat handler here:
    // await brain.send(input)
    setInput("");

    // Optional: demonstrate voice rate is calm again
    // speak("Okay."); // keep or remove; your chain already calls speak()
  };

  // ---------- UI ----------
  return (
    <div className="jupiter-stage">
      <div className="jupiter-shell">
        {/* HEADER (constant) */}
        <div className="jupiter-header">
          <div className="jupiter-title" onClick={goHome}>JUPITER</div>
          <div className="jupiter-thoughts" title={thought}>{thought}</div>
        </div>

        {/* BODY (swaps only inside this frame) */}
        <div className="jupiter-body">
          <div className="jupiter-body-frame">
            {Body}
          </div>
        </div>

        {/* FOOTER (constant) */}
        <div className="jupiter-footer">
          <input
            className="jupiter-input"
            placeholder={face === "chat" ? "Type or drop a file..." :
                        face === "terminal" ? "Type a command..." :
                        face === "vision" ? "Type… (JUPITER to return to chat)" :
                        "Type… (JUPITER to return to chat)"}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==="Enter") onSend(); }}
          />
          <button className="jupiter-send" onClick={onSend}>▶</button>

          <div className="footer-icons">
            <button aria-label="Vision"  className={`footer-btn ${face==="vision"?"active":""}`} onClick={()=>openFace("vision")}><Eye/></button>
            <button aria-label="Terminal"className={`footer-btn ${face==="terminal"?"active":""}`} onClick={()=>openFace("terminal")}><Terminal/></button>
            <button aria-label="Files"   className={`footer-btn ${face==="files"?"active":""}`} onClick={()=>openFace("files")}><Folder/></button>
            <button aria-label="Refresh" className="footer-btn" onClick={()=>location.reload()}><Refresh/></button>
          </div>
        </div>
      </div>
    </div>
  );
}