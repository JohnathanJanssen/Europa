import { useState, useRef, useCallback, useEffect } from 'react';
import { createVisionEngine, VisionEngine, Detection } from '@/vision/engine';
import { ocrFromCanvas } from '@/vision/skills/ocr';

export function useVision() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engine] = useState(() => createVisionEngine());
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVisionActive, setIsVisionActive] = useState(false);

  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
      setError("Could not enumerate media devices.");
      return [];
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (isCameraActive) stopCamera(); // Stop any existing stream
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: deviceId ? undefined : 'environment',
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') setError('Camera permission denied.');
        else if (err.name === 'NotFoundError') setError('No camera device found.');
        else setError('Could not access camera.');
      } else {
        setError('An unknown error occurred.');
      }
      setIsCameraActive(false);
    }
  }, [isCameraActive]);

  const stopCamera = useCallback(() => {
    if (isVisionActive) stopVision();
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraActive(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream, isVisionActive]);

  const startVision = useCallback(async () => {
    if (!isCameraActive || !videoRef.current || isVisionActive) return;
    await engine.start(videoRef.current);
    setIsVisionActive(true);
  }, [engine, isCameraActive, isVisionActive]);

  const stopVision = useCallback(() => {
    engine.stop();
    setDetections([]);
    setIsVisionActive(false);
  }, [engine]);

  const runOcr = useCallback(async (): Promise<string> => {
    if (!isCameraActive) return "";
    const frame = engine.takeFrame();
    if (frame.width === 0 || frame.height === 0) return "";
    return await ocrFromCanvas(frame);
  }, [engine, isCameraActive]);

  useEffect(() => {
    if (!engine) return;
    const unsubscribe = engine.onDetections(setDetections);
    return () => unsubscribe();
  }, [engine]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    getVideoDevices,
    startCamera,
    stopCamera,
    startVision,
    stopVision,
    runOcr,
    detections,
    isCameraActive,
    isVisionActive,
    error,
    engineInfo: engine.info(),
  };
}