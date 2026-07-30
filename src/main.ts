import './style.css'
import {
  type AttentionState,
  ByteMotionEngine,
  type Expression,
  type JumpState,
  type LocomotionState,
  type Motion,
} from './motion-engine'

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
      <p class="eyebrow">// PROTÓTIPO 05 • ATENÇÃO</p>
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
        <p class="keyboard-tip"><kbd>1</kbd>—<kbd>5</kbd> Atalhos de animação</p>
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
          <button class="detail-target detail-one" data-direction="-1" data-label="CPU">CPU<small>DETALHE</small></button>
          <button class="detail-target detail-two" data-direction="1" data-label="SSD">SSD<small>DETALHE</small></button>
          <button class="detail-target detail-three" data-direction="1" data-label="GPU">GPU<small>DETALHE</small></button>
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
        <span class="panel-label">AMBIENTE</span>
        <div class="background-options">
          <button class="bg-option active" data-bg="dark" aria-label="Fundo escuro"></button>
          <button class="bg-option" data-bg="light" aria-label="Fundo claro"></button>
          <button class="bg-option" data-bg="green" aria-label="Fundo verde"></button>
        </div>
        <div class="separator"></div>
        <dl>
          <div><dt>ESTADO</dt><dd id="state">IDLE</dd></div>
          <div><dt>FPS</dt><dd>60</dd></div>
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

const speechByMotion: Record<Motion, string> = {
  idle: 'Olá! Eu sou o Byte.',
  walk: 'Vamos explorar a loja?',
  jump: 'Ativando propulsores!',
  point: 'Olha esta oferta!',
  think: 'Qual upgrade combina com você?',
  celebrate: 'Compra concluída!',
}

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
  onExpressionChange(expression) {
    document.querySelectorAll('.expression-button').forEach(button => {
      button.classList.toggle(
        'active',
        (button as HTMLElement).dataset.expression === expression,
      )
    })
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

const updateStageBounds = () => engine.setBounds(stage.clientWidth / 2 - 70)
updateStageBounds()
window.addEventListener('resize', updateStageBounds)

document.querySelectorAll<HTMLButtonElement>('.motion-button').forEach(button => {
  button.addEventListener('click', () => {
    const motion = button.dataset.motion as Motion
    if (motion === 'walk') engine.walk(1)
    else if (motion === 'jump') engine.jump()
    else engine.play(motion)
  })
})

document.querySelectorAll<HTMLButtonElement>('.expression-button').forEach(button => {
  button.addEventListener('click', () => {
    const expression = button.dataset.expression as Expression
    speech.textContent = {
      friendly: 'Olá! Posso ajudar?',
      curious: 'Hmm... quero entender melhor.',
      surprised: 'Uau! Olha este detalhe!',
      confirming: 'Certo! Entendi perfeitamente.',
      focused: 'Analisando cada detalhe...',
    }[expression]
    engine.express(expression)
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
  speech.textContent = 'Demonstração completa iniciada!'
  engine.playDemo()
})
progress.addEventListener('input', () => engine.setProgress(Number(progress.value) / 1000))

document.querySelector<HTMLButtonElement>('#walk-left')!.addEventListener('click', () => engine.walk(-1))
document.querySelector<HTMLButtonElement>('#walk-right')!.addEventListener('click', () => engine.walk(1))
document.querySelector<HTMLButtonElement>('#run')!.addEventListener('click', () => engine.walk(1, true))
document.querySelector<HTMLButtonElement>('#jump')!.addEventListener('click', () => engine.jump())
document.querySelector<HTMLButtonElement>('#long-jump')!.addEventListener('click', () => engine.jump(true))

const trackingButton = document.querySelector<HTMLButtonElement>('#tracking')!
trackingButton.addEventListener('click', () => {
  const enabled = trackingButton.getAttribute('aria-pressed') !== 'true'
  trackingButton.setAttribute('aria-pressed', String(enabled))
  trackingButton.innerHTML = enabled ? '◎ &nbsp;ATENÇÃO ON' : '○ &nbsp;ATENÇÃO OFF'
  engine.setTracking(enabled)
})

document.querySelectorAll<HTMLButtonElement>('.detail-target').forEach(target => {
  target.addEventListener('click', event => {
    event.stopPropagation()
    const direction = Number(target.dataset.direction) as -1 | 1
    speech.textContent = `Analisando ${target.dataset.label} com atenção.`
    engine.express('focused', direction)
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
  engine.walkTo(targetX, event.shiftKey)
})

window.addEventListener('keydown', event => {
  const index = Number(event.key) - 1
  if (motions[index]) engine.play(motions[index].id)
  if (event.code === 'Space') {
    event.preventDefault()
    engine.togglePause()
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    engine.walk(-1, event.shiftKey)
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    engine.walk(1, event.shiftKey)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    engine.jump(event.shiftKey)
  }
})
