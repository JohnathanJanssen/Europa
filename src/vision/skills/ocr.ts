import { createWorker, OEM } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;
let isInitializing = false;

async function getWorker() {
  if (worker) return worker;
  if (isInitializing) {
    // Wait for the worker to be initialized by another call
    return new Promise<Tesseract.Worker>((resolve) => {
      const interval = setInterval(() => {
        if (worker) {
          clearInterval(interval);
          resolve(worker);
        }
      }, 100);
    });
  }

  isInitializing = true;
  console.log("Initializing Tesseract.js worker...");
  const newWorker = await createWorker('eng', OEM.LSTM_ONLY);
  worker = newWorker;
  isInitializing = false;
  console.log("Tesseract.js worker initialized.");
  return worker;
}

export async function ocrFromCanvas(canvas: HTMLCanvasElement): Promise<string> {
  try {
    const tesseractWorker = await getWorker();
    const { data: { text } } = await tesseractWorker.recognize(canvas);
    return text;
  } catch (error) {
    console.error("OCR failed:", error);
    // In case of failure, we might want to terminate and recreate the worker
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    return "";
  }
}