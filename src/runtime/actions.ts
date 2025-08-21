import { openSpotlight, closeSpotlight, type Panel } from './ui.ts';

type Match = { type: 'open'|'close', panel?: Panel };

const OPEN_SETTINGS = /(open|show)\s+(settings|prefs?)/i;
const OPEN_TERMINAL = /(open|show)\s+(terminal|shell)/i;
const OPEN_VISION   = /(open|show)\s+(camera|vision)/i;
const OPEN_SPOT     = /(open|show)\s+(spotlight|panel)/i;
const CLOSE_SPOT    = /(close|hide)\s+(spotlight|panel|it|this)/i;

export function matchAction(text: string): Match | null {
  if (OPEN_SETTINGS.test(text)) return { type:'open', panel:'settings' };
  if (OPEN_TERMINAL.test(text)) return { type:'open', panel:'terminal' };
  if (OPEN_VISION.test(text))   return { type:'open', panel:'vision'   };
  if (OPEN_SPOT.test(text))     return { type:'open', panel:'home'     };
  if (CLOSE_SPOT.test(text))    return { type:'close' };
  return null;
}

export async function performAction(m: Match): Promise<void> {
  if (m.type === 'open') openSpotlight(m.panel);
  else closeSpotlight();
}