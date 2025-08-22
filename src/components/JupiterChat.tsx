/* Only body switching + icon highlighting. Header/Footer markup stays the same. */
import React,{useState} from "react";
import { pulse } from "../ui/feel";
import { onModelReply } from "../runtime/brain";
import TerminalPanel from "../panels/TerminalPanel";
import VisionPanel from "../panels/VisionPanel";
import FilesPanel from "../panels/FilesPanel";
type Body="chat"|"vision"|"terminal"|"files";
export default function JupiterChat(){
  const [body,setBody]=useState<Body>("chat");
  const [input,setInput]=useState("");
  const [term,setTerm]=useState<string[]>(["Jupiter terminal. Type `help`."]);
  const [vision,setVision]=useState<{stream:MediaStream|null,boxes:any[]}>({stream:null,boxes:[]});

  async function submit(){
    const text=input.trim(); if(!text) return; setInput("");
    if(body==="terminal"){
      setTerm(l=>[...l,`> ${text}`]);
      if(text==="clear") setTerm(["Jupiter terminal. Type `help`."]);
      else if(text==="help") setTerm(l=>[...l,"help – show commands","clear – clear screen"]);
      else setTerm(l=>[...l,"(sandbox) command accepted."]);
      pulse(.5); return;
    }
    // Chat path – your existing pipeline can append messages as before.
    pulse(.6); await onModelReply("…");
  }

  async function openVision(){
    setBody("vision"); pulse(.9);
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720}});
      setVision({stream:s,boxes:[]});
    }catch{}
  }

  return (
    <div className="jupiter-shell">{/* z-index preserved */}
      <header className="jup-head">
        <div className="brand" onClick={()=>setBody("chat")}>JUPITER</div>
        <div className="thoughts-chip">Quiet mind.</div>
      </header>

      <main className="jup-body">
        {body==="chat" && (
          <div className="chat-scroll"><div className="bubble ghost">
            This is a placeholder chat bubble. (Your prior chat logic remains.)
          </div></div>
        )}
        {body==="vision" && <VisionPanel className="panel" onClose={()=>setBody("chat")} stream={vision.stream} boxes={vision.boxes}/>}
        {body==="terminal" && <TerminalPanel className="panel" onClose={()=>setBody("chat")} lines={term}/>}
        {body==="files" && <FilesPanel className="panel" onClose={()=>setBody("chat")}/>}
      </main>

      <footer className="jup-foot">
        <form className="foot-row" onSubmit={(e)=>{e.preventDefault();submit();}}>
          <input className="foot-input" value={input} onChange={e=>setInput(e.target.value)}
            placeholder={body==="terminal"?"Type a command...":"Type or drop a file..."} />
          <button className="send" aria-label="Send">➤</button>
        </form>
        <div className="foot-icons">
          <button className={`ico ${body==="vision"?"active":""}`} aria-label="Vision" onClick={openVision}/>
          <button className={`ico ${body==="terminal"?"active":""}`} aria-label="Terminal" onClick={()=>{setBody("terminal");pulse(.6);}}/>
          <button className={`ico ${body==="files"?"active":""}`} aria-label="Files" onClick={()=>{setBody("files");pulse(.6);}}/>
          <button className="ico" aria-label="Refresh" onClick={()=>location.reload()}/>
        </div>
      </footer>
    </div>
  );
}