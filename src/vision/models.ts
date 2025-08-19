// For now, we'll use a single, well-known model.
// This can be expanded to a manifest of different models.
const YOLOV5N_COCO_URL = "https://cdn.jsdelivr.net/gh/ultralytics/yolov5@master/models/onnx/yolov5n.onnx";

export const models = {
  yolov5n: {
    url: YOLOV5N_COCO_URL,
    // COCO class names
    classes: [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
      'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
      'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
      'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
      'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
      'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
      'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
      'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
      'hair drier', 'toothbrush'
    ],
    inputShape: [1, 3, 640, 640],
  },
};

export function getModelUrl(name: keyof typeof models): string {
  return models[name].url;
}