import { Detection } from "@/vision/engine";

interface SenseInput {
  detections: Detection[];
  ocrText?: string;
  userContext?: string; // e.g., current conversation topic
}

interface SenseOutput {
  visionContext: string | null;
  shouldSurface: boolean; // Should Jupiter proactively comment?
}

// Keywords that might indicate something important on screen
const CODE_KEYWORDS = ['error', 'warning', 'function', 'const', 'let', 'import', 'export', '=>', '<div>', '</div>'];
const RELEVANT_OBJECTS = ['book', 'laptop', 'keyboard', 'cell phone', 'screen'];

export function integrateVisionContext({ detections, ocrText, userContext = "" }: SenseInput): SenseOutput {
  let visionContext = "";
  let shouldSurface = false;

  // Analyze OCR text
  if (ocrText && ocrText.length > 20) {
    const textIsCode = CODE_KEYWORDS.some(kw => ocrText.includes(kw));
    if (textIsCode) {
      visionContext += `I'm seeing some text that looks like code. It contains: "${ocrText.substring(0, 100)}...". `;
      shouldSurface = true; // High-value content, worth surfacing
    } else {
      // It's just text, add it to context but don't surface unless asked
      visionContext += `There's some text present: "${ocrText.substring(0, 50)}...". `;
    }
  }

  // Analyze detected objects
  const relevantDetections = detections.filter(d => RELEVANT_OBJECTS.includes(d.cls) && d.score > 0.6);
  if (relevantDetections.length > 0) {
    const objectNames = [...new Set(relevantDetections.map(d => d.cls))].join(', ');
    visionContext += `The environment includes objects like: ${objectNames}.`;
    // Only surface if it's a new, important object
    if (objectNames.includes('laptop') && !userContext.includes('laptop')) {
      shouldSurface = true;
    }
  }

  return {
    visionContext: visionContext.trim() || null,
    shouldSurface,
  };
}