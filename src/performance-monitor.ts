export type PerformanceQuality = 'excellent' | 'stable' | 'warning' | 'critical'

export type FrameMetrics = {
  fps: number
  averageFrameTime: number
  p95FrameTime: number
  droppedFrames: number
  targetFps: 60 | 120
  quality: PerformanceQuality
  sampleSize: number
}

type MetricsListener = (metrics: FrameMetrics) => void
type AnimationFrameRequest = (callback: FrameRequestCallback) => number
type AnimationFrameCancel = (handle: number) => void

const percentile = (values: number[], ratio: number) => {
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)
  return sorted[Math.max(0, index)]
}

export const detectTargetFps = (frameTimes: number[]): 60 | 120 => {
  if (frameTimes.length === 0) return 60
  const median = percentile(frameTimes, 0.5)
  const estimatedRefreshRate = 1000 / median
  return estimatedRefreshRate >= 90 ? 120 : 60
}

export const calculateFrameMetrics = (
  frameTimes: number[],
  targetFps = detectTargetFps(frameTimes),
): FrameMetrics => {
  if (frameTimes.length === 0) {
    return {
      fps: 0,
      averageFrameTime: 0,
      p95FrameTime: 0,
      droppedFrames: 0,
      targetFps,
      quality: 'critical',
      sampleSize: 0,
    }
  }

  const averageFrameTime = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length
  const fps = 1000 / averageFrameTime
  const expectedFrameTime = 1000 / targetFps
  const droppedFrames = frameTimes.filter(value => value > expectedFrameTime * 1.5).length
  const performanceRatio = fps / targetFps
  const quality: PerformanceQuality =
    performanceRatio >= 0.95
      ? 'excellent'
      : performanceRatio >= 0.85
        ? 'stable'
        : performanceRatio >= 0.7
          ? 'warning'
          : 'critical'

  return {
    fps: Math.round(fps),
    averageFrameTime: Number(averageFrameTime.toFixed(2)),
    p95FrameTime: Number(percentile(frameTimes, 0.95).toFixed(2)),
    droppedFrames,
    targetFps,
    quality,
    sampleSize: frameTimes.length,
  }
}

export class FramePerformanceMonitor {
  private readonly onMetrics: MetricsListener
  private readonly requestFrame: AnimationFrameRequest
  private readonly cancelFrame: AnimationFrameCancel
  private readonly frameTimes: number[] = []
  private animationFrameId: number | null = null
  private lastTimestamp: number | null = null
  private lastEmission = 0
  private targetFps: 60 | 120 = 60

  constructor(
    onMetrics: MetricsListener,
    requestFrame: AnimationFrameRequest = callback =>
      window.requestAnimationFrame(callback),
    cancelFrame: AnimationFrameCancel = handle =>
      window.cancelAnimationFrame(handle),
  ) {
    this.onMetrics = onMetrics
    this.requestFrame = requestFrame
    this.cancelFrame = cancelFrame
  }

  start(): void {
    if (this.animationFrameId !== null) return
    this.lastTimestamp = null
    this.animationFrameId = this.requestFrame(this.measure)
  }

  stop(): void {
    if (this.animationFrameId !== null) this.cancelFrame(this.animationFrameId)
    this.animationFrameId = null
    this.lastTimestamp = null
  }

  reset(): void {
    this.frameTimes.length = 0
    this.lastTimestamp = null
    this.lastEmission = 0
    this.targetFps = 60
  }

  private readonly measure = (timestamp: number) => {
    if (this.lastTimestamp !== null) {
      const frameTime = timestamp - this.lastTimestamp
      if (frameTime > 0 && frameTime < 250) {
        this.frameTimes.push(frameTime)
        if (this.frameTimes.length > 120) this.frameTimes.shift()
      }
    }

    this.lastTimestamp = timestamp

    if (this.frameTimes.length >= 30) {
      this.targetFps = detectTargetFps(this.frameTimes)
    }

    if (this.frameTimes.length >= 20 && timestamp - this.lastEmission >= 500) {
      this.onMetrics(calculateFrameMetrics(this.frameTimes, this.targetFps))
      this.lastEmission = timestamp
    }

    this.animationFrameId = this.requestFrame(this.measure)
  }
}
