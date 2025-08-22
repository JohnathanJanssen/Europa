import React, { useState } from "react";
import { pulse } from "../ui/feel";
import TerminalPanel from "../panels/TerminalPanel";
import VisionPanel from "../panels/VisionPanel";
import FilesPanel from "../panels/FilesPanel";
import { onModelReply } from "../runtime/brain";
import { speak } from "../runtime/voice";

type Body = "chat" | "terminal" | "vision" | "files";

export default function JupiterChat(){
  const [body, setBody] = useState<Body>("chat");
  const [input, setInput] = useState("");
  const [termLines, setTermLines] = useState<string[]>(["Jupiter terminal. Type `help`."]);
  const [vision, setVision] = useState<{ stream: MediaStream | null, boxes: any[] }>({ stream: null, boxes: [] });

  async function runChat(message: string){
    // your existing chat send flow here; demo append + speak
    pulse(.6);
    onModelReply("…"); // keep your real pipeline; this triggers speak() via brain
  }

  async function runTerminal(command: string){
    setTermLines(l => [...l, `> ${command}`]);
    // handle a few built-ins locally; extend as you wish
    if (command.trim() === "help"){
      setTermLines(l => [...l, "help – this help", "clear – clear screen"]);
    } else if (command.trim() === "clear"){
      setTermLines(["Jupiter terminal. Type `help`."]);
    } else {
      setTermLines(l => [...l, "(sandbox) command accepted."]);
    }
  }

  function handleSubmit(){
    const text = input.trim();
    if(!text) return;
    setInput("");
    if (body === "terminal") return runTerminal(text);
    return runChat(text);
  }

  async function openVision(){
    pulse(.9);
    setBody("vision");
    try{
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      setVision({ stream: s, boxes: [] });
      speak("Opening vision."); // audible + glow
    }catch{
      // ignored
    }
  }

  return (
    <div className="jupiter-shell" /* your shell wrapper & styling stay the same */>
      {/* HEADER – unchanged */}
      <header className="jup-head">
        <div className="brand">JUPITER</div>
        <div className="thoughts-chip">Quiet mind.</div>
      </header>

      {/* BODY – only this area swaps */}
      <main className="jup-body">
        {body === "chat" && (
          <div className="chat-scroll">
            {/* keep your existing chat bubbles here (omitted for brevity) */}
            <div className="bubble ghost">This is a placeholder chat bubble. (Your prior chat logic remains.)</div>
          </div>
        )}

        {body === "terminal" && (
          <TerminalPanel
            className="panel"
            onClose={() => setBody("chat")}
            lines={termLines}
          />
        )}

        {body === "files" && (
          <FilesPanel
            className="panel"
            onClose={() => setBody("chat")}
          />
        )}

        {body === "vision" && (
          <VisionPanel
            className="panel"
            onClose={() => setBody("chat")}
            stream={vision.stream}
            boxes={vision.boxes}
          />
        )}
      </main>

      {/* FOOTER – unchanged visuals; icons get 'active' class when selected */}
      <footer className="jup-foot">
        <form onSubmit={(e)=>{e.preventDefault(); handleSubmit();}} className="foot-row">
          <input
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder={body === "terminal" ? "Type a command..." : "Type or drop a file..."}
            className="foot-input"
          />
          <button className="send" aria-label="Send">➤</button>
        </form>

        <div className="foot-icons">
          <button className={`ico ${body==="vision"?"active":""}`} aria-label="Vision" onClick={openVision}>👁️</button>
          <button className={`ico ${body==="terminal"?"active":""}`} aria-label="Terminal" onClick={()=>{ setBody("terminal"); pulse(.6); }}>⌥_</button>
          <button className={`ico ${body==="files"?"active":""}`} aria-label="Files" onClick={()=>{ setBody("files"); pulse(.6); }}>▦</button>
          <button className="ico" aria-label="Refresh" onClick={()=>{ location.reload(); }}>↻</button>
        </div>
      </footer>
    </div>
  );
}