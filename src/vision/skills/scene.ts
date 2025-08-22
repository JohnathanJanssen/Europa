import * as mobilenet from '@tensorflow-models/mobilenet';
import type { SceneSense } from '../types';

let net: mobilenet.MobileNet | null = null;

export async function ensureSceneNet() {
  if (net) return net;
  net = await mobilenet.load({ version: 2, alpha: 0.5 });
  return net;
}

export async function detectScene(video: HTMLVideoElement, model: mobilenet.MobileNet): Promise<SceneSense | null> {
  const preds = await model.classify(video as any, 1);
  if (!preds || !preds[0]) return null;
  return { label: preds[0].className, prob: preds[0].probability };
}