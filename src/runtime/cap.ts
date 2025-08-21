export function webSpeechAvailable(): boolean {
  return !!((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
}

export async function getMicPermission(): Promise<'granted'|'denied'|'prompt'> {
  try {
    const q: any = (navigator as any).permissions?.query;
    if (q) {
      const res = await q({ name: 'microphone' as any });
      return (res?.state as any) || 'prompt';
    }
  } catch {}
  return 'prompt';
}