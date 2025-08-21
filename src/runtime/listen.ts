export function startListening(onText:(text:string)=>void): { stop():void } {
  const SR:any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!SR) return { stop(){} };
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = '';
  rec.onresult = (e:any) => {
    for (let i=e.resultIndex; i<e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) finalText += res[0].transcript;
    }
    if (finalText.trim()) { const t = finalText.trim(); finalText=''; onText(t); }
  };
  try { rec.start(); } catch {}
  return { stop(){ try { rec.stop(); } catch {} } };
}