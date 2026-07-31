import './style.css'
import { createMascotLab, type MascotLab } from './lab-app'

const appRoot = document.querySelector<HTMLDivElement>('#app')!
let activeLab: MascotLab | null = null

export const mountLab = (): MascotLab => {
  if (activeLab) return activeLab
  activeLab = createMascotLab(appRoot)
  return activeLab
}

export const destroyLab = (): void => {
  activeLab?.destroy()
  activeLab = null
}

export const isLabMounted = (): boolean => activeLab !== null

mountLab()

if (import.meta.hot) {
  import.meta.hot.dispose(destroyLab)
}
