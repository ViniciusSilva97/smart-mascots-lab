import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { Expression, Motion } from './motion-engine'

export type ByteRenderMode = '2d' | '3d'

export class Byte3DView {
  private readonly host: HTMLElement
  private readonly fallback: HTMLElement
  private readonly canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer | null = null
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(28, 230 / 250, 0.1, 100)
  private readonly clock = new THREE.Clock()
  private model: THREE.Group | null = null
  private head: THREE.Object3D | null = null
  private leftArm: THREE.Object3D | null = null
  private rightArm: THREE.Object3D | null = null
  private mode: ByteRenderMode = '2d'
  private motion: Motion = 'idle'
  private expression: Expression | null = null
  private frame: number | null = null
  private destroyed = false

  constructor(host: HTMLElement, fallback: HTMLElement) {
    this.host = host
    this.fallback = fallback
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'byte-3d-canvas'
    this.canvas.setAttribute('aria-label', 'Byte, mascote 3D')
    this.host.append(this.canvas)
    this.host.dataset.renderMode = '2d'
    this.host.dataset.modelStatus = 'loading'

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })
    } catch {
      this.host.dataset.modelStatus = 'unsupported'
      return
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setSize(230, 250, false)
    this.camera.position.set(0, 2.1, 10.5)
    this.camera.lookAt(0, 2.1, 0)

    this.scene.add(new THREE.HemisphereLight(0xcafcff, 0x121820, 2.4))
    const key = new THREE.DirectionalLight(0xffdf78, 3.2)
    key.position.set(4, 7, 6)
    this.scene.add(key)

    void this.loadModel()
    this.frame = requestAnimationFrame(this.render)
  }

  setMode(mode: ByteRenderMode): ByteRenderMode {
    const effectiveMode = mode === '3d' && !this.renderer ? '2d' : mode
    this.mode = effectiveMode
    this.host.dataset.renderMode = effectiveMode
    this.fallback.setAttribute('aria-hidden', String(effectiveMode === '3d'))
    this.canvas.setAttribute('aria-hidden', String(effectiveMode === '2d'))
    return effectiveMode
  }

  setMotion(motion: Motion): void { this.motion = motion }
  setExpression(expression: Expression | null): void { this.expression = expression }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
    this.renderer?.dispose()
    this.canvas.remove()
  }

  private async loadModel(): Promise<void> {
    try {
      const gltf = await new GLTFLoader().loadAsync('/models/byte-proxy.glb')
      if (this.destroyed) return
      this.model = gltf.scene
      this.model.scale.setScalar(1.05)
      this.scene.add(this.model)
      this.head = this.model.getObjectByName('ByteHead') ?? null
      this.leftArm = this.model.getObjectByName('ByteArmLeft') ?? null
      this.rightArm = this.model.getObjectByName('ByteArmRight') ?? null
      this.host.dataset.modelStatus = 'ready'
    } catch {
      this.host.dataset.modelStatus = 'error'
    }
  }

  private readonly render = (): void => {
    if (this.destroyed) return
    const time = this.clock.getElapsedTime()
    if (this.model) {
      const reduced = this.host.closest('[data-motion-mode="reduced"]') !== null
      const amount = reduced ? 0.15 : 1
      this.model.position.y = Math.sin(time * 2.2) * 0.035 * amount
      this.model.rotation.y = Math.sin(time * 0.55) * 0.06 * amount
      if (this.head) {
        this.head.rotation.z = (this.expression === 'curious' ? 0.13 : 0) + Math.sin(time * 1.2) * 0.015 * amount
        this.head.rotation.y = this.motion === 'think' ? Math.sin(time * 1.8) * 0.18 * amount : 0
      }
      if (this.leftArm && this.rightArm) {
        const walk = this.motion === 'walk' ? Math.sin(time * 8) * 0.42 * amount : 0
        this.leftArm.rotation.x = walk
        this.rightArm.rotation.x = this.motion === 'point' ? -1.15 * amount : -walk
        this.leftArm.rotation.z = this.motion === 'celebrate' ? 1.7 * amount : 0
        this.rightArm.rotation.z = this.motion === 'celebrate' ? -1.7 * amount : 0
      }
      if (this.motion === 'jump') this.model.position.y += Math.max(0, Math.sin(time * 5)) * 0.18 * amount
    }
    if (this.mode === '3d') this.renderer?.render(this.scene, this.camera)
    this.frame = requestAnimationFrame(this.render)
  }
}
