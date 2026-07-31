import { gsap } from 'gsap'

export type Motion = 'idle' | 'walk' | 'jump' | 'point' | 'think' | 'celebrate'
export type LocomotionState = 'idle' | 'preparing' | 'walking' | 'braking'
export type JumpState =
  | 'grounded'
  | 'anticipating'
  | 'ascending'
  | 'apex'
  | 'falling'
  | 'landing'
  | 'recovering'
export type Expression = 'friendly' | 'curious' | 'surprised' | 'confirming' | 'focused'
export type AttentionState = 'relaxed' | 'tracking' | Expression
export type InteractionState =
  | 'idle'
  | 'approaching'
  | 'aligning'
  | 'reaching'
  | 'grabbing'
  | 'carrying'
  | 'presenting'
  | 'releasing'
  | 'out-of-reach'

type EngineCallbacks = {
  onMotionChange: (motion: Motion) => void
  onLocomotionStateChange: (state: LocomotionState) => void
  onJumpStateChange: (state: JumpState) => void
  onAttentionStateChange: (state: AttentionState) => void
  onInteractionStateChange: (state: InteractionState) => void
  onExpressionChange: (expression: Expression | null) => void
  onLookAt: (x: number, y: number) => void
  onFacingChange: (direction: -1 | 1) => void
  onSpeedChange: (speed: number) => void
  onActionComplete: () => void
  onProgress: (progress: number) => void
  onPlayStateChange: (paused: boolean) => void
}

export class ByteMotionEngine {
  private readonly wrap: HTMLElement
  private readonly byte: HTMLElement
  private readonly head: HTMLElement
  private readonly antenna: HTMLElement
  private readonly eyes: HTMLElement[]
  private readonly smile: HTMLElement
  private readonly arms: HTMLElement[]
  private readonly legs: HTMLElement[]
  private readonly callbacks: EngineCallbacks
  private timeline: gsap.core.Timeline
  private speed = 1
  private positionX = 0
  private direction: -1 | 1 = 1
  private maxPosition = 340
  private activeMotion: Motion | 'expression' | 'interaction' = 'idle'
  private activeObject: HTMLElement | null = null
  private trackingEnabled = true
  private reducedMotion = false
  private destroyed = false
  private readonly pauseReasons = new Set<'user' | 'visibility'>()

