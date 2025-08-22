type Listener<T> = (v: T) => void;

class Emitter<T=any> {
  private ls = new Set<Listener<T>>();
  on(fn: Listener<T>) { this.ls.add(fn); return () => { this.ls.delete(fn); }; } // Ensure void return
  emit(v: T) { this.ls.forEach(fn => { try { fn(v); } catch {} }); }
}

class VisionBus {
  private online = false;
  readonly onOnline = new Emitter<boolean>();
  readonly onAskIdentity = new Emitter<void>();
  readonly onEnroll = new Emitter<string>(); // name

  setOnline(v: boolean) {
    if (this.online !== v) { this.online = v; this.onOnline.emit(v); }
  }
  isOnline() { return this.online; }

  requestIdentity() { this.onAskIdentity.emit(); }
  enroll(name: string) { this.onEnroll.emit(name); }
}

export const visionBus = new VisionBus();