import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calculateFrameMetrics,
  detectTargetFps,
  FramePerformanceMonitor,
} from './performance-monitor'

describe('performance monitor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserva o contexto do navegador ao agendar e cancelar frames', () => {
    let browser: object
    const requestFrame = vi.fn(function (
      this: unknown,
      _callback: FrameRequestCallback,
    ) {
      if (this !== browser) throw new TypeError('Illegal invocation')
      return 42
    })
    const cancelFrame = vi.fn(function (this: unknown, _handle: number) {
      if (this !== browser) throw new TypeError('Illegal invocation')
    })
    browser = {
      requestAnimationFrame: requestFrame,
      cancelAnimationFrame: cancelFrame,
    }

    vi.stubGlobal('window', browser)
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)

    const monitor = new FramePerformanceMonitor(vi.fn())

    expect(() => monitor.start()).not.toThrow()
    monitor.stop()

    expect(requestFrame).toHaveBeenCalledOnce()
    expect(cancelFrame).toHaveBeenCalledWith(42)
  })

  it('detecta uma tela próxima de 60 Hz', () => {
    expect(detectTargetFps(Array(40).fill(16.67))).toBe(60)
  })

  it('detecta uma tela próxima de 120 Hz', () => {
    expect(detectTargetFps(Array(40).fill(8.33))).toBe(120)
  })

  it('classifica 60 FPS como excelente para meta de 60 Hz', () => {
    const metrics = calculateFrameMetrics(Array(60).fill(16.67), 60)

    expect(metrics.fps).toBe(60)
    expect(metrics.quality).toBe('excellent')
    expect(metrics.droppedFrames).toBe(0)
  })

  it('conta frames acima de uma vez e meia o orçamento', () => {
    const metrics = calculateFrameMetrics([16, 17, 30, 35, 16], 60)

    expect(metrics.droppedFrames).toBe(2)
    expect(metrics.p95FrameTime).toBe(35)
  })

  it('classifica uma queda severa de desempenho', () => {
    const metrics = calculateFrameMetrics(Array(30).fill(30), 60)

    expect(metrics.fps).toBe(33)
    expect(metrics.quality).toBe('critical')
  })
})