  constructor(root: HTMLElement, callbacks: EngineCallbacks) {
    this.byte = root
    this.wrap = root.parentElement!
    this.head = root.querySelector<HTMLElement>('.head')!
    this.antenna = root.querySelector<HTMLElement>('.antenna')!
    this.eyes = gsap.utils.toArray<HTMLElement>('.eye', root)
    this.smile = root.querySelector<HTMLElement>('.smile')!
    this.arms = gsap.utils.toArray<HTMLElement>('.arm', root)
    this.legs = gsap.utils.toArray<HTMLElement>('.leg', root)
    this.callbacks = callbacks
    this.timeline = gsap.timeline()

    gsap.set([...this.arms, ...this.legs], { transformOrigin: '50% 8%' })
    gsap.set(this.head, { transformOrigin: '50% 100%' })
    this.play('idle')
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true

    this.timeline.kill()
    this.resetActiveObject()
    const targets = [
      this.wrap,
      this.byte,
      this.head,
      this.antenna,
      ...this.eyes,
      this.smile,
      ...this.arms,
      ...this.legs,
    ]
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'transform,opacity' })
    this.pauseReasons.clear()
  }

  play(motion: Motion) {
    this.assertAlive()
    if (motion === 'walk') {
      this.walk(this.direction)
      return
    }
    if (motion === 'jump') {
      this.jump()
      return
    }
    this.activeMotion = motion
    this.callbacks.onMotionChange(motion)
    this.callbacks.onExpressionChange(null)
    this.callbacks.onLocomotionStateChange('idle')
    this.callbacks.onJumpStateChange('grounded')
    this.callbacks.onAttentionStateChange('relaxed')
    this.callbacks.onInteractionStateChange('idle')
    if (this.reducedMotion && motion !== 'idle') {
      this.replaceTimeline(() => this.createReducedFeedback())
      return
    }
    this.replaceTimeline(() => this.createMotion(motion))
  }

  walk(direction: -1 | 1, running = false) {
    this.assertAlive()
    const distance = running ? 320 : 220
    this.walkTo(this.positionX + distance * direction, running)
  }

  walkTo(targetX: number, running = false) {
    this.assertAlive()
    const clampedTarget = gsap.utils.clamp(-this.maxPosition, this.maxPosition, targetX)
    if (Math.abs(clampedTarget - this.positionX) < 12) {
      this.play('idle')
      this.callbacks.onActionComplete()
      return
    }

    this.activeMotion = 'walk'
    this.callbacks.onMotionChange('walk')
    this.callbacks.onExpressionChange(null)
    this.callbacks.onJumpStateChange('grounded')
    this.callbacks.onInteractionStateChange('idle')
    if (this.reducedMotion) {
      this.replaceTimeline(() => this.createReducedFeedback({ relocateX: clampedTarget }))
      return
    }
    this.replaceTimeline(() => this.createLocomotion(this.positionX, clampedTarget, running, true))
  }

  jump(longJump = false) {
    this.assertAlive()
    const distance = longJump ? 230 * this.direction : 0
    const targetX = gsap.utils.clamp(
      -this.maxPosition,
      this.maxPosition,
      this.positionX + distance,
    )

    this.activeMotion = 'jump'
    this.callbacks.onMotionChange('jump')
    this.callbacks.onExpressionChange(null)
    this.callbacks.onLocomotionStateChange('idle')
    this.callbacks.onInteractionStateChange('idle')
    if (this.reducedMotion) {
      this.replaceTimeline(() => this.createReducedFeedback())
      return
    }
    this.replaceTimeline(() => this.createJump(this.positionX, targetX, longJump, true))
  }

  playDemo() {
    this.assertAlive()
    this.activeMotion = 'walk'
    this.callbacks.onMotionChange('walk')
    this.callbacks.onExpressionChange(null)
    this.callbacks.onInteractionStateChange('idle')
    if (this.reducedMotion) {
      this.replaceTimeline(() => this.createReducedFeedback())
      return
    }
    this.replaceTimeline(() => {
      const demo = gsap.timeline()
      return demo
        .addLabel('entrada')
        .add(this.createLocomotion(this.positionX, 210, false, false))
        .addLabel('salto')
        .add(this.createJump(210, 285, true, false))
        .addLabel('observa')
        .add(this.createThink(false))
        .addLabel('apresenta')
        .add(this.createPoint(false))
        .addLabel('comemora')
        .add(this.createCelebrate(false))
        .addLabel('saida')
        .add(this.createLocomotion(285, -210, true, false))
        .call(() => {
          this.positionX = -210
          this.play('idle')
          this.callbacks.onActionComplete()
        })
    })
  }

  togglePause() {
    this.assertAlive()
    if (this.pauseReasons.has('user')) this.pauseReasons.delete('user')
    else this.pauseReasons.add('user')
    this.applyPauseState()
  }

  restart() {
    this.assertAlive()
    this.timeline.restart()
    this.applyPauseState()
  }

  setProgress(progress: number) {
    this.assertAlive()
    this.pauseReasons.add('user')
    this.timeline.progress(progress)
    this.applyPauseState()
  }

  setSpeed(speed: number) {
    this.assertAlive()
    this.speed = speed
    this.timeline.timeScale(speed)
    this.callbacks.onSpeedChange(speed)
  }

  setPageVisible(visible: boolean) {
    this.assertAlive()
    if (visible) this.pauseReasons.delete('visibility')
    else this.pauseReasons.add('visibility')
    this.applyPauseState()
  }

  setReducedMotion(enabled: boolean) {
    this.assertAlive()
    this.reducedMotion = enabled
    this.play('idle')
  }

  setBounds(maxPosition: number) {
    this.assertAlive()
    this.maxPosition = Math.max(60, maxPosition)
    this.positionX = gsap.utils.clamp(-this.maxPosition, this.maxPosition, this.positionX)
    gsap.set(this.wrap, { x: this.positionX })
  }

  setTracking(enabled: boolean) {
    this.assertAlive()
    this.trackingEnabled = enabled
    if (!enabled) this.releaseAttention()
  }

  lookAt(normalizedX: number, normalizedY: number) {
    this.assertAlive()
    if (!this.trackingEnabled || this.activeMotion !== 'idle') return

    const x = gsap.utils.clamp(-1, 1, normalizedX)
    const y = gsap.utils.clamp(-1, 1, normalizedY)
    this.callbacks.onAttentionStateChange('tracking')
    this.callbacks.onLookAt(x, y)

    gsap.to(this.eyes, {
      x: x * 4,
      y: y * 2.5,
      duration: 0.16,
      overwrite: 'auto',
      ease: 'power2.out',
    })
    gsap.to(this.head, {
      rotation: x * 4,
      x: x * 2,
      y: y * 1.5,
      duration: 0.24,
      overwrite: 'auto',
      ease: 'power2.out',
    })
    gsap.to(this.antenna, {
      rotation: x * 7,
      duration: 0.28,
      overwrite: 'auto',
      ease: 'back.out(1.5)',
    })
  }

  releaseAttention() {
    this.assertAlive()
    if (this.activeMotion !== 'idle') return
    this.callbacks.onAttentionStateChange('relaxed')
    this.callbacks.onLookAt(0, 0)
    gsap.to([this.eyes, this.head, this.antenna], {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.3,
      overwrite: 'auto',
      ease: 'power2.out',
    })
  }

  express(expression: Expression, focusDirection: -1 | 1 = this.direction) {
    this.assertAlive()
    this.activeMotion = 'expression'
    this.callbacks.onExpressionChange(expression)
    this.callbacks.onAttentionStateChange(expression)
    this.callbacks.onInteractionStateChange('idle')
    if (this.reducedMotion) {
      this.replaceTimeline(() => this.createReducedFeedback({ direction: focusDirection }))
      return
    }
    this.replaceTimeline(() => this.createExpression(expression, focusDirection))
  }

  interact(target: HTMLElement, targetX: number) {
    this.assertAlive()
    this.activeMotion = 'interaction'
    this.callbacks.onExpressionChange(null)
    this.callbacks.onAttentionStateChange('focused')

    if (this.reducedMotion) {
      const direction = (targetX >= this.positionX ? 1 : -1) as -1 | 1
      this.callbacks.onInteractionStateChange('presenting')
      this.replaceTimeline(() => {
        this.activeObject = target
        return this.createReducedFeedback({ target, direction })
      })
      return
    }

    this.replaceTimeline(() => {
      const fromX = this.positionX
      const direction = (
        Math.abs(targetX - fromX) < 4 ? this.direction : targetX > fromX ? 1 : -1
      ) as -1 | 1
      this.callbacks.onFacingChange(direction)
      const approachX = gsap.utils.clamp(
        -this.maxPosition,
        this.maxPosition,
        targetX - direction * 86,
      )
      const carryX = gsap.utils.clamp(
        -this.maxPosition,
        this.maxPosition,
        approachX - direction * 64,
      )
      const carryDelta = carryX - approachX
      const handOffsetX = -direction * 44
      const activeArm = this.arms[1]

      this.activeObject = target
      target.dataset.held = 'false'

      const timeline = gsap.timeline()
      timeline
        .call(() => this.callbacks.onInteractionStateChange('approaching'))
        .add(this.createLocomotion(fromX, approachX, false, false))
        .call(() => {
          this.direction = direction
          this.callbacks.onInteractionStateChange('aligning')
        })
        .to(this.byte, { scaleX: direction, rotation: 2 * direction, duration: 0.22, ease: 'power2.out' })
        .to(this.head, { rotation: 7 * direction, x: 3 * direction, duration: 0.24, ease: 'power2.out' }, '<')
        .to(this.eyes, { x: 4 * direction, y: 2, scaleY: 0.78, duration: 0.2 }, '<')
        .to(this.antenna, { rotation: 11 * direction, duration: 0.24, ease: 'back.out(1.5)' }, '<')
        .call(() => this.callbacks.onInteractionStateChange('reaching'))
        .to(this.byte, { x: 7 * direction, y: 4, rotation: 5 * direction, duration: 0.28, ease: 'power2.inOut' })
        .to(activeArm, { rotation: -82, x: 5, y: -5, duration: 0.34, ease: 'back.out(1.45)' }, '<')
        .to(this.legs, { rotation: (_index) => _index === 0 ? -7 : 7, duration: 0.25 }, '<')
        .call(() => {
          target.dataset.held = 'true'
          this.callbacks.onInteractionStateChange('grabbing')
        })
        .to(target, {
          x: handOffsetX,
          y: -62,
          rotation: -4 * direction,
          scale: 0.96,
          duration: 0.3,
          ease: 'back.out(1.7)',
        })
        .to(this.smile, { scaleX: 1.45, duration: 0.2 }, '<')
        .to({}, { duration: 0.18 })
        .call(() => this.callbacks.onInteractionStateChange('carrying'))
        .to(this.wrap, { x: carryX, duration: 0.5, ease: 'power1.inOut' })
        .to(target, {
          x: handOffsetX + carryDelta,
          y: -66,
          rotation: 3 * direction,
          duration: 0.5,
          ease: 'power1.inOut',
        }, '<')
        .to(this.legs[0], { rotation: -16, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<')
        .to(this.legs[1], { rotation: 16, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<')
        .to(this.byte, { x: 0, y: -3, rotation: 0, duration: 0.16, yoyo: true, repeat: 3 }, '<')
        .call(() => {
          this.positionX = carryX
          this.callbacks.onInteractionStateChange('presenting')
        })
        .to(activeArm, { rotation: -132, x: 1, y: -12, duration: 0.32, ease: 'back.out(1.8)' })
        .to(target, {
          x: handOffsetX + carryDelta - direction * 4,
          y: -105,
          rotation: 0,
          scale: 1.12,
          duration: 0.34,
          ease: 'back.out(1.9)',
        }, '<')
        .to(this.head, { rotation: -4 * direction, x: -2 * direction, duration: 0.25 }, '<')
        .to(this.eyes, { x: -2 * direction, y: -1, scaleY: 1, duration: 0.2 }, '<')
        .to(this.antenna, { y: -5, rotation: -7 * direction, duration: 0.18, yoyo: true, repeat: 3 }, '<')
        .to({}, { duration: 0.75 })
        .call(() => this.callbacks.onInteractionStateChange('releasing'))
        .to(activeArm, { rotation: -82, x: 5, y: -5, duration: 0.28, ease: 'power2.inOut' })
        .to(target, {
          x: handOffsetX + carryDelta,
          y: -62,
          rotation: -3 * direction,
          scale: 0.96,
          duration: 0.28,
          ease: 'power2.inOut',
        }, '<')
        .to(this.wrap, { x: approachX, duration: 0.5, ease: 'power1.inOut' })
        .to(target, {
          x: handOffsetX,
          y: -62,
          duration: 0.5,
          ease: 'power1.inOut',
        }, '<')
        .to(target, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.38,
          ease: 'back.out(1.6)',
        })
        .call(() => {
          target.dataset.held = 'false'
          this.positionX = approachX
        })
        .to([this.byte, this.head, this.eyes, this.smile, this.antenna, activeArm, this.legs], {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.32,
          ease: 'power2.inOut',
        })
        .call(() => {
          delete target.dataset.held
          this.activeObject = null
          this.callbacks.onInteractionStateChange('idle')
          this.play('idle')
          this.callbacks.onActionComplete()
        })

      return timeline
    })
  }

  inspectOutOfReach(focusDirection: -1 | 1) {
    this.assertAlive()
    this.activeMotion = 'interaction'
    this.callbacks.onExpressionChange(null)
    this.callbacks.onAttentionStateChange('curious')
    this.callbacks.onInteractionStateChange('out-of-reach')

    if (this.reducedMotion) {
      this.replaceTimeline(() => this.createReducedFeedback({ direction: focusDirection }))
      return
    }

    this.replaceTimeline(() => {
      const timeline = gsap.timeline()
      timeline
        .call(() => {
          this.direction = focusDirection
          this.callbacks.onFacingChange(focusDirection)
          this.callbacks.onInteractionStateChange('out-of-reach')
        })
        .to(this.byte, { scaleX: focusDirection, duration: 0.16, ease: 'power2.inOut' })
        .to(this.head, { rotation: 10 * focusDirection, x: 3 * focusDirection, y: -3, duration: 0.28, ease: 'power2.out' })
        .to(this.eyes, { x: 4 * focusDirection, y: -3, scaleY: 1.2, duration: 0.22 }, '<')
        .to(this.antenna, { rotation: 15 * focusDirection, y: -4, duration: 0.25, ease: 'back.out(1.8)' }, '<')
        .to(this.byte, { y: 7, scaleY: 0.9, duration: 0.2, ease: 'power2.in' })
        .to(this.byte, { y: -12, scaleY: 1.06, duration: 0.25, ease: 'power3.out' })
        .to(this.arms[1], { rotation: -158, x: 2, y: -14, duration: 0.3, ease: 'back.out(1.6)' }, '<')
        .to(this.arms[1], { y: -20, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(this.byte, { y: 0, scaleY: 1, duration: 0.28, ease: 'bounce.out' }, '<')
        .to(this.antenna, { rotation: -18 * focusDirection, y: 2, duration: 0.3, ease: 'power2.out' })
        .to(this.head, { rotation: -7 * focusDirection, y: 3, duration: 0.3 }, '<')
        .to(this.smile, { scaleX: 1.5, duration: 0.22, ease: 'back.out(2)' }, '<')
        .to({}, { duration: 0.55 })
        .to([this.byte, this.head, this.eyes, this.smile, this.antenna, this.arms], {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.34,
          ease: 'power2.inOut',
        })
        .call(() => {
          this.callbacks.onInteractionStateChange('idle')
          this.play('idle')
          this.callbacks.onActionComplete()
        })
      return timeline
    })
  }

  private replaceTimeline(createTimeline: () => gsap.core.Timeline) {
    this.syncRenderedPosition()
    this.timeline.kill()
    this.resetActiveObject()
    this.resetPose()
    this.timeline = createTimeline()
    this.timeline
      .timeScale(this.speed)
      .eventCallback('onUpdate', () => this.callbacks.onProgress(this.timeline.progress()))
      .eventCallback('onStart', () => this.callbacks.onPlayStateChange(this.pauseReasons.size > 0))

    if (this.pauseReasons.size > 0) this.timeline.pause(0)
    else this.timeline.play(0)
  }

  private assertAlive() {
    if (this.destroyed) {
      throw new Error('ByteMotionEngine has been destroyed')
    }
  }

  private applyPauseState() {
    const paused = this.pauseReasons.size > 0
    if (paused) this.timeline.pause()
    else this.timeline.resume()
    this.callbacks.onPlayStateChange(paused)
  }

  private syncRenderedPosition() {
    const renderedX = Number(gsap.getProperty(this.wrap, 'x'))
    if (Number.isFinite(renderedX)) {
      this.positionX = gsap.utils.clamp(-this.maxPosition, this.maxPosition, renderedX)
    }
  }

  private resetPose() {
    gsap.killTweensOf([this.wrap, this.byte, this.head, this.antenna, this.eyes, this.smile, this.arms, this.legs])
    gsap.set(this.wrap, { x: this.positionX, y: 0 })
    gsap.set([this.byte, this.head, this.antenna, this.eyes, this.smile, this.arms, this.legs], {
      clearProps: 'x,y,rotation,scaleX,scaleY,opacity',
    })
    gsap.set(this.byte, { scaleX: this.direction })
  }

  private resetActiveObject() {
    if (!this.activeObject) return
    gsap.killTweensOf(this.activeObject)
    gsap.set(this.activeObject, { clearProps: 'transform' })
    delete this.activeObject.dataset.held
    this.activeObject = null
  }

  private createMotion(motion: Motion) {
    switch (motion) {
      case 'point': return this.createPoint()
      case 'think': return this.createThink()
      case 'celebrate': return this.createCelebrate()
      default: return this.createIdle()
    }
  }

  private createIdle() {
    if (this.reducedMotion) {
      return gsap.timeline({ repeat: -1 })
        .to({}, { duration: 2.5 })
        .to(this.eyes, { scaleY: 0.08, duration: 0.06, ease: 'none' })
        .to(this.eyes, { scaleY: 1, duration: 0.08, ease: 'none' })
    }

    const timeline = gsap.timeline({ repeat: -1, repeatRefresh: true })
    timeline
      .to(this.byte, { y: -3, duration: 0.65, ease: 'sine.inOut' })
      .to(this.byte, { y: 0, duration: 0.65, ease: 'sine.inOut' })
      .to({}, { duration: () => gsap.utils.random(0.35, 1.45) })
      .to(this.eyes, { scaleY: 0.08, duration: 0.06, ease: 'none' })
      .to(this.eyes, { scaleY: 1, duration: 0.08, ease: 'none' })
      .to(this.smile, { scaleX: 1.18, duration: 0.2, yoyo: true, repeat: 1 }, '<')
      .to(this.antenna, {
        rotation: () => gsap.utils.random(-6, 6),
        duration: 0.18,
        yoyo: true,
        repeat: 1,
      }, 0.15)
    return timeline
  }

  private createReducedFeedback(options: {
    target?: HTMLElement
    direction?: -1 | 1
    relocateX?: number
  } = {}) {
    const direction = options.direction ?? this.direction
    const timeline = gsap.timeline()

    timeline
      .call(() => {
        this.direction = direction
        if (options.relocateX !== undefined) {
          this.positionX = options.relocateX
          gsap.set(this.wrap, { x: options.relocateX })
        }
        gsap.set(this.byte, { scaleX: direction })
      })
      .to(this.eyes, { scaleY: 0.35, duration: 0.08, yoyo: true, repeat: 1 })
      .to(this.head, { rotation: 2 * direction, duration: 0.12, yoyo: true, repeat: 1 }, '<')
      .to(this.smile, { scaleX: 1.2, duration: 0.12, yoyo: true, repeat: 1 }, '<')

    if (options.target) {
      timeline.to(options.target, {
        scale: 1.05,
        opacity: 0.82,
        duration: 0.14,
        yoyo: true,
        repeat: 1,
      }, '<')
    }

    timeline
      .to([this.head, this.eyes, this.smile], {
        clearProps: 'x,y,rotation,scaleX,scaleY,opacity',
        duration: 0.08,
      })
      .call(() => {
        if (options.target) {
          gsap.set(options.target, { clearProps: 'transform,opacity' })
          this.activeObject = null
        }
        this.callbacks.onInteractionStateChange('idle')
        this.play('idle')
        this.callbacks.onActionComplete()
      })

    return timeline
  }

  private createExpression(expression: Expression, focusDirection: -1 | 1) {
    const timeline = gsap.timeline()

    switch (expression) {
      case 'curious':
        timeline
          .to(this.head, { rotation: -9, x: -3, duration: 0.28, ease: 'back.out(1.6)' })
          .to(this.eyes, { x: -4, y: -2, duration: 0.2 }, '<')
          .to(this.antenna, { rotation: -14, duration: 0.25, ease: 'back.out(2)' }, '<')
          .to(this.arms[1], { rotation: 132, x: -5, y: -8, duration: 0.35, ease: 'back.out(1.5)' }, '<')
          .to({}, { duration: 0.75 })
        break
      case 'surprised':
        timeline
          .to(this.byte, { y: -13, scaleY: 1.06, duration: 0.18, ease: 'back.out(2.4)' })
          .to(this.eyes, { scaleX: 1.45, scaleY: 1.45, duration: 0.16 }, '<')
          .to(this.smile, { scaleX: 0.5, scaleY: 2.1, y: -1, duration: 0.16 }, '<')
          .to(this.antenna, { y: -7, duration: 0.16, ease: 'back.out(2)' }, '<')
          .to({}, { duration: 0.55 })
          .to(this.byte, { y: 0, scaleY: 1, duration: 0.3, ease: 'bounce.out' })
        break
      case 'confirming':
        timeline
          .to(this.head, { y: 5, rotation: 3, duration: 0.14, yoyo: true, repeat: 3, ease: 'sine.inOut' })
          .to(this.eyes, { scaleY: 0.18, duration: 0.08, yoyo: true, repeat: 1 }, 0.18)
          .to(this.smile, { scaleX: 1.5, duration: 0.2, yoyo: true, repeat: 1 }, 0.15)
          .to(this.antenna, { y: -5, duration: 0.15, yoyo: true, repeat: 3 }, 0)
          .to({}, { duration: 0.35 })
        break
      case 'focused':
        timeline
          .to(this.head, { rotation: 6 * focusDirection, x: 3 * focusDirection, duration: 0.25, ease: 'power2.out' })
          .to(this.eyes, { x: 4 * focusDirection, scaleY: 0.7, duration: 0.2 }, '<')
          .to(this.antenna, { rotation: 10 * focusDirection, duration: 0.24 }, '<')
          .to(this.byte, { rotation: 2 * focusDirection, duration: 0.24 }, '<')
          .to({}, { duration: 0.9 })
        break
      default:
        timeline
          .to(this.head, { rotation: 6, y: 1, duration: 0.25, ease: 'back.out(1.5)' })
          .to(this.eyes, { scaleY: 0.62, duration: 0.18 }, '<')
          .to(this.smile, { scaleX: 1.65, duration: 0.22, ease: 'back.out(2)' }, '<')
          .to(this.antenna, { rotation: 8, duration: 0.16, yoyo: true, repeat: 3 }, '<')
          .to(this.byte, { rotation: -2, duration: 0.3 }, '<')
          .to({}, { duration: 0.7 })
    }

    timeline
      .to([this.byte, this.head, this.eyes, this.smile, this.antenna, this.arms], {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.32,
        ease: 'power2.inOut',
      })
      .call(() => {
        this.play('idle')
        this.callbacks.onActionComplete()
      })

    return timeline
  }

  private createLocomotion(fromX: number, targetX: number, running: boolean, settleToIdle: boolean) {
    const timeline = gsap.timeline()
    const direction = (targetX >= fromX ? 1 : -1) as -1 | 1
    const distance = Math.abs(targetX - fromX)
    const pixelsPerSecond = running ? 280 : 165
    const travelDuration = Math.max(0.5, distance / pixelsPerSecond)
    const strideDuration = running ? 0.14 : 0.22
    const repeats = Math.max(1, Math.ceil(travelDuration / (strideDuration * 2)) * 2 - 1)
    const anticipation = running ? 0.12 : 0.2

    timeline
      .call(() => {
        this.direction = direction
        this.callbacks.onFacingChange(direction)
        this.callbacks.onLocomotionStateChange('preparing')
      })
      .to(this.byte, { scaleX: direction, duration: 0.12, ease: 'power2.inOut' })
      .to(this.byte, {
        y: running ? 7 : 5,
        scaleY: running ? 0.9 : 0.94,
        rotation: -3 * direction,
        duration: anticipation,
        ease: 'power2.in',
      })
      .call(() => this.callbacks.onLocomotionStateChange('walking'))
      .to(this.byte, { y: 0, scaleY: 1, rotation: running ? 7 * direction : 3 * direction, duration: 0.14, ease: 'power2.out' })
      .to(this.wrap, { x: targetX, duration: travelDuration, ease: 'power1.inOut' }, '<')
      .to(this.arms[0], { rotation: running ? 38 : 25, duration: strideDuration, yoyo: true, repeat: repeats, ease: 'sine.inOut' }, '<')
      .to(this.arms[1], { rotation: running ? -38 : -25, duration: strideDuration, yoyo: true, repeat: repeats, ease: 'sine.inOut' }, '<')
      .to(this.legs[0], { rotation: running ? -31 : -21, duration: strideDuration, yoyo: true, repeat: repeats, ease: 'sine.inOut' }, '<')
      .to(this.legs[1], { rotation: running ? 31 : 21, duration: strideDuration, yoyo: true, repeat: repeats, ease: 'sine.inOut' }, '<')
      .to(this.byte, { y: running ? -8 : -5, duration: strideDuration / 2, yoyo: true, repeat: repeats * 2 + 1, ease: 'sine.inOut' }, '<')
      .call(() => this.callbacks.onLocomotionStateChange('braking'), undefined, `>-${running ? 0.22 : 0.3}`)
      .to(this.wrap, { x: targetX + 7 * direction, duration: 0.1, ease: 'power2.out' })
      .to(this.wrap, { x: targetX, duration: 0.2, ease: 'back.out(2)' })
      .to([this.arms, this.legs], { rotation: 0, duration: 0.18, ease: 'power2.out' }, '<')
      .to(this.byte, { y: 4, rotation: 0, scaleY: 0.95, duration: 0.12 }, '<')
      .to(this.byte, { y: 0, scaleY: 1, duration: 0.2, ease: 'back.out(2)' })
      .call(() => {
        this.positionX = targetX
        this.callbacks.onLocomotionStateChange('idle')
        if (settleToIdle) {
          this.play('idle')
          this.callbacks.onActionComplete()
        }
      })
    return timeline
  }

  private createJump(fromX: number, targetX: number, longJump: boolean, settleToIdle: boolean) {
    const timeline = gsap.timeline()
    const height = longJump ? 108 : 88
    const horizontalDistance = targetX - fromX
    const direction = (
      horizontalDistance === 0 ? this.direction : Math.sign(horizontalDistance)
    ) as -1 | 1
    const ascentDuration = longJump ? 0.34 : 0.3
    const fallDuration = longJump ? 0.36 : 0.31

    timeline
      .call(() => {
        this.direction = direction
        this.callbacks.onFacingChange(direction)
        this.callbacks.onJumpStateChange('anticipating')
      })
      .to(this.byte, { scaleX: direction, duration: 0.1, ease: 'power2.inOut' })
      .to(this.arms[0], { rotation: -28, duration: 0.17, ease: 'power2.in' }, '<')
      .to(this.arms[1], { rotation: 28, duration: 0.17, ease: 'power2.in' }, '<')
      .to(this.byte, {
        y: 9,
        scaleY: 0.84,
        rotation: -4 * direction,
        duration: 0.2,
        ease: 'power2.in',
      }, '<')
      .call(() => this.callbacks.onJumpStateChange('ascending'))
      .to(this.byte, {
        y: -height,
        scaleY: 1.08,
        rotation: longJump ? 8 * direction : 0,
        duration: ascentDuration,
        ease: 'power3.out',
      })
      .to(this.wrap, {
        x: targetX,
        duration: ascentDuration + fallDuration + 0.1,
        ease: longJump ? 'power1.inOut' : 'none',
      }, '<')
      .to(this.arms[0], { rotation: 142, duration: 0.24, ease: 'back.out(1.7)' }, '<')
      .to(this.arms[1], { rotation: -142, duration: 0.24, ease: 'back.out(1.7)' }, '<')
      .call(() => this.callbacks.onJumpStateChange('apex'))
      .to(this.byte, { y: -(height + 7), scaleY: 1, duration: 0.11, ease: 'sine.out' })
      .call(() => this.callbacks.onJumpStateChange('falling'))
      .to(this.byte, {
        y: 0,
        scaleY: 0.96,
        rotation: 0,
        duration: fallDuration,
        ease: 'power2.in',
      })
      .to(this.legs[0], { rotation: -12, duration: 0.16 }, '<')
      .to(this.legs[1], { rotation: 12, duration: 0.16 }, '<')
      .call(() => this.callbacks.onJumpStateChange('landing'))
      .to(this.byte, { y: 8, scaleY: 0.78, duration: 0.09, ease: 'power3.in' })
      .to(this.arms, { rotation: 0, duration: 0.14, ease: 'power2.out' }, '<')
      .call(() => this.callbacks.onJumpStateChange('recovering'))
      .to(this.byte, { y: -5, scaleY: 1.05, duration: 0.16, ease: 'power2.out' })
      .to(this.byte, { y: 0, scaleY: 1, duration: 0.2, ease: 'back.out(2)' })
      .to(this.legs, { rotation: 0, duration: 0.16, ease: 'power2.out' }, '<')
      .call(() => {
        this.positionX = targetX
        this.callbacks.onJumpStateChange('grounded')
        if (settleToIdle) {
          this.play('idle')
          this.callbacks.onActionComplete()
        }
      })

    return timeline
  }

  private createPoint(repeat = true) {
    const timeline = gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: 0.45 })
    timeline
      .to(this.byte, { x: -5, rotation: -2, duration: 0.18, ease: 'power2.out' })
      .to(this.arms[1], { rotation: -92, y: -3, duration: 0.28, ease: 'back.out(1.8)' }, 0.08)
      .to(this.head, { rotation: 4, x: 3, duration: 0.22 }, 0.12)
      .to(this.eyes, { x: 3, duration: 0.18 }, 0.12)
      .to(this.arms[1], { rotation: -84, duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to({}, { duration: 0.45 })
      .to([this.byte, this.head, this.eyes, this.arms[1]], { x: 0, y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' })
    return timeline
  }

  private createThink(repeat = true) {
    const timeline = gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: 0.35 })
    timeline
      .to(this.head, { rotation: -7, x: -3, duration: 0.32, ease: 'power2.out' })
      .to(this.eyes, { x: -3, y: -2, duration: 0.2 }, 0.15)
      .to(this.arms[1], { rotation: 132, x: -5, y: -8, duration: 0.4, ease: 'back.out(1.6)' }, 0.08)
      .to(this.antenna, { rotation: -8, duration: 0.18, yoyo: true, repeat: 3 }, 0.3)
      .to(this.byte, { y: -2, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.45)
      .to({}, { duration: 0.35 })
      .to([this.byte, this.head, this.eyes, this.arms[1]], { x: 0, y: 0, rotation: 0, duration: 0.35, ease: 'power2.inOut' })
    return timeline
  }

  private createCelebrate(repeat = true) {
    const timeline = gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: 0.4 })
    timeline
      .to(this.byte, { y: 7, scaleY: 0.9, duration: 0.18, ease: 'power2.in' })
      .to(this.arms[0], { rotation: 145, duration: 0.2, ease: 'back.out(2)' }, 0.12)
      .to(this.arms[1], { rotation: -145, duration: 0.2, ease: 'back.out(2)' }, 0.12)
      .to(this.byte, { y: -42, scaleY: 1.05, duration: 0.3, ease: 'power3.out' })
      .to(this.byte, { y: 0, scaleY: 0.88, duration: 0.32, ease: 'power3.in' })
      .to(this.byte, { y: -8, scaleY: 1, duration: 0.16, ease: 'power2.out' })
      .to(this.byte, { y: 0, duration: 0.14, ease: 'bounce.out' })
      .to(this.arms, { rotation: 0, duration: 0.25, ease: 'power2.inOut' }, '-=0.1')
    return timeline
  }
}
