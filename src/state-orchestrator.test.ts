import { describe, expect, it, vi } from 'vitest'
import {
  CommandOrchestrator,
  type CommandKind,
  type MascotCommand,
} from './state-orchestrator'

const command = (
  kind: CommandKind,
  priority: number,
  execute = vi.fn(),
  atomic = false,
): MascotCommand => ({
  id: `${kind}-${priority}`,
  kind,
  label: kind,
  priority,
  atomic,
  execute,
})

describe('CommandOrchestrator', () => {
  it('inicia imediatamente quando não existe ação ativa', () => {
    const execute = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    expect(orchestrator.dispatch(command('locomotion', 20, execute))).toBe('started')
    expect(execute).toHaveBeenCalledOnce()
    expect(orchestrator.getSnapshot().active?.kind).toBe('locomotion')
  })

  it('permite que um salto interrompa uma caminhada', () => {
    const walk = vi.fn()
    const jump = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    orchestrator.dispatch(command('locomotion', 20, walk))
    expect(orchestrator.dispatch(command('jump', 30, jump))).toBe('interrupted')

    expect(walk).toHaveBeenCalledOnce()
    expect(jump).toHaveBeenCalledOnce()
    expect(orchestrator.getSnapshot().active?.kind).toBe('jump')
  })

  it('protege uma interação atômica e executa depois o maior nível da fila', () => {
    const interaction = vi.fn()
    const expression = vi.fn()
    const jump = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    orchestrator.dispatch(command('interaction', 40, interaction, true))
    orchestrator.dispatch(command('expression', 10, expression))
    orchestrator.dispatch(command('jump', 30, jump))

    expect(orchestrator.getSnapshot().queue.map(item => item.kind)).toEqual([
      'jump',
      'expression',
    ])

    orchestrator.completeActive()

    expect(jump).toHaveBeenCalledOnce()
    expect(expression).not.toHaveBeenCalled()
    expect(orchestrator.getSnapshot().active?.kind).toBe('jump')
  })

  it('substitui comandos repetidos que ainda estão na fila', () => {
    const firstWalk = vi.fn()
    const latestWalk = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    orchestrator.dispatch(command('interaction', 40, vi.fn(), true))
    orchestrator.dispatch(command('locomotion', 20, firstWalk))
    expect(orchestrator.dispatch(command('locomotion', 20, latestWalk))).toBe(
      'replaced-in-queue',
    )

    expect(orchestrator.getSnapshot().queue).toHaveLength(1)
    orchestrator.completeActive()
    expect(firstWalk).not.toHaveBeenCalled()
    expect(latestWalk).toHaveBeenCalledOnce()
  })

  it('coloca uma expressão de menor prioridade atrás da caminhada', () => {
    const expression = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    orchestrator.dispatch(command('locomotion', 20))
    expect(orchestrator.dispatch(command('expression', 10, expression))).toBe('queued')
    expect(expression).not.toHaveBeenCalled()

    orchestrator.completeActive()
    expect(expression).toHaveBeenCalledOnce()
  })

  it('recusa o quinto tipo de comando quando a fila está cheia', () => {
    const orchestrator = new CommandOrchestrator(() => {}, 4)

    orchestrator.dispatch(command('demo', 40, vi.fn(), true))
    orchestrator.dispatch(command('gesture', 10))
    orchestrator.dispatch(command('expression', 10))
    orchestrator.dispatch(command('locomotion', 20))
    orchestrator.dispatch(command('jump', 30))

    expect(orchestrator.dispatch(command('interaction', 40))).toBe('queue-full')
    expect(orchestrator.getSnapshot().queue).toHaveLength(4)
  })

  it('reset interrompe tudo e esvazia a fila', () => {
    const reset = vi.fn()
    const orchestrator = new CommandOrchestrator(() => {})

    orchestrator.dispatch(command('interaction', 40, vi.fn(), true))
    orchestrator.dispatch(command('jump', 30))
    expect(orchestrator.dispatch(command('reset', 100, reset))).toBe('reset')

    expect(reset).toHaveBeenCalledOnce()
    expect(orchestrator.getSnapshot().active).toBeNull()
    expect(orchestrator.getSnapshot().queue).toEqual([])
  })
})
