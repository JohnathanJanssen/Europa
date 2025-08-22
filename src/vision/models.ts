import * as tf from "@tensorflow/tfjs";
// Try fastest backends
async function pickBackend() {
  try { if ((tf as any).backend() !== 'webgpu') { await tf.setBackend('webgpu'); await tf.ready(); return; } } catch {}
  try { if ((tf as any).backend() !== 'webgl')  { await tf.setBackend('webgl');  await tf.ready(); return; } } catch {}
  try { if ((tf as any).backend() !== 'wasm')   { await tf.setBackend('wasm');   await tf.ready(); return; } } catch {}
  await tf.ready();
}
let loaded = false;
export async function ensureTFReady() {
  if (!loaded) { await pickBackend(); loaded = true; }
}

import type * as cocoNamespace from "@tensorflow-models/coco-ssd";
let cocoMod: typeof cocoNamespace | null = null;
let modelPromise: Promise<cocoNamespace.ObjectDetection> | null = null;

export async function loadDetector() {
  await ensureTFReady();
  if (!cocoMod) cocoMod = await import("@tensorflow-models/coco-ssd");
  if (!modelPromise) modelPromise = cocoMod.load({ base: "lite_mobilenet_v2" });
  return modelPromise!;
}