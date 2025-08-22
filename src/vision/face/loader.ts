import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';

let ready = false;
async function pickBackend() {
  try { await tf.setBackend('webgpu'); await tf.ready(); return; } catch {}
  try { await tf.setBackend('webgl');  await tf.ready(); return; } catch {}
  try { await tf.setBackend('wasm');   await tf.ready(); return; } catch {}
  await tf.setBackend('cpu'); await tf.ready();
}

export async function ensureFaceModels() {
  if (ready) return;
  await pickBackend();
  // Try local /public first, then CDN
  const baseLocal = '/models/faceapi/';
  const baseCdn   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
  async function load(base:string) {
    await faceapi.nets.tinyFaceDetector.loadFromUri(base);
    await faceapi.nets.faceLandmark68Net.loadFromUri(base);
    await faceapi.nets.faceRecognitionNet.loadFromUri(base);
  }
  try { await load(baseLocal); ready = true; }
  catch { await load(baseCdn); ready = true; }
}

export { faceapi };