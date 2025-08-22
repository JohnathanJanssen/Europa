import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as faceapi from '@vladmandic/face-api';
import { faceDb } from './face/db';
import { speak } from '../runtime/voice';
import { think } from './thoughts/bus';
import { scanCenterText } from './skills/ocr';
import { detectMotion } from './skills/motion';
import { detectNovelty } from './skills/novelty';
import { detectQR } from './skills/qr';
import { detectScene } from './skills/scene';
import { Face, Insight, OCRHit, Pose, QRHit, SceneSense, Det } from './types';

export type { Det } from './types';

export type Detection = {
  box: [number, number, number, number]; // [x, y, width, height]
  label: string;
  score: number;
  trackId?: string;
};

export class VisionEngine {
  private video: HTMLVideoElement | null = null;
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private poseDetector: posedetection.PoseDetector | null = null;
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private isRunning: boolean = false;
  private lastDetectionTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    // Initialize models in init()
  }

  async init() {
    if (this.cocoSsdModel && this.poseDetector && this.mobilenetModel) {
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
    if (!this.isRunning || !this.video || !this.cocoSsdModel || !this.poseDetector || !this.mobilenetModel) {
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
        // trackId does not exist on DetectedObject, it will be added in the panel
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

    for (const fd of faceDetections) {
      detections.push({
        box: [fd.detection.box.x, fd.detection.box.y, fd.detection.box.width, fd.detection.box.height],
        label: 'face',
        score: fd.detection.score,
        // trackId does not exist on FaceDetection, it will be added in the panel
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

    // Convert Detection[] to Det[] for detectNovelty
    const detObjects: Det[] = detections.map(d => ({
      x: d.box[0],
      y: d.box[1],
      w: d.box[2],
      h: d.box[3],
      label: d.label,
      score: d.score,
      trackId: d.trackId
    }));

    // Novelty Detection
    const noveltyInsight = detectNovelty(detObjects, this.frameCount);
    if (noveltyInsight) {
      insights.push(noveltyInsight);
    }

    onDetections(detections);

    requestAnimationFrame(() => this.detectFrame(onDetections));
  }
}