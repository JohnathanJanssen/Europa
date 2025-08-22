type Listener<T> = (v: T) => void;
class E<T=any>{ private s=new Set<Listener<T>>(); on(f:Listener<T>){this.s.add(f);return()=>{this.s.delete(f);};} emit(v:T){this.s.forEach(fn=>{try{fn(v);}catch{}});} }

class VisionBus {
  private online=false;
  private askGate = { waiting:false, lastAskAt:0, lastSig:'' };
  readonly onOnline      = new E<boolean>();
  readonly onAskIdentity = new E<{sig:string}>();
  readonly onEnroll      = new E<{name:string,sig?:string}>();

  isOnline(){return this.online;}
  setOnline(v:boolean){ if(v!==this.online){ this.online=v; this.onOnline.emit(v); } }

  /** Call from vision when an unknown face is stably observed. */
  requestIdentity(sig:string){
    const now=Date.now();
    const cool=90_000; // 90s cooldown
    if (this.askGate.waiting) return;                    // already asked, awaiting name
    if (sig===this.askGate.lastSig && now-this.askGate.lastAskAt<cool) return; // same face cooldown
    this.askGate.waiting=true; this.askGate.lastAskAt=now; this.askGate.lastSig=sig;
    this.onAskIdentity.emit({sig});
  }

  /** Call from chat when the user replies with a name. */
  enroll(name:string, sig?:string){
    this.askGate.waiting=false;
    if (sig) this.askGate.lastSig=sig;
    this.onEnroll.emit({name, sig});
  }
}
export const visionBus = new VisionBus();