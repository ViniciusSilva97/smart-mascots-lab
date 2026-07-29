import { gsap } from 'gsap'

export type Motion = 'idle' | 'walk' | 'point' | 'think' | 'celebrate'
export type LocomotionState = 'idle' | 'preparing' | 'walking' | 'braking'

type EngineCallbacks = {
  onMotionChange: (motion: Motion) => void
  onLocomotionStateChange: (state: LocomotionState) => void
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

  play(motion: Motion) {
    if (motion === 'walk') {
      this.walk(this.direction)
      return
    }
    this.callbacks.onMotionChange(motion)
    this.callbacks.onLocomotionStateChange('idle')
    this.replaceTimeline(() => this.createMotion(motion))
  }

  walk(direction: -1 | 1, running = false) {
    const distance = running ? 320 : 220
    this.walkTo(this.positionX + distance * direction, running)
  }

  walkTo(targetX: number, running = false) {
    const clampedTarget = gsap.utils.clamp(-this.maxPosition, this.maxPosition, targetX)
    if (Math.abs(clampedTarget - this.positionX) < 12) {
      this.play('idle')
      return
    }

    this.callbacks.onMotionChange('walk')
    this.replaceTimeline(() => this.createLocomotion(this.positionX, clampedTarget, running, true))
  }

  playDemo() {
    this.callbacks.onMotionChange('walk')
    this.replaceTimeline(() => {
      const demo = gsap.timeline()
      return demo
        .addLabel('entrada')
        .add(this.createLocomotion(this.positionX, 210, false, false))
        .addLabel('observa')
        .add(this.createThink(false))
        .addLabel('apresenta')
        .add(this.createPoint(false))
        .addLabel('comemora')
        .add(this.createCelebrate(false))
        .addLabel('saida')
        .add(this.createLocomotion(210, -210, true, false))
        .call(() => {
          this.positionX = -210
          this.play('idle')
        })
    })
  }

  togglePause() {
    if (this.timeline.paused()) this.timeline.resume()
    else this.timeline.pause()
    this.callbacks.onPlayStateChange(this.timeline.paused())
  }

  restart() {
    this.timeline.restart()
    this.callbacks.onPlayStateChange(false)
  }

  setProgress(progress: number) {
    this.timeline.pause().progress(progress)
    this.callbacks.onPlayStateChange(true)
  }

  setSpeed(speed: number) {
    this.speed = speed
    this.timeline.timeScale(speed)
  }

  setBounds(maxPosition: number) {
    this.maxPosition = Math.max(60, maxPosition)
    this.positionX = gsap.utils.clamp(-this.maxPosition, this.maxPosition, this.positionX)
    gsap.set(this.wrap, { x: this.positionX })
  }

  private replaceTimeline(createTimeline: () => gsap.core.Timeline) {
    this.timeline.kill()
    this.resetPose()
    this.timeline = createTimeline()
    this.timeline
      .timeScale(this.speed)
      .eventCallback('onUpdate', () => this.callbacks.onProgress(this.timeline.progress()))
      .eventCallback('onStart', () => this.callbacks.onPlayStateChange(false))
      .play(0)
  }

  private resetPose() {
    gsap.killTweensOf([this.wrap, this.byte, this.head, this.antenna, this.eyes, this.smile, this.arms, this.legs])
    gsap.set(this.wrap, { x: this.positionX, y: 0 })
    gsap.set([this.byte, this.head, this.antenna, this.eyes, this.smile, this.arms, this.legs], {
      clearProps: 'x,y,rotation,scaleX,scaleY,opacity',
    })
    gsap.set(this.byte, { scaleX: this.direction })
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
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.15 })
    timeline
      .to(this.byte, { y: -3, duration: 0.65, ease: 'sine.inOut' })
      .to(this.byte, { y: 0, duration: 0.65, ease: 'sine.inOut' })
      .to(this.eyes, { scaleY: 0.08, duration: 0.06, ease: 'none' }, 0.9)
      .to(this.eyes, { scaleY: 1, duration: 0.08, ease: 'none' })
      .to(this.antenna, { rotation: 5, duration: 0.18, yoyo: true, repeat: 1 }, 0.15)
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
        if (settleToIdle) this.play('idle')
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
