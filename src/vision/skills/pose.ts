import * as posedetection from '@tensorflow-models/pose-detection';

let detector: posedetection.PoseDetector | null = null;

export async function detectPose(video: HTMLVideoElement | null) {
  if (!video) return null;
  if (!detector) {
    detector = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
  }
  const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: true });
  const p = poses[0]; if (!p) return null;
  return { score: (p.score ?? 0) as number, keypoints: p.keypoints } as any;
}

export async function disposePose() { await detector?.dispose(); detector = null; }