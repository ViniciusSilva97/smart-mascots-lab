import './style.css'

type Motion = 'idle' | 'walk' | 'point' | 'think' | 'celebrate'

const motions: Array<{ id: Motion; label: string; icon: string }> = [
  { id: 'idle', label: 'Parado', icon: '●' },
  { id: 'walk', label: 'Caminhar', icon: '▶' },
  { id: 'point', label: 'Apontar', icon: '☞' },
  { id: 'think', label: 'Pensar', icon: '?' },
  { id: 'celebrate', label: 'Comemorar', icon: '★' },
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
      <p class="eyebrow">// PROTÓTIPO 01</p>
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
      </aside>

      <div class="stage-column">
        <div class="stage-toolbar">
          <span><i></i> PREVIEW EM TEMPO REAL</span>
          <button id="pause" type="button" aria-pressed="false">Ⅱ &nbsp;PAUSAR</button>
        </div>
        <div class="stage" id="stage">
          <div class="grid"></div>
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
      </div>

      <aside class="settings-panel">
        <span class="panel-label">AJUSTES</span>
        <label for="speed">VELOCIDADE <output id="speed-value">1.0×</output></label>
        <input id="speed" type="range" min="0.5" max="2" value="1" step="0.1">
        <label for="scale">ESCALA <output id="scale-value">100%</output></label>
        <input id="scale" type="range" min="60" max="150" value="100" step="5">
        <div class="separator"></div>
        <span class="panel-label">AMBIENTE</span>
        <div class="background-options">
          <button class="bg-option active" data-bg="dark" aria-label="Fundo escuro"></button>
          <button class="bg-option" data-bg="light" aria-label="Fundo claro"></button>
          <button class="bg-option" data-bg="green" aria-label="Fundo verde"></button>
        </div>
        <div class="separator"></div>
        <dl>
          <div><dt>ESTADO</dt><dd id="state">PARADO</dd></div>
          <div><dt>FPS</dt><dd>60</dd></div>
          <div><dt>MODO</dt><dd>CSS</dd></div>
        </dl>
      </aside>
    </section>
  </main>

  <footer>
    <span>SMART ELETRO VINI © 2026</span>
    <span>BYTE • PROTÓTIPO DE MOVIMENTO</span>
  </footer>
`

const root = document.documentElement
const byte = document.querySelector<HTMLElement>('#byte')!
const stage = document.querySelector<HTMLElement>('#stage')!
const state = document.querySelector<HTMLElement>('#state')!
const speech = document.querySelector<HTMLElement>('#speech')!
const pause = document.querySelector<HTMLButtonElement>('#pause')!

const speechByMotion: Record<Motion, string> = {
  idle: 'Olá! Eu sou o Byte.',
  walk: 'Vamos explorar a loja?',
  point: 'Olha esta oferta!',
  think: 'Qual upgrade combina com você?',
  celebrate: 'Compra concluída!',
}

function setMotion(motion: Motion) {
  byte.dataset.motion = motion
  state.textContent = motions.find(item => item.id === motion)!.label.toUpperCase()
  speech.textContent = speechByMotion[motion]
  document.querySelectorAll('.motion-button').forEach(button => {
    button.classList.toggle('active', (button as HTMLElement).dataset.motion === motion)
  })
}

document.querySelectorAll<HTMLButtonElement>('.motion-button').forEach(button => {
  button.addEventListener('click', () => setMotion(button.dataset.motion as Motion))
})

const speed = document.querySelector<HTMLInputElement>('#speed')!
speed.addEventListener('input', () => {
  root.style.setProperty('--motion-speed', `${1 / Number(speed.value)}s`)
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
  const paused = pause.getAttribute('aria-pressed') === 'true'
  pause.setAttribute('aria-pressed', String(!paused))
  pause.innerHTML = paused ? 'Ⅱ &nbsp;PAUSAR' : '▶ &nbsp;CONTINUAR'
  document.querySelector<HTMLElement>('#byte-wrap')!.classList.toggle('paused', !paused)
})

window.addEventListener('keydown', event => {
  const index = Number(event.key) - 1
  if (motions[index]) setMotion(motions[index].id)
})
