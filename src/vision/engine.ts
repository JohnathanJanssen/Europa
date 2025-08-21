import * as ort from 'onnxruntime-web';
import { models, getModelUrl } from './models'; // Import getModelUrl

export type Detection = {
  cls: string;
  score: number;
  box: [number, number, number, number]; // [x, y, w, h]
};

export interface VisionEngine {
  start(video: HTMLVideoElement, opts?: { fps?: number }): Promise<void>;
  stop(): void;
  onDetections(cb: (dets: Detection[]) => void): () => void;
  takeFrame(): HTMLCanvasElement;
  ready(): boolean;
  info(): { ep: string; fps: number; model: string };
}

// Simple Non-Max Suppression to remove overlapping boxes
function nonMaxSuppression(boxes: any[], scores: number[], iouThreshold: number): number[] {
  const selectedIndices: number[] = [];
  const areas = boxes.map(box => (box[2] - box[0]) * (box[3] - box[1]));
  let indices = scores.map((_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a]);

  while (indices.length > 0) {
    const last = indices.length - 1;
    const i = indices[0];
    selectedIndices.push(i);
    const suppress = [i];

    for (let pos = 1; pos < indices.length; pos++) {
      const j = indices[pos];
      const x1 = Math.max(boxes[i][0], boxes[j][0]);
      const y1 = Math.max(boxes[i][1], boxes[j][1]);
      const x2 = Math.min(boxes[i][2], boxes[j][2]);
      const y2 = Math.min(boxes[i][3], boxes[j][3]);
      const width = Math.max(0, x2 - x1);
      const height = Math.max(0, y2 - y1);
      const intersection = width * height;
      const iou = intersection / (areas[i] + areas[j] - intersection);
      if (iou > iouThreshold) {
        suppress.push(j);
      }
    }
    indices = indices.filter(idx => !suppress.includes(idx));
  }
  return selectedIndices;
}

export function createVisionEngine(): VisionEngine {
  let session: ort.InferenceSession | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let animationFrameId: number | null = null;
  let lastFrameTime = 0;
  let targetFps = 15;
  let listeners: ((dets: Detection[]) => void)[] = [];
  let isRunning = false;
  let modelName: keyof typeof models = 'yolov5n';
  let executionProvider = 'wasm'; // Default to wasm

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  async function initialize() {
    if (session) return;
    try {
      // Update WASM paths to match the installed onnxruntime-web version
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
      const modelUrl = getModelUrl(modelName);
      console.log(`Attempting to load model from: ${modelUrl}`);
      
      // Force executionProvider to 'wasm' for maximum compatibility
      executionProvider = 'wasm'; 
      
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: [executionProvider],
        graphOptimizationLevel: 'all',
      });
      console.log(`VisionEngine initialized with ${executionProvider}.`);
    } catch (e) {
      console.error("Failed to initialize VisionEngine:", e);
      throw new Error("Could not load the vision model.");
    }
  }

  async function run() {
    if (!isRunning || !videoElement || !ctx || !session) return;

    const now = performance.now();
    const delta = now - lastFrameTime;

    if (delta > 1000 / targetFps) {
      lastFrameTime = now;
      const [modelWidth, modelHeight] = models[modelName].inputShape.slice(2);
      
      // Preprocess
      canvas.width = modelWidth;
      canvas.height = modelHeight;
      ctx.drawImage(videoElement, 0, 0, modelWidth, modelHeight);
      const imageData = ctx.getImageData(0, 0, modelWidth, modelHeight);
      const { data } = imageData;
      const red = [], green = [], blue = [];
      for (let i = 0; i < data.length; i += 4) {
        red.push(data[i] / 255);
        green.push(data[i + 1] / 255);
        blue.push(data[i + 2] / 255);
      }
      const input = [...red, ...green, ...blue];
      const inputTensor = new ort.Tensor('float32', input, models[modelName].inputShape);

      // Inference
      const feeds = { [session.inputNames[0]]: inputTensor };
      const results = await session.run(feeds);
      const output = results[session.outputNames[0]];

      // Postprocess
      const detections = processOutput(output, videoElement.videoWidth, videoElement.videoHeight);
      listeners.forEach(cb => cb(detections));
    }

    animationFrameId = requestAnimationFrame(run);
  }

  function processOutput(output: ort.Tensor, videoWidth: number, videoHeight: number): Detection[] {
    const boxes: [number, number, number, number][] = [];
    const scores: number[] = [];
    const classIndices: number[] = [];
    const modelClasses = models[modelName].classes;
    const [modelWidth, modelHeight] = models[modelName].inputShape.slice(2);

    for (let i = 0; i < output.dims[2]; i++) {
      const data = output.data.slice(i * output.dims[1], (i + 1) * output.dims[1]) as Float32Array;
      const confidence = data[4];
      if (confidence < 0.45) continue; // Confidence threshold

      const classScores = data.slice(5);
      let maxScore = 0;
      let classIdx = -1;
      classScores.forEach((score, idx) => {
        if (score > maxScore) {
          maxScore = score;
          classIdx = idx;
        }
      });

      if (maxScore > 0.25) { // Class score threshold
        const [x_center, y_center, w, h] = data.slice(0, 4);
        const x1 = (x_center - w / 2) / modelWidth * videoWidth;
        const y1 = (y_center - h / 2) / modelHeight * videoHeight;
        const x2 = (x_center + w / 2) / modelWidth * videoWidth;
        const y2 = (y_center + h / 2) / modelHeight * videoHeight;
        boxes.push([x1, y1, x2, y2]);
        scores.push(confidence);
        classIndices.push(classIdx);
      }
    }

    const nmsIndices = nonMaxSuppression(boxes, scores, 0.45); // IOU threshold
    const finalDetections: Detection[] = [];
    nmsIndices.forEach(idx => {
      const [x1, y1, x2, y2] = boxes[idx];
      finalDetections.push({
        cls: modelClasses[classIndices[idx]],
        score: scores[idx],
        box: [x1, y1, x2 - x1, y2 - y1],
      });
    });

    return finalDetections;
  }

  return {
    async start(video, opts) {
      if (isRunning) return;
      await initialize();
      videoElement = video;
      targetFps = opts?.fps ?? 15;
      isRunning = true;
      run();
    },
    stop() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      isRunning = false;
      videoElement = null;
      animationFrameId = null;
    },
    onDetections(cb) {
      listeners.push(cb);
      return () => {
        listeners = listeners.filter(l => l !== cb);
      };
    },
    takeFrame() {
      const frameCanvas = document.createElement('canvas');
      if (videoElement) {
        frameCanvas.width = videoElement.videoWidth;
        frameCanvas.height = videoElement.videoHeight;
        frameCanvas.getContext('2d')?.drawImage(videoElement, 0, 0);
      }
      return frameCanvas;
    },
    ready: () => !!session,
    info: () => ({ ep: executionProvider, fps: targetFps, model: modelName }),
  };
}