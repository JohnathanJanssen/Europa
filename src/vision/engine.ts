import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as faceapi from '@vladmandic/face-api';
import { FaceDB } from './face/db';
import { speak } from '../runtime/voice';
import { think } from './thoughts/bus';
import { scanCenterText } from './skills/ocr';
import { detectMotion } from './skills/motion';
import { detectNovelty } from './skills/novelty';
import { detectQR } from './skills/qr';
import { detectScene } from './skills/scene';
import { Face, Insight, OCRHit, Pose, QRHit, SceneSense } from './types';

// Re-export Det from types.ts to ensure consistency
export type { Det } from './types';

export type Detection = {
  box: [number, number, number, number]; // [x, y, width, height]
  label: string;
  score: number;
  trackId?: string; // Added trackId here
};

export class VisionEngine {
  private video: HTMLVideoElement | null = null;
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private poseDetector: posedetection.PoseDetector | null = null;
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private faceDb: FaceDB | null = null;
  private isRunning: boolean = false;
  private lastDetectionTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    // Initialize models in init()
  }

  async init() {
    if (this.cocoSsdModel && this.poseDetector && this.mobilenetModel && this.faceDb) {
      return; // Already initialized
    }

    think("Loading vision models...");
    await tf.setBackend('webgl'); // Use WebGL for better performance

    this.cocoSsdModel = await cocoSsd.load();
    think("COCO-SSD loaded.");

    const detectorConfig = {
      modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    };
    this.poseDetector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, detectorConfig);
    think("PoseNet loaded.");

    this.mobilenetModel = await mobilenet.load();
    think("MobileNet loaded.");

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    this.faceDb = new FaceDB();
    think("FaceAPI loaded.");

    think("Vision models ready.");
  }

  start(video: HTMLVideoElement, onDetections: (detections: Detection[]) => void) {
    this.video = video;
    this.isRunning = true;
    this.detectFrame(onDetections);
  }

  stop() {
    this.isRunning = false;
    this.video = null;
  }

  private async detectFrame(onDetections: (detections: Detection[]) => void) {
    if (!this.isRunning || !this.video || !this.cocoSsdModel || !this.poseDetector || !this.mobilenetModel || !this.faceDb) {
      return;
    }

    this.frameCount++;
    const now = Date.now();

    const detections: Detection[] = [];
    const insights: Insight[] = [];

    // Object Detection (COCO-SSD)
    const cocoDetections = await this.cocoSsdModel.detect(this.video);
    cocoDetections.forEach(d => {
      detections.push({
        box: [d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3]],
        label: d.class,
        score: d.score,
        trackId: d.trackId // Assuming coco-ssd provides trackId
      });
    });

    // Pose Detection (MoveNet)
    const poses: Pose[] = [];
    const poseEstimates = await this.poseDetector.estimatePoses(this.video);
    poseEstimates.forEach(p => {
      poses.push({
        keypoints: p.keypoints.map(kp => ({ x: kp.x, y: kp.y, score: kp.score ?? 0 })),
        score: p.score ?? 0
      });
    });
    if (poses.length > 0) {
      // Add pose detections to overall detections if needed, or process separately
    }

    // Face Detection and Recognition (face-api.js)
    const faceDetections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();

    const faces: Face[] = [];
    for (const fd of faceDetections) {
      const bestMatch = this.faceDb.findBestMatch(fd.descriptor);
      const face: Face = {
        x: fd.detection.box.x,
        y: fd.detection.box.y,
        w: fd.detection.box.width,
        h: fd.detection.box.height,
        name: bestMatch.label,
        distance: bestMatch.distance,
        descriptor: Array.from(fd.descriptor),
        isNew: bestMatch.label === 'unknown' && bestMatch.distance > 0.6 // Heuristic for new unknown face
      };
      faces.push(face);
      detections.push({
        box: [face.x, face.y, face.w, face.h],
        label: face.name || 'face',
        score: fd.detection.score,
        trackId: fd.detection.trackId // Assuming face-api provides trackId
      });
    }

    // OCR
    const ocrResult: OCRHit | null = await scanCenterText(this.video);
    if (ocrResult) {
      // Process OCR result
    }

    // QR Code Detection
    const qrResult: QRHit | null = await detectQR(this.video);
    if (qrResult) {
      // Process QR result
    }

    // Scene Sense
    const sceneSenseResult: SceneSense | null = await detectScene(this.video, this.mobilenetModel);
    if (sceneSenseResult) {
      // Process scene sense result
    }

    // Motion Detection
    const motionInsight = detectMotion(this.video);
    if (motionInsight) {
      insights.push(motionInsight);
    }

    // Novelty Detection
    const noveltyInsight = detectNovelty(detections, this.frameCount);
    if (noveltyInsight) {
      insights.push(noveltyInsight);
    }

    onDetections(detections); // Pass all detections to the callback

    requestAnimationFrame(() => this.detectFrame(onDetections));
  }
}