/** Authoritative SDL logical framebuffer; independent of texture or display DPI. */
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 200;
export function contentBounds(width: number, height: number) {
  const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  const w = GAME_WIDTH * scale,
    h = GAME_HEIGHT * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
/** Coordinates relative to the canvas CSS rectangle, including letterboxing. */
export function logicalToDisplay(
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const v = contentBounds(width, height);
  return {
    x: v.x + (x * v.width) / GAME_WIDTH,
    y: v.y + (y * v.height) / GAME_HEIGHT,
  };
}
export function displayToLogical(
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const v = contentBounds(width, height);
  return {
    x: Math.floor(((x - v.x) * GAME_WIDTH) / v.width),
    y: Math.floor(((y - v.y) * GAME_HEIGHT) / v.height),
  };
}
