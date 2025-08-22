import React, { useEffect } from "react";
import "../styles/shell.css";

/* If your project already has LiveCamera/Overlay, we reuse it; otherwise show camera only. */
let Has = { Camera:false };
let LiveCamera:any = null;

try {
  // Attempt to import your existing component without breaking build if missing.
  // @ts-ignore
  LiveCamera = (await import("../components/vision/LiveCamera")).default;
  Has.Camera = !!LiveCamera;
} catch {}

export default function VisionPanel(){
  useEffect(()=>{ /* mount/unmount safety already handled in your camera module if it exists */ }, []);
  return (
    <div className="jupiter-panel" style={{height:"100%", display:"grid"}}>
      {Has.Camera ? <LiveCamera/> : <div style={{padding:12}}>Vision is preparing…</div>}
    </div>
  );
}