export type Msg = { role:'system'|'user'|'assistant', content:string };

const OAI_KEY   = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o-mini';
const HF_TOKEN  = import.meta.env.VITE_HF_TOKEN as string | undefined;
const HF_MODEL  = (import.meta.env.VITE_HF_MODEL as string) || 'HuggingFaceH4/zephyr-7b-beta';

async function chatOpenAI(messages: Msg[]): Promise<string> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${OAI_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model: OAI_MODEL, messages, temperature:0.6 })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || 'OpenAI error');
  return (j.choices?.[0]?.message?.content ?? '').trim();
}

async function chatHF(messages: Msg[]): Promise<string> {
  const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + '\nASSISTANT:';
  const r = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`, {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${HF_TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters:{ max_new_tokens:200, temperature:0.6 } })
  });
  const j = await r.json();
  const txt = Array.isArray(j) ? (j[0]?.generated_text ?? '') : (j.generated_text ?? j?.[0]?.generated_text ?? '');
  const out = (txt.split('ASSISTANT:').pop() || txt).trim();
  return out || '…(preview)';
}

export async function chat(messages: Msg[]): Promise<string> {
  if (OAI_KEY) { try { return await chatOpenAI(messages); } catch {} }
  if (HF_TOKEN){ try { return await chatHF(messages); } catch {} }
  const last = [...messages].reverse().find(m=>m.role==='user')?.content || '';
  return `…${last}`;
}