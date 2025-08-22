export function pulse(strength=0.9){
  window.dispatchEvent(new CustomEvent("cosmos:pulse",{detail:{strength}}));
}