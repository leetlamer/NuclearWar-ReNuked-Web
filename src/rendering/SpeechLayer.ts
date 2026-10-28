import * as THREE from "three";
import type { WasmModule } from "../engine/GameBridge";
import { GAME_WIDTH, GAME_HEIGHT } from "./viewport";
export type SpeechGlyph = [
  source: number,
  x: number,
  y: number,
  width: number,
  height: number,
];
/** Only speech ink bypasses SDL's low-resolution rasterization. Bubble/layout,
 * wrapping and character reveal still come from the unchanged C++ presentation. */
export class SpeechLayer {
  readonly mesh: THREE.Mesh;
  private geometry = new THREE.BufferGeometry();
  private positions = new THREE.BufferAttribute(
    new Float32Array(52 * 6 * 3),
    3,
  );
  private uvs = new THREE.BufferAttribute(new Float32Array(52 * 6 * 2), 2);
  private previous = "";
  private fontWidth: number;
  constructor(private module: WasmModule) {
    const font = JSON.parse(module.UTF8ToString(module._web_speech_font())) as {
      width: number;
      height: number;
      pixels: number[];
    };
    this.fontWidth = font.width;
    const texture = new THREE.DataTexture(
      new Uint8Array(font.pixels),
      font.width,
      font.height,
      THREE.RGBAFormat,
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.needsUpdate = true;
    this.geometry.setAttribute("position", this.positions);
    this.geometry.setAttribute("uv", this.uvs);
    this.geometry.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(
      this.geometry,
      new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xbb0000,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;
  }
  sync() {
    const raw = this.module.UTF8ToString(this.module._web_speech_frame());
    if (raw === this.previous) return;
    this.previous = raw;
    const glyphs = JSON.parse(raw) as SpeechGlyph[];
    if (glyphs.length > 52)
      throw Error("Speech glyph batch exceeds two original 26-column lines");
    let vertex = 0;
    for (const [offset, x, y, w, h] of glyphs) {
      const left = x - GAME_WIDTH / 2,
        right = left + w,
        top = GAME_HEIGHT / 2 - y,
        bottom = top - h;
      const u0 = offset / this.fontWidth,
        u1 = (offset + 6) / this.fontWidth;
      // Typed RGBA atlas row zero is sampled with v=0 at the logical top edge.
      for (const [px, py, u, v] of [
        [left, top, u0, 0],
        [left, bottom, u0, 1],
        [right, top, u1, 0],
        [left, bottom, u0, 1],
        [right, bottom, u1, 1],
        [right, top, u1, 0],
      ]) {
        this.positions.setXYZ(vertex, px, py, 0);
        this.uvs.setXY(vertex, u, v);
        vertex++;
      }
    }
    this.positions.needsUpdate = this.uvs.needsUpdate = true;
    this.geometry.setDrawRange(0, vertex);
  }
}
