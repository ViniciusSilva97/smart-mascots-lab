import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type {
  Expression,
  InteractionState,
  JumpState,
  LocomotionState,
  Motion,
} from './motion-engine'

export type ByteRenderMode = '2d' | '3d'

export class Byte3DView {
  private readonly host: HTMLElement
  private readonly anchor: HTMLElement
  private readonly fallback: HTMLElement
  private readonly canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer | null = null
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  private readonly clock = new THREE.Clock()
  private readonly resizeObserver: ResizeObserver
  private readonly products = new Map<string, THREE.Group>()
  private readonly productOrigins = new Map<string, THREE.Vector3>()
  private model: THREE.Group | null = null
  private head: THREE.Object3D | null = null
  private leftArm: THREE.Object3D | null = null
  private rightArm: THREE.Object3D | null = null
  private leftLeg: THREE.Object3D | null = null
  private rightLeg: THREE.Object3D | null = null
  private leftEye: THREE.Object3D | null = null
  private rightEye: THREE.Object3D | null = null
  private antenna: THREE.Object3D | null = null
  private leftEyeOrigin = new THREE.Vector3()
  private rightEyeOrigin = new THREE.Vector3()
  private mode: ByteRenderMode = '2d'
  private motion: Motion = 'idle'
  private expression: Expression | null = null
  private locomotion: LocomotionState = 'idle'
  private jump: JumpState = 'grounded'
  private interaction: InteractionState = 'idle'
  private gaze = new THREE.Vector2()
  private facing: -1 | 1 = 1
  private speed = 1
  private scale = 1
  private positionPixels = 0
  private activeProduct: string | null = null
  private elapsed = 0
  private frame: number | null = null
  private destroyed = false

