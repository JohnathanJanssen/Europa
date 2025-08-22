type L<T> = (v: T) => void;
class E<T=any>{ private s=new Set<L<T>>(); on(f:L<T>){this.s.add(f);return()=>{this.s.delete(f);};} emit(v:T){this.s.forEach(fn=>{try{fn(v);}catch{}});} }

class VisionBus {
  private online=false;
  private gate = { waiting:false, lastSig:'', lastAskAt:0 };
  readonly onOnline      = new E<boolean>();
  readonly onAskIdentity = new E<{sig:string}>();
  readonly onEnroll      = new E<{name:string,sig?:string}>();

  isOnline(){return this.online;}
  setOnline(v:boolean){ if(v!==this.online){ this.online=v; this.onOnline.emit(v); } }

  requestIdentity(sig:string){
    const now=Date.now(), cool=90_000;
    if(this.gate.waiting) return;
    if(sig===this.gate.lastSig && now-this.gate.lastAskAt<cool) return;
    this.gate.waiting=true; this.gate.lastSig=sig; this.gate.lastAskAt=now;
    this.onAskIdentity.emit({sig});
  }

  enroll(name:string, sig?:string){
    this.gate.waiting=false;
    if(sig) this.gate.lastSig=sig;
    this.onEnroll.emit({name, sig});
  }
}
export const visionBus = new VisionBus();