import * as THREE from 'three';
import {contentBounds} from './viewport';
/** The preserved C++ compositor owns sprite coordinates and animation sequencing. */
export class GameRenderer {
  private renderer:THREE.WebGLRenderer;
  private texture:THREE.CanvasTexture;
  private scene=new THREE.Scene();
  private camera=new THREE.OrthographicCamera(-160,160,100,-100,.1,10);
  constructor(private canvas:HTMLCanvasElement,source:HTMLCanvasElement){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false});
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.texture=new THREE.CanvasTexture(source);
    this.texture.colorSpace=THREE.SRGBColorSpace;
    this.texture.minFilter=this.texture.magFilter=THREE.NearestFilter;
    this.texture.generateMipmaps=false;
    this.camera.position.z=1;
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(320,200),new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false})));
    new ResizeObserver(()=>this.resize()).observe(canvas);
    this.resize();
  }
  private resize(){const r=this.canvas.getBoundingClientRect();const w=Math.max(1,Math.round(r.width*devicePixelRatio)),h=Math.max(1,Math.round(r.height*devicePixelRatio));this.renderer.setSize(w,h,false);const v=contentBounds(w,h);this.renderer.setViewport(v.x,v.y,v.width,v.height);}
  render(){this.texture.needsUpdate=true;this.renderer.render(this.scene,this.camera);}
}
