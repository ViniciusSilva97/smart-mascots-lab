import './style.css'
import {
  type AttentionState,
  ByteMotionEngine,
  type Expression,
  type InteractionState,
  type JumpState,
  type LocomotionState,
  type Motion,
} from './motion-engine'
import {
  CommandOrchestrator,
  type CommandDecision,
  type MascotCommand,
  type OrchestratorSnapshot,
} from './state-orchestrator'
import {
  FramePerformanceMonitor,
  type FrameMetrics,
  type PerformanceQuality,
} from './performance-monitor'

const root = document.documentElement

const motions: Array<{ id: Motion; label: string; icon: string }> = [
  { id: 'idle', label: 'Parado', icon: '●' },
  { id: 'walk', label: 'Caminhar', icon: '▶' },
  { id: 'jump', label: 'Saltar', icon: '↑' },
  { id: 'point', label: 'Apontar', icon: '☞' },
  { id: 'think', label: 'Pensar', icon: '?' },
  { id: 'celebrate', label: 'Comemorar', icon: '★' },
]

const expressions: Array<{ id: Expression; label: string }> = [
  { id: 'friendly', label: 'Simpático' },
  { id: 'curious', label: 'Curioso' },
  { id: 'surprised', label: 'Surpreso' },
  { id: 'confirming', label: 'Confirmar' },
  { id: 'focused', label: 'Focado' },
]

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Smart Mascots Lab">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span>
        <strong>SMART MASCOTS</strong>
        <small>ANIMATION LAB</small>
      </span>
    </a>
    <div class="lab-status"><i></i> LAB ONLINE</div>
  </header>

  <main>
    <section class="intro">
      <p class="eyebrow">// PROTÓTIPO 08 • PERFORMANCE</p>
      <h1>Personagens que dão<br><em>vida à marca.</em></h1>
      <p>Teste movimentos, escala e velocidade antes de levar os mascotes para a Smart Eletro Vini.</p>
    </section>

    <section class="workspace" aria-label="Laboratório de animação">
      <aside class="mascot-panel">
        <span class="panel-label">MASCOTE ATIVO</span>
        <div class="mascot-id">
          <span class="mini-avatar">B</span>
          <div><strong>BYTE</strong><small>Especialista em computadores</small></div>
        </div>
        <div class="separator"></div>
        <span class="panel-label">MOVIMENTOS</span>
        <div class="motion-list">
          ${motions.map(({ id, label, icon }) => `
            <button class="motion-button${id === 'idle' ? ' active' : ''}" data-motion="${id}">
              <span>${icon}</span>${label}<i></i>
            </button>`).join('')}
        </div>
        <p class="keyboard-tip"><kbd>1</kbd>—<kbd>6</kbd> Atalhos de animação</p>
        <div class="separator"></div>
        <span class="panel-label">PERSONALIDADE</span>
        <div class="expression-list">
          ${expressions.map(({ id, label }) => `
            <button class="expression-button" data-expression="${id}">
              <span></span>${label}
            </button>`).join('')}
        </div>
      </aside>

      <div class="stage-column">
        <div class="stage-toolbar">
          <span><i></i> PREVIEW EM TEMPO REAL</span>
          <div class="transport">
            <button id="tracking" type="button" aria-pressed="true">◎ &nbsp;ATENÇÃO ON</button>
            <button id="demo" type="button">▶ &nbsp;DEMO</button>
            <button id="restart" type="button" aria-label="Reiniciar">↺</button>
            <button id="pause" type="button" aria-pressed="false">Ⅱ &nbsp;PAUSAR</button>
          </div>
        </div>
        <div class="stage" id="stage">
          <div class="grid"></div>
          <div class="target-marker" id="target-marker" aria-hidden="true"></div>
          <button class="product-target product-cpu" data-label="CPU" data-reachable="true" type="button">
            <span class="product-object object-cpu" aria-hidden="true"><i></i></span>
            <strong>CPU</strong><small>PEGAR</small><b class="object-pedestal"></b>
          </button>
          <button class="product-target product-ssd" data-label="SSD" data-reachable="true" type="button">
            <span class="product-object object-ssd" aria-hidden="true"><i></i></span>
            <strong>SSD</strong><small>PEGAR</small><b class="object-pedestal"></b>
          </button>
          <button class="product-target product-gpu" data-label="GPU" data-reachable="true" type="button">
            <span class="product-object object-gpu" aria-hidden="true"><i></i></span>
            <strong>GPU</strong><small>PEGAR</small><b class="object-pedestal"></b>
          </button>
          <button class="product-target product-server unreachable" data-label="SERVIDOR" data-reachable="false" type="button">
            <span class="product-object object-server" aria-hidden="true"><i></i></span>
            <strong>SERVIDOR</strong><small>FORA DO ALCANCE</small>
          </button>
          <div class="speech" id="speech">Olá! Eu sou o Byte.</div>
          <div class="byte-wrap" id="byte-wrap">
            <div class="byte" id="byte" data-motion="idle" role="img" aria-label="Byte, mascote pixelado provisório">
              <div class="antenna"></div>
              <div class="head"><i class="eye eye-left"></i><i class="eye eye-right"></i><b class="smile"></b></div>
              <div class="body"><span class="chest">V</span></div>
              <i class="arm arm-left"></i><i class="arm arm-right"></i>
              <i class="leg leg-left"></i><i class="leg leg-right"></i>
            </div>
          </div>
          <div class="stage-floor"></div>
          <span class="stage-note">PERSONAGEM PROVISÓRIO • CSS PIXEL ART</span>
        </div>
        <div class="timeline-control">
          <span>0:00</span>
          <input id="progress" type="range" min="0" max="1000" value="0" aria-label="Progresso da animação">
          <span id="progress-value">0%</span>
        </div>
      </div>

      <aside class="settings-panel">
        <span class="panel-label">AJUSTES</span>
        <label for="speed">VELOCIDADE <output id="speed-value">1.0×</output></label>
        <input id="speed" type="range" min="0.5" max="2" value="1" step="0.1">
        <label for="scale">ESCALA <output id="scale-value">100%</output></label>
        <input id="scale" type="range" min="60" max="150" value="100" step="5">
        <div class="separator"></div>
        <span class="panel-label">LOCOMOÇÃO</span>
        <div class="locomotion-buttons">
          <button id="walk-left" type="button">←<small>ANDAR</small></button>
          <button id="run" type="button">⇧<small>CORRER</small></button>
          <button id="walk-right" type="button">→<small>ANDAR</small></button>
        </div>
        <div class="jump-buttons">
          <button id="jump" type="button">↑<small>SALTAR</small></button>
          <button id="long-jump" type="button">⇧↑<small>SALTO LONGO</small></button>
        </div>
        <p class="click-tip">Clique no palco para escolher o destino. Use <strong>Shift</strong> para correr.</p>
        <div class="separator"></div>
        <span class="panel-label">ORQUESTRAÇÃO</span>
        <div class="orchestrator-panel">
          <div class="command-active">
            <span>ATIVO</span>
            <strong id="command-active">RESPIRANDO</strong>
          </div>
          <div class="command-decision">
            <span>DECISÃO</span>
            <strong id="command-decision">PRONTO</strong>
          </div>
          <span class="queue-title">FILA <b id="queue-count">0/4</b></span>
          <ol class="command-queue" id="command-queue">
            <li>FILA VAZIA</li>
          </ol>
          <div class="queue-actions">
            <button id="clear-queue" type="button">LIMPAR FILA</button>
            <button id="stop-all" type="button">PARAR TUDO</button>
          </div>
        </div>
        <div class="separator"></div>
        <span class="panel-label">ACESSIBILIDADE</span>
        <label for="motion-mode">MOVIMENTO</label>
        <select id="motion-mode" aria-label="Preferência de movimento">
          <option value="auto">AUTOMÁTICO</option>
          <option value="full">COMPLETO</option>
          <option value="reduced">REDUZIDO</option>
        </select>
        <p class="motion-mode-note" id="motion-mode-note">SEGUINDO O SISTEMA</p>
        <div class="separator"></div>
        <span class="panel-label">AMBIENTE</span>
        <div class="background-options">
          <button class="bg-option active" data-bg="dark" aria-label="Fundo escuro"></button>
          <button class="bg-option" data-bg="light" aria-label="Fundo claro"></button>
          <button class="bg-option" data-bg="green" aria-label="Fundo verde"></button>
        </div>
        <div class="separator"></div>
        <span class="panel-label">TELEMETRIA</span>
        <div class="performance-panel" id="performance-panel" data-quality="calibrating">
          <div class="performance-head">
            <span>QUALIDADE</span>
            <strong id="performance-quality">CALIBRANDO</strong>
          </div>
          <div class="metric-grid">
            <div><span>FPS</span><strong id="fps-value">--</strong></div>
            <div><span>META</span><strong id="fps-target">--</strong></div>
            <div><span>FRAME</span><strong id="frame-time">--</strong></div>
            <div><span>P95</span><strong id="frame-p95">--</strong></div>
            <div><span>QUEDAS</span><strong id="dropped-frames">0</strong></div>
            <div><span>ABA</span><strong id="visibility-state">ATIVA</strong></div>
          </div>
        </div>
        <div class="separator"></div>
        <dl>
          <div><dt>ESTADO</dt><dd id="state">IDLE</dd></div>
          <div><dt>MODO</dt><dd>GSAP</dd></div>
        </dl>
      </aside>
    </section>
  </main>

  <footer>
    <span>SMART ELETRO VINI © 2026</span>
    <span>BYTE • PROTÓTIPO DE MOVIMENTO</span>
  </footer>
