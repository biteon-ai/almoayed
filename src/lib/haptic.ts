export function hapticPulse(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Unsupported, denied, or silent mode — never block the tap.
  }
}