  constructor(host: HTMLElement, anchor: HTMLElement, fallback: HTMLElement) {
    this.host = host
    this.anchor = anchor
    this.fallback = fallback
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'byte-3d-canvas'
    this.canvas.setAttribute('aria-label', 'Byte, mascote 3D')
    this.host.append(this.canvas)
    this.host.dataset.renderMode = '2d'
    this.anchor.dataset.renderMode = '2d'
    this.anchor.dataset.modelStatus = 'loading'

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })
    } catch {
      this.anchor.dataset.modelStatus = 'unsupported'
      this.resizeObserver = new ResizeObserver(() => undefined)
      return
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.camera.position.set(0, 5.4, 13.5)
    this.camera.lookAt(0, 2.15, 0)

    this.scene.add(new THREE.HemisphereLight(0xcafcff, 0x121820, 2.4))
    const key = new THREE.DirectionalLight(0xffdf78, 3.2)
    key.position.set(4, 7, 6)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x4deeff, 1.8)
    rim.position.set(-5, 4, -3)
    this.scene.add(rim)

    const grid = new THREE.GridHelper(14, 28, 0x315e62, 0x20363a)
    grid.position.y = 0.01
    this.scene.add(grid)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 8),
      new THREE.MeshStandardMaterial({ color: 0x101918, roughness: 0.92, metalness: 0.05 }),
    )
    floor.rotation.x = -Math.PI / 2
    this.scene.add(floor)

    this.createProductScene()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    this.resize()

    void this.loadModel()
    this.frame = requestAnimationFrame(this.render)
  }

  setMode(mode: ByteRenderMode): ByteRenderMode {
    const effectiveMode = mode === '3d' && !this.renderer ? '2d' : mode
    this.mode = effectiveMode
    this.host.dataset.renderMode = effectiveMode
    this.anchor.dataset.renderMode = effectiveMode
    this.fallback.setAttribute('aria-hidden', String(effectiveMode === '3d'))
    this.canvas.setAttribute('aria-hidden', String(effectiveMode === '2d'))
    return effectiveMode
  }

  setMotion(motion: Motion): void { this.motion = motion }
  setExpression(expression: Expression | null): void { this.expression = expression }
  setLocomotionState(state: LocomotionState): void {
    this.locomotion = state
    this.anchor.dataset.locomotion3d = state
  }
  setJumpState(state: JumpState): void { this.jump = state }
  setInteractionState(state: InteractionState): void {
    this.interaction = state
    this.anchor.dataset.interaction3d = state
    if (state === 'idle') this.activeProduct = null
  }
  lookAt(x: number, y: number): void {
    this.gaze.set(x, y)
    this.anchor.dataset.gazeX = x.toFixed(3)
    this.anchor.dataset.gazeY = y.toFixed(3)
  }
  setFacing(direction: -1 | 1): void { this.facing = direction }
  setSpeed(speed: number): void { this.speed = speed }
  setScale(scale: number): void { this.scale = scale }
  setPositionPixels(position: number): void { this.positionPixels = position }
  setInteractionTarget(label: string): void { this.activeProduct = label }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
    this.renderer?.dispose()
    this.canvas.remove()
  }

  private resize(): void {
    if (!this.renderer) return
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.syncProductOrigins()
  }

  private pixelsToWorld(pixels: number): number {
    return pixels / Math.max(1, this.host.clientWidth) * 10
  }

  private createProductScene(): void {
    const specs = {
      CPU: { color: 0xf2a51a, size: [0.62, 0.72, 0.52] },
      SSD: { color: 0xd9e5e3, size: [0.82, 0.22, 0.52] },
      GPU: { color: 0x58f1b2, size: [1.05, 0.42, 0.42] },
      SERVIDOR: { color: 0xc27d4d, size: [0.9, 1.35, 0.62] },
    } as const

    for (const [label, spec] of Object.entries(specs)) {
      const group = new THREE.Group()
      group.name = `Product${label}`
      const object = new THREE.Mesh(
        new THREE.BoxGeometry(...spec.size),
        new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.48, metalness: 0.34 }),
      )
      object.position.y = spec.size[1] / 2 + 0.18
      group.add(object)
      const detail = new THREE.Mesh(
        new THREE.BoxGeometry(spec.size[0] * 0.55, 0.08, spec.size[2] + 0.03),
        new THREE.MeshStandardMaterial({ color: 0x65f6ff, emissive: 0x24bfcc, emissiveIntensity: 1.6 }),
      )
      detail.position.set(0, object.position.y, spec.size[2] / 2 + 0.03)
      group.add(detail)
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.78, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0x283532, roughness: 0.8, metalness: 0.15 }),
      )
      pedestal.position.y = 0.08
      group.add(pedestal)
      this.products.set(label, group)
      this.productOrigins.set(label, new THREE.Vector3())
      this.scene.add(group)
    }
  }

  private syncProductOrigins(): void {
    const stageRect = this.host.getBoundingClientRect()
    this.host.querySelectorAll<HTMLElement>('.product-target').forEach(target => {
      const label = target.dataset.label
      if (!label) return
      const rect = target.getBoundingClientRect()
      const pixels = rect.left + rect.width / 2 - (stageRect.left + stageRect.width / 2)
      const origin = this.productOrigins.get(label)
      const product = this.products.get(label)
      if (!origin || !product) return
      origin.set(this.pixelsToWorld(pixels), label === 'SERVIDOR' ? 3.05 : 0, -0.35)
      if (!this.activeProduct || this.activeProduct !== label) product.position.copy(origin)
    })
  }

  private updateProducts(delta: number): void {
    for (const [label, product] of this.products) {
      const origin = this.productOrigins.get(label)
      if (!origin) continue
      const target = origin.clone()
      if (label === this.activeProduct && this.model) {
        if (['grabbing', 'carrying'].includes(this.interaction)) {
          target.set(this.model.position.x + this.facing * 0.86, 1.45, 0.25)
        } else if (this.interaction === 'presenting') {
          target.set(this.model.position.x + this.facing * 1.02, 2.55, 0.85)
        }
      }
      product.position.x = THREE.MathUtils.damp(product.position.x, target.x, 8, delta)
      product.position.y = THREE.MathUtils.damp(product.position.y, target.y, 8, delta)
      product.position.z = THREE.MathUtils.damp(product.position.z, target.z, 8, delta)
      product.rotation.y = label === this.activeProduct && this.interaction === 'presenting'
        ? Math.sin(this.elapsed * 1.5) * 0.18
        : THREE.MathUtils.damp(product.rotation.y, 0, 8, delta)
    }
  }

  private async loadModel(): Promise<void> {
    try {
      const gltf = await new GLTFLoader().loadAsync('/models/byte-proxy.glb')
      if (this.destroyed) return
      this.model = gltf.scene
      this.model.scale.setScalar(1.05 * this.scale)
      this.scene.add(this.model)
      this.head = this.model.getObjectByName('ByteHead') ?? null
      this.leftArm = this.model.getObjectByName('ByteArmLeft') ?? null
      this.rightArm = this.model.getObjectByName('ByteArmRight') ?? null
      this.leftLeg = this.model.getObjectByName('ByteLegLeft') ?? null
      this.rightLeg = this.model.getObjectByName('ByteLegRight') ?? null
      this.leftEye = this.model.getObjectByName('ByteEyeLeft') ?? null
      this.rightEye = this.model.getObjectByName('ByteEyeRight') ?? null
      this.antenna = this.model.getObjectByName('ByteAntenna') ?? null
      if (this.leftEye) this.leftEyeOrigin.copy(this.leftEye.position)
      if (this.rightEye) this.rightEyeOrigin.copy(this.rightEye.position)
      this.anchor.dataset.modelStatus = 'ready'
    } catch {
      this.anchor.dataset.modelStatus = 'error'
    }
  }

  private readonly render = (): void => {
    if (this.destroyed) return
    const delta = Math.min(this.clock.getDelta(), 0.05)
    this.elapsed += delta * this.speed
    const time = this.elapsed
    if (this.model) {
      this.model.scale.setScalar(1.05 * this.scale)
      const targetWorldX = this.pixelsToWorld(this.positionPixels)
      this.model.position.x = THREE.MathUtils.damp(this.model.position.x, targetWorldX, 14, delta)
      const reduced = this.host.closest('[data-motion-mode="reduced"]') !== null
      const amount = reduced ? 0.15 : 1
      const walking = this.locomotion === 'walking' || this.interaction === 'approaching' || this.interaction === 'carrying'
      const sideOn = this.locomotion === 'preparing'
        || this.locomotion === 'walking'
        || this.locomotion === 'braking'
        || ['approaching', 'aligning', 'reaching', 'grabbing', 'carrying', 'releasing'].includes(this.interaction)
      const stride = Math.sin(time * (this.speed > 1.2 ? 11 : 8))
      this.model.position.y = (walking ? Math.abs(stride) * 0.07 : Math.sin(time * 2.2) * 0.035) * amount
      const targetYaw = sideOn ? this.facing * Math.PI / 2 : 0
      this.model.rotation.y = THREE.MathUtils.damp(this.model.rotation.y, targetYaw, 9, delta)
      if (this.head) {
        const curious = this.expression === 'curious' || this.interaction === 'out-of-reach'
        this.head.rotation.z = (curious ? 0.13 * this.facing : 0) + Math.sin(time * 1.2) * 0.015 * amount
        this.head.rotation.y = (this.motion === 'think' ? Math.sin(time * 1.8) * 0.18 : this.gaze.x * 0.16) * amount
        this.head.rotation.x = -this.gaze.y * 0.1 * amount
      }
      if (this.leftArm && this.rightArm) {
        const walk = walking ? stride * 0.52 * amount : 0
        this.leftArm.rotation.x = walk
        const reaching = ['reaching', 'grabbing', 'carrying', 'presenting', 'releasing'].includes(this.interaction)
        this.rightArm.rotation.x = reaching ? -1.25 * amount : this.motion === 'point' ? -1.15 * amount : -walk
        this.rightArm.rotation.z = reaching ? -0.35 * this.facing * amount : 0
        this.leftArm.rotation.z = this.motion === 'celebrate' ? 1.7 * amount : 0
        if (this.motion === 'celebrate') this.rightArm.rotation.z = -1.7 * amount
      }
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = walking ? -stride * 0.58 * amount : 0
        this.rightLeg.rotation.x = walking ? stride * 0.58 * amount : 0
        if (this.jump !== 'grounded') {
          this.leftLeg.rotation.x = -0.32 * amount
          this.rightLeg.rotation.x = 0.32 * amount
        }
      }
      const expressionScale: Record<Expression, number> = {
        friendly: 0.82,
        curious: 1.05,
        surprised: 1.35,
        confirming: 0.55,
        focused: 0.48,
      }
      for (const [eye, origin, side] of [
        [this.leftEye, this.leftEyeOrigin, -1],
        [this.rightEye, this.rightEyeOrigin, 1],
      ] as const) {
        if (!eye) continue
        eye.position.x = origin.x + this.gaze.x * 0.09
        eye.position.y = origin.y - this.gaze.y * 0.07
        eye.scale.y = this.expression ? expressionScale[this.expression] : 1
        eye.rotation.z = this.expression === 'friendly' ? side * 0.1 : 0
      }
      if (this.antenna) this.antenna.rotation.z = this.gaze.x * -0.16 * amount
      if (this.interaction === 'out-of-reach') this.model.position.y += Math.max(0, Math.sin(time * 4)) * 0.09 * amount
    }
    this.updateProducts(delta)
    if (this.mode === '3d') this.renderer?.render(this.scene, this.camera)
    this.frame = requestAnimationFrame(this.render)
  }
}
