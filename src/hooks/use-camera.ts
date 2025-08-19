import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface CameraConstraints {
  video: MediaTrackConstraints;
  audio: boolean;
}

const defaultConstraints: CameraConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      return videoDevices;
    } catch (err) {
      setError("Could not enumerate camera devices.");
      return [];
    }
  }, []);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsActive(false);
  }, [stream]);

  const start = useCallback(async (constraints: CameraConstraints = defaultConstraints) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = "Camera functionality is not supported in this browser.";
      setError(msg);
      toast.error(msg);
      return;
    }
    stop(); // Stop any existing stream first
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsActive(true);
    } catch (err) {
      let message = "An unknown error occurred while accessing the camera.";
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          message = "Camera permission denied. Please check your browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          message = "No camera device found that matches the request.";
        }
      }
      setError(message);
      toast.error(message);
      setIsActive(false);
    }
  }, [stop]);

  const takeSnapshot = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
        toast.error("Camera is not active or ready.");
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob), 'image/png');
      } else {
        toast.error("Could not create canvas context for snapshot.");
        resolve(null);
      }
    });
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    takeSnapshot,
    isActive,
    error,
    videoRef,
    devices,
  };
}