export const REDUCED_MOTION_KEY = "apt-reduce-motion";
const CHANGE_EVENT = "apt-reduce-motion-change";

export function subscribeReducedMotion(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function getReducedMotion() {
  return window.localStorage.getItem(REDUCED_MOTION_KEY) === "true";
}

export function setReducedMotion(value: boolean) {
  window.localStorage.setItem(REDUCED_MOTION_KEY, String(value));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
