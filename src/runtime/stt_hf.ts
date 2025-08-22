const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;
const HF_STT_MODEL =
  (import.meta.env.VITE_HF_STT_MODEL as string) || "openai/whisper-tiny.en";

function pickMime(): string | undefined {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4'
  ];
  for (const t of types) {
    if ((window as any).MediaRecorder?.isTypeSupported?.(t)) return t;
  }
  return undefined;
}

export type RecorderCtrl = { stop(): Promise<Blob> };

export async function startRecordingFromStream(stream: MediaStream): Promise<RecorderCtrl> {
  const mime = pickMime();
  const opts = mime ? { mimeType: mime } : undefined as any;
  const rec = new MediaRecorder(stream, opts);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  rec.start(250);
  return {
    stop(): Promise<Blob> {
      return new Promise((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime || 'audio/webm' }));
        try { rec.stop(); } catch { resolve(new Blob(chunks)); }
      });
    },
  };
}

export async function transcribeOnce(blob: Blob): Promise<string> {
  if (!HF_TOKEN) throw new Error("Missing VITE_HF_TOKEN");
  const form = new FormData();
  form.append("file", blob, "audio");
  const r = await fetch(
    `https://api-inference.huggingface.co/models/${encodeURIComponent(HF_STT_MODEL)}`,
    { method: "POST", headers: { Authorization: `Bearer ${HF_TOKEN}` }, body: form }
  );
  const j = await r.json();
  const text = (j.text || j.generated_text || "").trim();
  return text;
}