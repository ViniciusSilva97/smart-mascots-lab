import { describe, expect, it } from 'vitest'
import {
  calculateFrameMetrics,
  detectTargetFps,
} from './performance-monitor'

describe('performance monitor', () => {
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
