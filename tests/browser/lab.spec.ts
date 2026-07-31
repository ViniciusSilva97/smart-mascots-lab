import { expect, test, type Page } from '@playwright/test'

const trackRuntimeErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

const openLab = async (page: Page) => {
  await page.goto('/')
  await expect(page.locator('.lab-status')).toHaveText('LAB ONLINE')
}

test('inicializa sem exceções e atualiza a telemetria', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)

  await openLab(page)

  await expect(page.locator('#visibility-state')).toHaveText('ATIVA')
  await expect(page.locator('#fps-value')).not.toHaveText('--', {
    timeout: 5_000,
  })
  expect(runtimeErrors).toEqual([])
})

test('registra, prioriza e interrompe comandos reais', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)

  await openLab(page)
  await page.locator('#motion-mode').selectOption('full')
  await page.locator('#speed').fill('0.5')

  await page.locator('[data-motion="point"]').click()
  await expect(page.locator('#command-active')).toHaveText('APONTAR')
  await expect(page.locator('#command-decision')).toHaveText('INICIADO')
  await expect(page.locator('#byte')).toHaveAttribute('data-motion', 'point')

  await page.locator('#jump').click()
  await expect(page.locator('#command-active')).toHaveText('SALTAR')
  await expect(page.locator('#command-decision')).toHaveText('INTERROMPEU')
  await expect(page.locator('#byte')).toHaveAttribute('data-motion', 'jump')

  await page.locator('#stop-all').click()
  await expect(page.locator('#command-active')).toHaveText('RESPIRANDO')
  await expect(page.locator('#command-decision')).toHaveText('REINICIADO')
  await expect(page.locator('#byte')).toHaveAttribute('data-motion', 'idle')
  expect(runtimeErrors).toEqual([])
})

test('mantém os comandos funcionais no modo reduzido', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)

  await openLab(page)
  await page.locator('#motion-mode').selectOption('reduced')
  await expect(page.locator('#motion-mode-note')).toHaveText(
    'MODO REDUZIDO MANUAL',
  )

  const before = await page.locator('#byte-wrap').boundingBox()
  await page.locator('#walk-right').click()
  await expect(page.locator('#byte')).toHaveAttribute('data-motion', 'idle')
  const after = await page.locator('#byte-wrap').boundingBox()

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(after!.x - before!.x)).toBeGreaterThan(50)
  expect(runtimeErrors).toEqual([])
})

test('desmonta e remonta sem listeners ou callbacks residuais', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)

  await openLab(page)
  await page.evaluate(async () => {
    const lab = await import('/src/main.ts')
    lab.destroyLab()
    lab.destroyLab()
    lab.mountLab()
    lab.mountLab()
    lab.destroyLab()
    lab.mountLab()
  })

  await expect(page.locator('.lab-status')).toHaveText('LAB ONLINE')
  await expect(page.locator('#fps-value')).not.toHaveText('--', {
    timeout: 5_000,
  })
  await page.keyboard.press('4')
  await expect(page.locator('#command-active')).toHaveText('APONTAR')
  expect(runtimeErrors).toEqual([])
})

test('carrega o Byte 3D e preserva os comandos do engine', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)
  await openLab(page)
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-model-status', 'ready')
  await page.locator('[data-render-mode="3d"]').click()
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-render-mode', '3d')
  await expect(page.locator('#stage')).toHaveAttribute('data-render-mode', '3d')
  await page.locator('[data-motion="celebrate"]').click()
  await expect(page.locator('#byte')).toHaveAttribute('data-motion', 'celebrate')
  await expect(page.locator('.byte-3d-canvas')).toBeVisible()
  const stageBox = await page.locator('#stage').boundingBox()
  const canvasBox = await page.locator('.byte-3d-canvas').boundingBox()
  expect(stageBox).not.toBeNull()
  expect(canvasBox).not.toBeNull()
  expect(Math.abs(canvasBox!.width - stageBox!.width)).toBeLessThan(2)
  expect(Math.abs(canvasBox!.height - stageBox!.height)).toBeLessThan(2)
  expect(runtimeErrors).toEqual([])
})

test('encaminha locomoção, olhar e interação para o Byte 3D', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)
  await openLab(page)
  await page.locator('[data-render-mode="3d"]').click()

  const stage = page.locator('#stage')
  const bounds = await stage.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.3)
  await expect(page.locator('#byte-wrap')).not.toHaveAttribute('data-gaze-x', '0.000')

  await page.locator('#walk-right').click()
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-locomotion3d', 'walking')

  await page.locator('#stop-all').click()
  await page.locator('.product-cpu').click()
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-interaction3d', 'approaching')
  expect(runtimeErrors).toEqual([])
})

test('orienta o Byte de perfil durante o percurso e de frente ao apresentar', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page)
  await openLab(page)
  await page.locator('[data-render-mode="3d"]').click()
  await page.locator('.product-gpu').click()

  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-interaction3d', 'approaching')
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-locomotion3d', 'walking')
  await expect(page.locator('#byte-wrap')).toHaveAttribute('data-interaction3d', 'presenting', { timeout: 8_000 })
  expect(runtimeErrors).toEqual([])
})
