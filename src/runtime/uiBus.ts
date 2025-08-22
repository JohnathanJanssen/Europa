type Mode = 'front' | 'vision' | 'settings' | 'terminal';
type Listener = (m: Mode) => void;

class UIBus {
  private mode: Mode = 'front';
  private L = new Set<Listener>();
  get() { return this.mode; }
  set(m: Mode) { if (m !== this.mode) { this.mode = m; this.L.forEach(fn=>fn(m)); } }
  on(fn: Listener) { this.L.add(fn); return () => { this.L.delete(fn); }; } // Explicitly return void
  openVision()   { this.set('vision'); }
  openSettings() { this.set('settings'); }
  openTerminal() { this.set('terminal'); }
  back()         { this.set('front'); }
}
export const uiBus = new UIBus();