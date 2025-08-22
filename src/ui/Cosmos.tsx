import React, { useEffect, useRef } from "react";
import "./cosmos.css";

export default function Cosmos(){
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let t: any;
    const handler = (e: Event) => {
      const strength = (e as CustomEvent).detail?.strength ?? 0.9;
      const el = ref.current;
      if(!el) return;
      el.style.setProperty("--cosmos-pulse", String(Math.min(1, Math.max(0, strength))));
      clearTimeout(t);
      t = setTimeout(() => el.style.setProperty("--cosmos-pulse","0"), 800);
    };
    window.addEventListener("cosmos:pulse", handler as any);
    return () => window.removeEventListener("cosmos:pulse", handler as any);
  }, []);

  return <div className="cosmos" ref={ref} aria-hidden/>;
}