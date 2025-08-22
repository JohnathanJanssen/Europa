import '@tensorflow/tfjs-backend-webgl';
import * as posedet from '@tensorflow-models/pose-detection';
let detector: posedet.PoseDetector | null = null;

export async function ensurePose() {
  if (detector) return detector;
  detector = await posedet.createDetector(posedet.SupportedModels.MoveNet, {
    modelType: 'Lightning',
    enableSmoothing: true,
  });
  return detector;
}

export async function detectPose(video: HTMLVideoElement) {
  const det = await ensurePose();
  const poses = await det.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
  const p = poses[0];
  if (!p) return null;
  return {
    keypoints: p.keypoints.map(k=>({ x:k.x, y:k.y, score:k.score||0 })),
    score: p.score || 0
  };
}