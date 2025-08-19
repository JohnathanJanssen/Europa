import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useCamera() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(stream);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast.error("Could not access camera. Please check permissions.");
        setIsCameraOn(false);
      }
    } else {
      toast.error("Camera not supported on this device.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const captureFrame = useCallback((): string | null => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
      }
    }
    toast.error("Camera is not ready to capture frame.");
    return null;
  }, [videoRef]);

  return {
    isCameraOn,
    startCamera,
    stopCamera,
    captureFrame,
    videoRef,
  };
}