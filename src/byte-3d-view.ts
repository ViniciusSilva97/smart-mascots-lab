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
  setLocomotionState(state: LocomotionState): void {
    this.locomotion = state
    this.host.dataset.locomotion3d = state
  }
  setJumpState(state: JumpState): void { this.jump = state }
  setInteractionState(state: InteractionState): void {
    this.interaction = state
    this.host.dataset.interaction3d = state
  }
  lookAt(x: number, y: number): void {
    this.gaze.set(x, y)
    this.host.dataset.gazeX = x.toFixed(3)
    this.host.dataset.gazeY = y.toFixed(3)
  }
  setFacing(direction: -1 | 1): void { this.facing = direction }
  setSpeed(speed: number): void { this.speed = speed }

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
      this.leftLeg = this.model.getObjectByName('ByteLegLeft') ?? null
      this.rightLeg = this.model.getObjectByName('ByteLegRight') ?? null
      this.leftEye = this.model.getObjectByName('ByteEyeLeft') ?? null
      this.rightEye = this.model.getObjectByName('ByteEyeRight') ?? null
      this.antenna = this.model.getObjectByName('ByteAntenna') ?? null
      if (this.leftEye) this.leftEyeOrigin.copy(this.leftEye.position)
      if (this.rightEye) this.rightEyeOrigin.copy(this.rightEye.position)
      this.host.dataset.modelStatus = 'ready'
    } catch {
      this.host.dataset.modelStatus = 'error'
    }
  }

  private readonly render = (): void => {
    if (this.destroyed) return
    const time = this.clock.getElapsedTime() * this.speed
    if (this.model) {
      const reduced = this.host.closest('[data-motion-mode="reduced"]') !== null
      const amount = reduced ? 0.15 : 1
      const walking = this.locomotion === 'walking' || this.interaction === 'approaching' || this.interaction === 'carrying'
      const stride = Math.sin(time * (this.speed > 1.2 ? 11 : 8))
      this.model.position.y = (walking ? Math.abs(stride) * 0.07 : Math.sin(time * 2.2) * 0.035) * amount
      this.model.rotation.y = this.facing === 1 ? 0.14 : -0.14
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
    if (this.mode === '3d') this.renderer?.render(this.scene, this.camera)
    this.frame = requestAnimationFrame(this.render)
  }
}
