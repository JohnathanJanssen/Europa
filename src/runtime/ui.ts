export type Panel = 'home'|'settings'|'terminal'|'vision';
type SpotlightAPI = { open(panel?: Panel): void; close(): void };

let spotlight: SpotlightAPI | null = null;
export function registerSpotlight(api: SpotlightAPI){ spotlight = api; }
export function openSpotlight(panel?: Panel){ spotlight?.open(panel); }
export function closeSpotlight(){ spotlight?.close(); }