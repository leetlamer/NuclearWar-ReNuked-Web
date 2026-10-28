import * as THREE from "three";
import { contentBounds, GAME_WIDTH, GAME_HEIGHT } from "./viewport";
/** The preserved C++ compositor owns sprite coordinates and animation sequencing. */
export class GameRenderer {
  private renderer: THREE.WebGLRenderer;
  private pixelRatio = 0;
  private texture: THREE.CanvasTexture;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(
    -GAME_WIDTH / 2,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    -GAME_HEIGHT / 2,
    0.1,
    10,
  );
  constructor(
    private canvas: HTMLCanvasElement,
    source: HTMLCanvasElement,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.texture = new THREE.CanvasTexture(source);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.camera.position.z = 1;
    this.scene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(GAME_WIDTH, GAME_HEIGHT),
        new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
      ),
    );
    new ResizeObserver(() => this.resize()).observe(canvas);
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    this.resize();
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("debugRender")
    ) {
      void import("./RenderDiagnostics").then(({ attachDiagnostics }) =>
        attachDiagnostics(canvas, () => this.diagnostics()),
      );
    }
  }
  diagnostics() {
    if (!import.meta.env.DEV) return null;
    const css = this.canvas.getBoundingClientRect();
    const viewport = new THREE.Vector4();
    this.renderer.getCurrentViewport(viewport);
    const camera = this.camera;
    return {
      css: { width: css.width, height: css.height },
      buffer: { width: this.canvas.width, height: this.canvas.height },
      source: {
        width: this.texture.image.width,
        height: this.texture.image.height,
      },
      dpr: devicePixelRatio,
      fitScale: Math.min(css.width / GAME_WIDTH, css.height / GAME_HEIGHT),
      active: contentBounds(css.width, css.height),
      viewport: viewport.toArray(),
      camera: {
        left: camera.left,
        right: camera.right,
        top: camera.top,
        bottom: camera.bottom,
        zoom: camera.zoom,
        position: camera.position.toArray(),
      },
      scene: {
        position: this.scene.position.toArray(),
        scale: this.scene.scale.toArray(),
      },
      mesh: this.scene.children.map((x) => ({
        position: x.position.toArray(),
        scale: x.scale.toArray(),
      })),
    };
  }
  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * devicePixelRatio)),
      h = Math.max(1, Math.round(r.height * devicePixelRatio));
    this.pixelRatio = devicePixelRatio;
    if (this.canvas.width !== w || this.canvas.height !== h)
      this.renderer.setSize(w, h, false);
    const v = contentBounds(w, h);
    this.renderer.setViewport(v.x, v.y, v.width, v.height);
  }
  render() {
    // A monitor/DPR change may not change the observed CSS dimensions.
    if (this.pixelRatio !== devicePixelRatio) this.resize();
    this.texture.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}
