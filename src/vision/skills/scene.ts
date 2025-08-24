import * as mobilenet from '@tensorflow-models/mobilenet';
let net: mobilenet.MobileNet | null = null;

export async function ensureSceneNet() {
  if (net) return net;
  net = await mobilenet.load({ version: 2, alpha: 0.5 });
  return net;
}

export async function classifyScene(video: HTMLVideoElement) {
  const m = await ensureSceneNet();
  const preds = await m.classify(video as any, 1);
  if (!preds || !preds[0]) return null;
  return { label: preds[0].className, prob: preds[0].probability };
}