`

const byte = document.querySelector<HTMLElement>('#byte')!
const stage = document.querySelector<HTMLElement>('#stage')!
const state = document.querySelector<HTMLElement>('#state')!
const speech = document.querySelector<HTMLElement>('#speech')!
const pause = document.querySelector<HTMLButtonElement>('#pause')!
const progress = document.querySelector<HTMLInputElement>('#progress')!
const progressValue = document.querySelector<HTMLElement>('#progress-value')!
const targetMarker = document.querySelector<HTMLElement>('#target-marker')!
const commandActive = document.querySelector<HTMLElement>('#command-active')!
const commandDecision = document.querySelector<HTMLElement>('#command-decision')!
const commandQueue = document.querySelector<HTMLOListElement>('#command-queue')!
const queueCount = document.querySelector<HTMLElement>('#queue-count')!
const motionMode = document.querySelector<HTMLSelectElement>('#motion-mode')!
const motionModeNote = document.querySelector<HTMLElement>('#motion-mode-note')!
const performancePanel = document.querySelector<HTMLElement>('#performance-panel')!
const performanceQuality = document.querySelector<HTMLElement>('#performance-quality')!
const fpsValue = document.querySelector<HTMLElement>('#fps-value')!
const fpsTarget = document.querySelector<HTMLElement>('#fps-target')!
const frameTime = document.querySelector<HTMLElement>('#frame-time')!
const frameP95 = document.querySelector<HTMLElement>('#frame-p95')!
const droppedFrames = document.querySelector<HTMLElement>('#dropped-frames')!
const visibilityState = document.querySelector<HTMLElement>('#visibility-state')!

const locomotionLabels: Record<LocomotionState, string> = {
  idle: 'IDLE',
  preparing: 'PREPARANDO',
  walking: 'CAMINHANDO',
  braking: 'FREANDO',
}

const jumpLabels: Record<JumpState, string> = {
  grounded: 'NO CHÃO',
  anticipating: 'PREPARANDO SALTO',
  ascending: 'SUBINDO',
  apex: 'ÁPICE',
  falling: 'CAINDO',
  landing: 'ATERRISSANDO',
  recovering: 'RECUPERANDO',
}

const attentionLabels: Record<AttentionState, string> = {
  relaxed: 'ATENTO',
  tracking: 'ACOMPANHANDO',
  friendly: 'SIMPÁTICO',
  curious: 'CURIOSO',
  surprised: 'SURPRESO',
  confirming: 'CONFIRMANDO',
  focused: 'FOCADO',
}

const interactionLabels: Record<InteractionState, string> = {
  idle: 'ATENTO',
  approaching: 'APROXIMANDO',
  aligning: 'ALINHANDO',
  reaching: 'ALCANÇANDO',
  grabbing: 'PEGANDO',
  carrying: 'CARREGANDO',
  presenting: 'APRESENTANDO',
  releasing: 'DEVOLVENDO',
  'out-of-reach': 'FORA DO ALCANCE',
}

const speechByMotion: Record<Motion, string> = {
  idle: 'Olá! Eu sou o Byte.',
  walk: 'Vamos explorar a loja?',
  jump: 'Ativando propulsores!',
  point: 'Olha esta oferta!',
  think: 'Qual upgrade combina com você?',
  celebrate: 'Compra concluída!',
}

const decisionLabels: Record<CommandDecision, string> = {
  started: 'INICIADO',
  interrupted: 'INTERROMPEU',
  queued: 'AGUARDANDO',
  'replaced-in-queue': 'FILA ATUALIZADA',
  'queue-full': 'FILA CHEIA',
  reset: 'REINICIADO',
  completed: 'CONCLUÍDO',
}

const qualityLabels: Record<PerformanceQuality, string> = {
  excellent: 'EXCELENTE',
  stable: 'ESTÁVEL',
  warning: 'ATENÇÃO',
  critical: 'CRÍTICO',
}

const renderPerformance = (metrics: FrameMetrics) => {
  performancePanel.dataset.quality = metrics.quality
  performanceQuality.textContent = qualityLabels[metrics.quality]
  fpsValue.textContent = String(metrics.fps)
  fpsTarget.textContent = `${metrics.targetFps} HZ`
  frameTime.textContent = `${metrics.averageFrameTime} MS`
  frameP95.textContent = `${metrics.p95FrameTime} MS`
  droppedFrames.textContent = String(metrics.droppedFrames)
}

const renderOrchestrator = (snapshot: OrchestratorSnapshot) => {
  commandActive.textContent = snapshot.active?.label.toUpperCase() ?? 'RESPIRANDO'
  commandActive.dataset.atomic = String(Boolean(snapshot.active?.atomic))
  commandDecision.textContent = decisionLabels[snapshot.lastDecision]
  commandDecision.dataset.decision = snapshot.lastDecision
  queueCount.textContent = `${snapshot.queue.length}/4`
  commandQueue.innerHTML = snapshot.queue.length
    ? snapshot.queue.map(item => `
        <li>
          <span>${item.label}</span>
          <b>P${item.priority}${item.atomic ? ' • PROTEGIDO' : ''}</b>
        </li>`).join('')
    : '<li>FILA VAZIA</li>'
}

let orchestrator: CommandOrchestrator

const engine = new ByteMotionEngine(byte, {
  onMotionChange(motion) {
    byte.dataset.motion = motion
    state.textContent = motions.find(item => item.id === motion)!.label.toUpperCase()
    speech.textContent = speechByMotion[motion]
    document.querySelectorAll('.motion-button').forEach(button => {
      button.classList.toggle('active', (button as HTMLElement).dataset.motion === motion)
    })
  },
  onLocomotionStateChange(locomotionState) {
    state.textContent = locomotionLabels[locomotionState]
  },
  onJumpStateChange(jumpState) {
    if (jumpState !== 'grounded') state.textContent = jumpLabels[jumpState]
  },
  onAttentionStateChange(attentionState) {
    state.textContent = attentionLabels[attentionState]
  },
  onInteractionStateChange(interactionState) {
    if (interactionState !== 'idle') state.textContent = interactionLabels[interactionState]
  },
  onExpressionChange(expression) {
    document.querySelectorAll('.expression-button').forEach(button => {
      button.classList.toggle(
        'active',
        (button as HTMLElement).dataset.expression === expression,
      )
    })
  },
  onActionComplete() {
    orchestrator.completeActive()
  },
  onProgress(value) {
    const percent = Math.round(value * 100)
    progress.value = String(Math.round(value * 1000))
    progressValue.textContent = `${percent}%`
  },
  onPlayStateChange(paused) {
    pause.setAttribute('aria-pressed', String(paused))
    pause.innerHTML = paused ? '▶ &nbsp;CONTINUAR' : 'Ⅱ &nbsp;PAUSAR'
  },
})

orchestrator = new CommandOrchestrator(renderOrchestrator)
const performanceMonitor = new FramePerformanceMonitor(renderPerformance)

let commandSequence = 0
const command = (
  input: Omit<MascotCommand, 'id'>,
): MascotCommand => ({
  ...input,
  id: `${input.kind}-${commandSequence++}`,
})

const dispatchMotion = (motion: Motion) => {
  if (motion === 'idle') {
    orchestrator.dispatch(command({
      kind: 'reset',
      label: 'Parado',
      priority: 100,
      execute: () => engine.play('idle'),
    }))
    return
  }

  if (motion === 'walk') {
    orchestrator.dispatch(command({
      kind: 'locomotion',
      label: 'Caminhar',
      priority: 20,
      execute: () => engine.walk(1),
    }))
    return
  }

  if (motion === 'jump') {
    orchestrator.dispatch(command({
      kind: 'jump',
      label: 'Saltar',
      priority: 30,
      execute: () => engine.jump(),
    }))
    return
  }

  orchestrator.dispatch(command({
    kind: 'gesture',
    label: motions.find(item => item.id === motion)!.label,
    priority: 10,
    execute: () => engine.play(motion),
  }))
}

const dispatchWalk = (direction: -1 | 1, running = false) => {
  orchestrator.dispatch(command({
    kind: 'locomotion',
    label: running ? 'Correr' : direction === -1 ? 'Andar à esquerda' : 'Andar à direita',
    priority: 20,
    execute: () => engine.walk(direction, running),
  }))
}

const dispatchJump = (longJump = false) => {
  orchestrator.dispatch(command({
    kind: 'jump',
    label: longJump ? 'Salto longo' : 'Saltar',
    priority: 30,
    execute: () => engine.jump(longJump),
  }))
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let appliedReducedMotion: boolean | null = null

const applyMotionPreference = () => {
  const reduced = motionMode.value === 'reduced'
    || (motionMode.value === 'auto' && reducedMotionQuery.matches)

  motionModeNote.textContent = motionMode.value === 'auto'
    ? reduced
      ? 'SISTEMA: MOVIMENTO REDUZIDO'
      : 'SISTEMA: MOVIMENTO COMPLETO'
    : reduced
      ? 'MODO REDUZIDO MANUAL'
      : 'MODO COMPLETO MANUAL'

  root.dataset.motionMode = reduced ? 'reduced' : 'full'
  if (appliedReducedMotion === reduced) return
  appliedReducedMotion = reduced

  orchestrator.dispatch(command({
    kind: 'reset',
    label: reduced ? 'Movimento reduzido' : 'Movimento completo',
    priority: 100,
    execute: () => engine.setReducedMotion(reduced),
  }))
}

motionMode.addEventListener('change', applyMotionPreference)
reducedMotionQuery.addEventListener('change', () => {
  if (motionMode.value === 'auto') applyMotionPreference()
})
applyMotionPreference()

const updateVisibility = () => {
  const visible = document.visibilityState === 'visible'
  visibilityState.textContent = visible ? 'ATIVA' : 'PAUSADA'
  visibilityState.dataset.visible = String(visible)
  engine.setPageVisible(visible)

  if (visible) {
    performanceMonitor.reset()
    performanceMonitor.start()
  } else {
    performanceMonitor.stop()
  }
}

document.addEventListener('visibilitychange', updateVisibility)
updateVisibility()

const updateStageBounds = () => engine.setBounds(stage.clientWidth / 2 - 70)
updateStageBounds()
window.addEventListener('resize', updateStageBounds)

document.querySelectorAll<HTMLButtonElement>('.motion-button').forEach(button => {
  button.addEventListener('click', () => {
    dispatchMotion(button.dataset.motion as Motion)
  })
})

document.querySelectorAll<HTMLButtonElement>('.expression-button').forEach(button => {
  button.addEventListener('click', () => {
    const expression = button.dataset.expression as Expression
    const expressionSpeech = {
      friendly: 'Olá! Posso ajudar?',
      curious: 'Hmm... quero entender melhor.',
      surprised: 'Uau! Olha este detalhe!',
      confirming: 'Certo! Entendi perfeitamente.',
      focused: 'Analisando cada detalhe...',
    }[expression]
    orchestrator.dispatch(command({
      kind: 'expression',
      label: expressions.find(item => item.id === expression)!.label,
      priority: 10,
      execute: () => {
        speech.textContent = expressionSpeech
        engine.express(expression)
      },
    }))
  })
})

const speed = document.querySelector<HTMLInputElement>('#speed')!
speed.addEventListener('input', () => {
  engine.setSpeed(Number(speed.value))
  document.querySelector<HTMLOutputElement>('#speed-value')!.value = `${Number(speed.value).toFixed(1)}×`
})

const scale = document.querySelector<HTMLInputElement>('#scale')!
scale.addEventListener('input', () => {
  root.style.setProperty('--mascot-scale', `${Number(scale.value) / 100}`)
  document.querySelector<HTMLOutputElement>('#scale-value')!.value = `${scale.value}%`
})

document.querySelectorAll<HTMLButtonElement>('.bg-option').forEach(button => {
  button.addEventListener('click', () => {
    stage.dataset.background = button.dataset.bg
    document.querySelectorAll('.bg-option').forEach(option => option.classList.toggle('active', option === button))
  })
})

pause.addEventListener('click', () => {
  engine.togglePause()
})

document.querySelector<HTMLButtonElement>('#restart')!.addEventListener('click', () => engine.restart())
document.querySelector<HTMLButtonElement>('#demo')!.addEventListener('click', () => {
  orchestrator.dispatch(command({
    kind: 'demo',
    label: 'Demonstração',
    priority: 40,
    atomic: true,
    execute: () => {
      speech.textContent = 'Demonstração completa iniciada!'
      engine.playDemo()
    },
  }))
})
progress.addEventListener('input', () => engine.setProgress(Number(progress.value) / 1000))

document.querySelector<HTMLButtonElement>('#walk-left')!.addEventListener('click', () => dispatchWalk(-1))
document.querySelector<HTMLButtonElement>('#walk-right')!.addEventListener('click', () => dispatchWalk(1))
document.querySelector<HTMLButtonElement>('#run')!.addEventListener('click', () => dispatchWalk(1, true))
document.querySelector<HTMLButtonElement>('#jump')!.addEventListener('click', () => dispatchJump())
document.querySelector<HTMLButtonElement>('#long-jump')!.addEventListener('click', () => dispatchJump(true))
document.querySelector<HTMLButtonElement>('#clear-queue')!.addEventListener('click', () => orchestrator.clearQueue())
document.querySelector<HTMLButtonElement>('#stop-all')!.addEventListener('click', () => {
  speech.textContent = 'Tudo certo. Voltando à posição de atenção.'
  dispatchMotion('idle')
})

const trackingButton = document.querySelector<HTMLButtonElement>('#tracking')!
trackingButton.addEventListener('click', () => {
  const enabled = trackingButton.getAttribute('aria-pressed') !== 'true'
  trackingButton.setAttribute('aria-pressed', String(enabled))
  trackingButton.innerHTML = enabled ? '◎ &nbsp;ATENÇÃO ON' : '○ &nbsp;ATENÇÃO OFF'
  engine.setTracking(enabled)
})

document.querySelectorAll<HTMLButtonElement>('.product-target').forEach(target => {
  target.addEventListener('click', event => {
    event.stopPropagation()
    const stageRect = stage.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const targetX = targetRect.left + targetRect.width / 2 - (stageRect.left + stageRect.width / 2)
    const direction = (targetX >= 0 ? 1 : -1) as -1 | 1
    const label = target.dataset.label!

    if (target.dataset.reachable === 'true') {
      const product = target.querySelector<HTMLElement>('.product-object')!
      orchestrator.dispatch(command({
        kind: 'interaction',
        label: `Apresentar ${label}`,
        priority: 40,
        atomic: true,
        execute: () => {
          speech.textContent = `Vou buscar e apresentar ${label} para você!`
          engine.interact(product, targetX)
        },
      }))
      return
    }

    orchestrator.dispatch(command({
      kind: 'interaction',
      label: `Alcançar ${label}`,
      priority: 40,
      atomic: true,
      execute: () => {
        speech.textContent = `${label} está alto demais. Vou pedir uma ajudinha!`
        engine.inspectOutOfReach(direction)
      },
    }))
  })
})

stage.addEventListener('pointermove', event => {
  const rect = stage.getBoundingClientRect()
  const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1
  engine.lookAt(normalizedX, normalizedY)
})
stage.addEventListener('pointerleave', () => engine.releaseAttention())

stage.addEventListener('click', event => {
  const rect = stage.getBoundingClientRect()
  const localX = event.clientX - rect.left
  const limit = Math.max(80, rect.width / 2 - 70)
  const targetX = Math.max(-limit, Math.min(limit, localX - rect.width / 2))

  targetMarker.style.left = `${localX}px`
  targetMarker.classList.remove('visible')
  requestAnimationFrame(() => targetMarker.classList.add('visible'))
  orchestrator.dispatch(command({
    kind: 'locomotion',
    label: event.shiftKey ? 'Correr ao destino' : 'Ir ao destino',
    priority: 20,
    execute: () => engine.walkTo(targetX, event.shiftKey),
  }))
})

window.addEventListener('keydown', event => {
  const index = Number(event.key) - 1
  if (motions[index]) dispatchMotion(motions[index].id)
  if (event.code === 'Space') {
    event.preventDefault()
    engine.togglePause()
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    dispatchWalk(-1, event.shiftKey)
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    dispatchWalk(1, event.shiftKey)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    dispatchJump(event.shiftKey)
  }
})
