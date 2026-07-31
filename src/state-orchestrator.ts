export type CommandKind =
  | 'reset'
  | 'gesture'
  | 'expression'
  | 'locomotion'
  | 'jump'
  | 'interaction'
  | 'demo'

export type CommandDecision =
  | 'started'
  | 'interrupted'
  | 'queued'
  | 'replaced-in-queue'
  | 'queue-full'
  | 'reset'
  | 'completed'

export type MascotCommand = {
  id: string
  kind: CommandKind
  label: string
  priority: number
  atomic?: boolean
  execute: () => void
}

export type CommandSummary = Pick<
  MascotCommand,
  'id' | 'kind' | 'label' | 'priority' | 'atomic'
>

export type OrchestratorSnapshot = {
  active: CommandSummary | null
  queue: CommandSummary[]
  lastDecision: CommandDecision
}

type QueuedCommand = MascotCommand & { order: number }
type SnapshotListener = (snapshot: OrchestratorSnapshot) => void

const summarize = (command: MascotCommand): CommandSummary => ({
  id: command.id,
  kind: command.kind,
  label: command.label,
  priority: command.priority,
  atomic: command.atomic,
})

export class CommandOrchestrator {
  private onChange: SnapshotListener | null
  private readonly queueLimit: number
  private active: MascotCommand | null = null
  private queue: QueuedCommand[] = []
  private order = 0
  private lastDecision: CommandDecision = 'completed'
  private destroyed = false

  constructor(onChange: SnapshotListener, queueLimit = 4) {
    this.onChange = onChange
    this.queueLimit = queueLimit
    this.emit()
  }

  dispatch(command: MascotCommand): CommandDecision {
    this.assertAlive()
    if (command.kind === 'reset') {
      this.queue = []
      this.active = null
      this.lastDecision = 'reset'
      this.emit()
      command.execute()
      return this.lastDecision
    }

    if (!this.active) {
      this.start(command, 'started')
      return this.lastDecision
    }

    if (!this.active.atomic && command.priority >= this.active.priority) {
      this.start(command, 'interrupted')
      return this.lastDecision
    }

    return this.enqueue(command)
  }

  completeActive(): void {
    if (this.destroyed) return
    if (!this.active) return

    this.active = null
    this.lastDecision = 'completed'
    this.emit()
    this.startNext()
  }

  clearQueue(): void {
    if (this.destroyed) return
    this.queue = []
    this.emit()
  }

  getSnapshot(): OrchestratorSnapshot {
    return {
      active: this.active ? summarize(this.active) : null,
      queue: this.queue.map(summarize),
      lastDecision: this.lastDecision,
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.active = null
    this.queue = []
    this.order = 0
    this.onChange = null
  }

  private start(command: MascotCommand, decision: 'started' | 'interrupted'): void {
    this.active = command
    this.lastDecision = decision
    this.emit()
    command.execute()
  }

  private enqueue(command: MascotCommand): CommandDecision {
    const duplicateIndex = this.queue.findIndex(item => item.kind === command.kind)

    if (duplicateIndex >= 0) {
      this.queue.splice(duplicateIndex, 1)
      this.queue.push({ ...command, order: this.order++ })
      this.sortQueue()
      this.lastDecision = 'replaced-in-queue'
      this.emit()
      return this.lastDecision
    }

    if (this.queue.length >= this.queueLimit) {
      this.lastDecision = 'queue-full'
      this.emit()
      return this.lastDecision
    }

    this.queue.push({ ...command, order: this.order++ })
    this.sortQueue()
    this.lastDecision = 'queued'
    this.emit()
    return this.lastDecision
  }

  private startNext(): void {
    const next = this.queue.shift()
    if (!next) return
    this.start(next, 'started')
  }

  private sortQueue(): void {
    this.queue.sort((left, right) => {
      if (left.priority !== right.priority) return right.priority - left.priority
      return left.order - right.order
    })
  }

  private emit(): void {
    this.onChange?.(this.getSnapshot())
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new Error('CommandOrchestrator has been destroyed')
    }
  }
}
