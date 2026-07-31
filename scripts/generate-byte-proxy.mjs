import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'

if (!globalThis.FileReader) globalThis.FileReader = class FileReader {
  result = null; onloadend = null
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.() }) }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.() }) }
}

const root = new THREE.Group(); root.name = 'ByteProxy'
const graphite = new THREE.MeshStandardMaterial({ color: 0x252d3b, roughness: 0.62, metalness: 0.22 })
const orange = new THREE.MeshStandardMaterial({ color: 0xf2a51a, roughness: 0.55, metalness: 0.15 })
const screen = new THREE.MeshStandardMaterial({ color: 0x071016, emissive: 0x00d8ef, emissiveIntensity: 0.2 })
const cyan = new THREE.MeshStandardMaterial({ color: 0x75f7ff, emissive: 0x22dbe9, emissiveIntensity: 2 })
const box = (name, size, position, material) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size, 2, 2, 2), material)
  mesh.name = name; mesh.position.set(...position); return mesh
}
root.add(box('ByteBody', [1.65, 1.35, 0.9], [0, 1.55, 0], graphite))
root.add(box('ByteChestScreen', [0.58, 0.55, 0.08], [0, 1.62, 0.49], screen))
for (const x of [-0.15, 0, 0.15]) root.add(box('ChestPixel', [0.08, 0.08, 0.04], [x, 1.64, 0.55], cyan))
const head = new THREE.Group(); head.name = 'ByteHead'; head.position.set(0, 3.15, 0)
head.add(box('ByteHeadShell', [2.15, 1.52, 1.05], [0, 0, 0], graphite))
head.add(box('ByteFace', [1.72, 1.05, 0.08], [0, 0, 0.57], screen))
head.add(box('ByteEyeLeft', [0.28, 0.42, 0.05], [-0.42, 0.07, 0.63], cyan))
head.add(box('ByteEyeRight', [0.28, 0.42, 0.05], [0.42, 0.07, 0.63], cyan))
const antenna = new THREE.Group(); antenna.name = 'ByteAntenna'; antenna.position.set(0, 1.03, 0)
antenna.add(box('ByteAntennaStem', [0.12, 0.55, 0.12], [0, 0, 0], graphite))
antenna.add(box('ByteAntennaLight', [0.28, 0.24, 0.28], [0, 0.39, 0], cyan))
head.add(antenna); root.add(head)
const addLimb = (name, x, y, size, foot = false) => {
  const pivot = new THREE.Group(); pivot.name = name; pivot.position.set(x, y, 0)
  pivot.add(box(`${name}Mesh`, size, [0, -size[1] / 2, 0], graphite))
  if (foot) pivot.add(box(`${name}Foot`, [0.72, 0.34, 1.05], [0, -size[1] - 0.08, 0.14], orange))
  root.add(pivot)
}
addLimb('ByteArmLeft', -1.05, 2.15, [0.42, 1.25, 0.48])
addLimb('ByteArmRight', 1.05, 2.15, [0.42, 1.25, 0.48])
addLimb('ByteLegLeft', -0.48, 0.9, [0.52, 0.72, 0.58], true)
addLimb('ByteLegRight', 0.48, 0.9, [0.52, 0.72, 0.58], true)
await mkdir('public/models', { recursive: true })
const binary = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
await writeFile('public/models/byte-proxy.glb', Buffer.from(binary))
