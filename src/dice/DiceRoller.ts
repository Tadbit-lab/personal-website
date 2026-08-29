// @ts-ignore
import * as THREE from 'three'

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let die1Mesh: THREE.Mesh | null = null
let die2Mesh: THREE.Mesh | null = null
let containerElement: HTMLElement | null = null
let animationFrameId: number | null = null
let isRolling = false

// ... rest of file remains the same ...

// Helper: Create Canvas texture for die face
function createDieFaceTexture(value: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  // Polished red casino die background
  ctx.fillStyle = '#d90429'
  ctx.fillRect(0, 0, 256, 256)

  // Inner border detail
  ctx.strokeStyle = '#9b021c'
  ctx.lineWidth = 10
  ctx.strokeRect(5, 5, 246, 246)

  // White pips (dots)
  ctx.fillStyle = '#ffffff'
  const drawPip = (x: number, y: number) => {
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  const p1 = 68, p2 = 128, p3 = 188

  if (value === 1) {
    drawPip(p2, p2)
  } else if (value === 2) {
    drawPip(p1, p1); drawPip(p3, p3)
  } else if (value === 3) {
    drawPip(p1, p1); drawPip(p2, p2); drawPip(p3, p3)
  } else if (value === 4) {
    drawPip(p1, p1); drawPip(p3, p1); drawPip(p1, p3); drawPip(p3, p3)
  } else if (value === 5) {
    drawPip(p1, p1); drawPip(p3, p1); drawPip(p2, p2); drawPip(p1, p3); drawPip(p3, p3)
  } else if (value === 6) {
    drawPip(p1, p1); drawPip(p3, p1); drawPip(p1, p2); drawPip(p3, p2); drawPip(p1, p3); drawPip(p3, p3)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Create 6 face materials for a die
function createDieMaterials(): THREE.MeshStandardMaterial[] {
  // Face order in BoxGeometry: +X (2), -X (5), +Y (3), -Y (4), +Z (1), -Z (6)
  const faceValues = [2, 5, 3, 4, 1, 6]
  return faceValues.map((val) => {
    return new THREE.MeshStandardMaterial({
      map: createDieFaceTexture(val),
      roughness: 0.2,
      metalness: 0.1,
    })
  })
}

// Find target element in DOM
function locateContainer(selector?: string): HTMLElement | null {
  if (selector) {
    const el = document.querySelector(selector) as HTMLElement
    if (el) return el
  }
  const selectors = [
    '#dice-container-crapsgame',
    '#dice-container',
    '.craps-main',
    '#dice-box',
    '.craps-board',
  ]
  for (const s of selectors) {
    const el = document.querySelector(s) as HTMLElement
    if (el) return el
  }
  return null
}

export async function init(containerSelector: string = '#dice-container-crapsgame'): Promise<any> {
  const container = locateContainer(containerSelector)
  if (!container) {
    console.warn(`[DiceRoller] Container for "${containerSelector}" not found.`)
    return null
  }

  // Reuse existing instance if attached to same container
  if (renderer && containerElement === container) {
    return { renderer, scene, camera }
  }

  // Cleanup old instance
  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  containerElement = container
  containerElement.style.position = 'relative'
  if (!containerElement.style.minHeight || containerElement.clientHeight < 100) {
    containerElement.style.minHeight = '240px'
  }

  const width = containerElement.clientWidth || 600
  const height = containerElement.clientHeight || 240

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 8, 12)
  camera.lookAt(0, 0, 0)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const canvas = renderer.domElement
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '10'

  containerElement.appendChild(canvas)

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 12, 8)
  dirLight.castShadow = true
  scene.add(dirLight)

  // 5. Dice Meshes
  const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8)
  const materials = createDieMaterials()

  die1Mesh = new THREE.Mesh(geometry, materials)
  die1Mesh.position.set(-1.6, 0, 0)
  die1Mesh.castShadow = true
  scene.add(die1Mesh)

  die2Mesh = new THREE.Mesh(geometry, materials)
  die2Mesh.position.set(1.6, 0, 0)
  die2Mesh.castShadow = true
  scene.add(die2Mesh)

  // Render loop
  const render = () => {
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
  render()

  // Handle Resize
  const handleResize = () => {
    if (!containerElement || !renderer || !camera) return
    const w = containerElement.clientWidth
    const h = containerElement.clientHeight
    if (w > 0 && h > 0) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      render()
    }
  }

  window.removeEventListener('resize', handleResize)
  window.addEventListener('resize', handleResize)

  return { renderer, scene, camera }
}

