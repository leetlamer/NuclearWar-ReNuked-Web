/** Center the original 320×200 viewport inside arbitrary browser/fullscreen bounds. */
export function contentBounds(width: number, height: number) {
  const scale = Math.min(width / 320, height / 200);
  const w = 320 * scale,
    h = 200 * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