// Target rotations for values 1 to 6 (+Z front face is Value 1)
function getTargetRotation(val: number): { x: number; y: number } {
  switch (val) {
    case 1: return { x: 0, y: 0 }
    case 2: return { x: 0, y: -Math.PI / 2 }
    case 3: return { x: -Math.PI / 2, y: 0 }
    case 4: return { x: Math.PI / 2, y: 0 }
    case 5: return { x: 0, y: Math.PI / 2 }
    case 6: return { x: 0, y: Math.PI }
    default: return { x: 0, y: 0 }
  }
}

export async function rollTwo(
  val1: number,
  val2: number,
  containerSelector: string = '#dice-container-crapsgame'
): Promise<[number, number]> {
  if (!renderer || !scene || !camera || !die1Mesh || !die2Mesh) {
    await init(containerSelector)
  }

  if (!renderer || !scene || !camera || !die1Mesh || !die2Mesh) {
    return [val1, val2]
  }

  if (isRolling) return [val1, val2]
  isRolling = true

  const target1 = getTargetRotation(val1)
  const target2 = getTargetRotation(val2)

  // Add random full rotations (4 to 6 full 360-degree spins)
  const spins1X = Math.PI * 2 * (4 + Math.floor(Math.random() * 3))
  const spins1Y = Math.PI * 2 * (4 + Math.floor(Math.random() * 3))
  const spins2X = Math.PI * 2 * (4 + Math.floor(Math.random() * 3))
  const spins2Y = Math.PI * 2 * (4 + Math.floor(Math.random() * 3))

  const finalRot1X = target1.x + spins1X
  const finalRot1Y = target1.y + spins1Y
  const finalRot2X = target2.x + spins2X
  const finalRot2Y = target2.y + spins2Y

  const startTime = performance.now()
  const duration = 1200 // 1.2s animation

  return new Promise((resolve) => {
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)

      if (die1Mesh && die2Mesh) {
        // Rotation
        die1Mesh.rotation.x = finalRot1X * easeOut
        die1Mesh.rotation.y = finalRot1Y * easeOut
        die1Mesh.rotation.z = Math.sin(progress * Math.PI * 4) * 0.5 * (1 - easeOut)

        die2Mesh.rotation.x = finalRot2X * easeOut
        die2Mesh.rotation.y = finalRot2Y * easeOut
        die2Mesh.rotation.z = Math.cos(progress * Math.PI * 4) * 0.5 * (1 - easeOut)

        // Bounce height effect
        const bounceHeight = Math.sin(progress * Math.PI) * 2 * (1 - easeOut)
        die1Mesh.position.y = bounceHeight
        die2Mesh.position.y = bounceHeight

        // Slight horizontal tumble
        die1Mesh.position.x = -1.6 + Math.sin(progress * Math.PI * 2) * 0.4 * (1 - easeOut)
        die2Mesh.position.x = 1.6 - Math.sin(progress * Math.PI * 2) * 0.4 * (1 - easeOut)
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        isRolling = false
        resolve([val1, val2])
      }
    }

    animationFrameId = requestAnimationFrame(animate)
  })
}

export async function rollDie1(val: number): Promise<number> {
  const result = await rollTwo(val, Math.floor(Math.random() * 6) + 1)
  return result[0]
}

export async function rollDie2(val: number): Promise<number> {
  const result = await rollTwo(Math.floor(Math.random() * 6) + 1, val)
  return result[1]
}

export default {
  init,
  rollTwo,
  rollDie1,
  rollDie2,
}