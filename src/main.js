import * as THREE from 'three'
import { stars } from './data.js'
import { positions, edges } from './lattice.js'
import { initAudio, setMuted, sfx } from './audio.js'

const $ = (id) => document.getElementById(id)
const { clamp, smoothstep } = THREE.MathUtils
const ACCENT = 0x7fe9ff
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = matchMedia('(pointer: coarse)').matches
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const damp = (dt, rate) => 1 - Math.exp(-dt * rate)
const reveal = (el, cls = 'show') => {
  el.hidden = false
  void el.offsetWidth
  el.classList.add(cls)
}

function texture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function starTex(rays, lengths) {
  return texture(512, 512, (g, w) => {
    const c = w / 2
    g.translate(c, c)
    const bloom = g.createRadialGradient(0, 0, 0, 0, 0, c)
    const falloff = [[0, 1], [0.022, 1], [0.045, 0.72], [0.085, 0.34], [0.15, 0.15], [0.27, 0.06], [0.5, 0.018], [1, 0]]
    for (const [stop, alpha] of falloff) {
      bloom.addColorStop(stop, `rgba(${stop < 0.05 ? '255,255,255' : '176,232,255'},${alpha})`)
    }
    g.fillStyle = bloom
    g.fillRect(-c, -c, w, w)
    g.globalCompositeOperation = 'lighter'
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.75)
    halo.addColorStop(0, 'rgba(255,255,255,1)')
    halo.addColorStop(0.07, 'rgba(255,255,255,0.95)')
    halo.addColorStop(0.2, 'rgba(160,238,255,0.32)')
    halo.addColorStop(0.5, 'rgba(127,233,255,0.07)')
    halo.addColorStop(1, 'rgba(127,233,255,0)')
    g.fillStyle = halo
    g.fillRect(-c, -c, w, w)
    const ring = g.createRadialGradient(0, 0, c * 0.3, 0, 0, c * 0.44)
    ring.addColorStop(0, 'rgba(127,233,255,0)')
    ring.addColorStop(0.5, 'rgba(127,233,255,0.045)')
    ring.addColorStop(1, 'rgba(127,233,255,0)')
    g.fillStyle = ring
    g.fillRect(-c, -c, w, w)
    for (let i = 0; i < rays; i++) {
      const length = c * lengths[i % lengths.length]
      const ray = g.createLinearGradient(0, 0, length, 0)
      ray.addColorStop(0, 'rgba(255,255,255,0.95)')
      ray.addColorStop(0.22, 'rgba(214,243,255,0.42)')
      ray.addColorStop(1, 'rgba(127,233,255,0)')
      g.save()
      g.rotate((i / rays) * Math.PI * 2 - Math.PI / 2)
      g.fillStyle = ray
      g.beginPath()
      g.moveTo(0, -c * 0.013)
      g.lineTo(length, 0)
      g.lineTo(0, c * 0.013)
      g.closePath()
      g.fill()
      g.restore()
    }
  })
}

const STAR_TEX = [
  starTex(4, [0.95]),
  starTex(6, [0.85]),
  starTex(8, [0.95, 0.45]),
  starTex(5, [0.8]),
  starTex(4, [0.95, 0.5]),
  starTex(6, [0.9, 0.5]),
]
const STAR_TINTS = [0xffffff, 0xe4f5ff, 0xcfeeff]

const ringTex = texture(128, 128, (g, w) => {
  g.strokeStyle = '#fff'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(w / 2, 6)
  g.lineTo(w - 6, w / 2)
  g.lineTo(w / 2, w - 6)
  g.lineTo(6, w / 2)
  g.closePath()
  g.stroke()
})

const dotTex = texture(64, 64, (g, w) => {
  const c = w / 2
  const d = g.createRadialGradient(c, c, 0, c, c, c)
  d.addColorStop(0, 'rgba(255,255,255,1)')
  d.addColorStop(0.1, 'rgba(255,255,255,1)')
  d.addColorStop(0.24, 'rgba(255,255,255,0.5)')
  d.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  d.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = d
  g.fillRect(0, 0, w, w)
})

const streakTex = texture(512, 64, (g, w, h) => {
  g.translate(w / 2, h / 2)
  g.scale(w / h, 1)
  const s = g.createRadialGradient(0, 0, 0, 0, 0, h / 2)
  s.addColorStop(0, 'rgba(255,255,255,0.9)')
  s.addColorStop(0.25, 'rgba(255,255,255,0.28)')
  s.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = s
  g.fillRect(-h / 2, -h / 2, h, h)
})

const cloudTex = texture(256, 256, (g, w) => {
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 26; i++) {
    const x = w * (0.25 + Math.random() * 0.5)
    const y = w * (0.25 + Math.random() * 0.5)
    const r = w * (0.1 + Math.random() * 0.18)
    const b = g.createRadialGradient(x, y, 0, x, y, r)
    b.addColorStop(0, 'rgba(255,255,255,0.1)')
    b.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = b
    g.fillRect(0, 0, w, w)
  }
})

const canvas = $('scene')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000)

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }
const onShell = (min, max) => new THREE.Vector3().randomDirection().multiplyScalar(min + Math.random() * (max - min))

function field(count, size, opacity, min, max, tex = dotTex) {
  const pts = Array.from({ length: count }, () => onShell(min, max))
  const geometry = new THREE.BufferGeometry().setFromPoints(pts)
  const tints = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const cool = Math.random() ** 3
    const lum = 0.6 + Math.random() * 0.4
    tints.set([lum * (1 - cool * 0.3), lum * (1 - cool * 0.1), lum], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(tints, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({ map: tex, size, opacity, vertexColors: true, ...additive }))
}

function sheet(tex, w, h, color, opacity, min, max, roll) {
  const material = new THREE.MeshBasicMaterial({ map: tex, color, opacity, side: THREE.DoubleSide, ...additive })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
  mesh.position.copy(onShell(min, max))
  mesh.lookAt(0, 0, 0)
  mesh.rotateZ(roll)
  return mesh
}

const sky = new THREE.Group()
sky.add(
  field(3200, 4, 0.85, 500, 1500),
  field(700, 7, 0.9, 500, 1500),
  field(120, 16, 1, 500, 1500, STAR_TEX[0]),
  field(100, 16, 1, 500, 1500, STAR_TEX[1]),
  field(22, 34, 1, 600, 1500, STAR_TEX[2]),
  field(18, 30, 1, 600, 1500, STAR_TEX[3]),
)
for (let i = 0; i < 12; i++) {
  const tint = i % 3 === 0 ? 0x3f8fb5 : 0x27405e
  sky.add(sheet(cloudTex, 1700, 1700, tint, 0.35 + Math.random() * 0.3, 1600, 2000, Math.random() * 6))
}
const band = Math.random() * Math.PI
for (let i = 0; i < 9; i++) {
  const w = 1400 + Math.random() * 1600
  sky.add(sheet(streakTex, w, 80 + Math.random() * 130, 0x38d8ff, 0.3 + Math.random() * 0.3, 1500, 1900, band + (Math.random() - 0.5) * 0.7))
}
scene.add(sky)

const lattice = new THREE.Group()
scene.add(lattice)
const motesNear = field(110, 0.6, 0, 6, 48)
lattice.add(motesNear)

const at = (i) => new THREE.Vector3().fromArray(positions[i])
const lines = new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [at(a), at(b)])),
  new THREE.LineBasicMaterial({ color: ACCENT, opacity: 0.15, ...additive }),
)
lattice.add(lines)

const SIZES = [4.8, 7.5, 12, 18.5]
const nodes = stars.map((star, i) => {
  const material = new THREE.SpriteMaterial({ map: STAR_TEX[i % STAR_TEX.length], color: STAR_TINTS[i % 3], ...additive })
  material.rotation = (((i * 37) % 30) - 15) * (Math.PI / 180)
  const sprite = new THREE.Sprite(material)
  sprite.position.copy(at(star.slot))
  lattice.add(sprite)
  return { sprite, base: SIZES[star.size], grow: 0, fade: 1 }
})

const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: ACCENT, opacity: 0, ...additive }))
lattice.add(marker)

const view = { r: 560, theta: 0.6, phi: 1.3 }
const goal = { ...view }
const focus = new THREE.Vector3()
const focusGoal = new THREE.Vector3()
const pointer = { x: -100, y: -100, nx: 0, ny: 0, sx: 0, sy: 0, rx: -100, ry: -100 }
const shift = { x: 0, y: 0 }
let mode = 'loading'
let hovered = -1
let selected = -1
let near = false
let uiHover = false
let speed = 5
let intro = 0
let introGoal = 0
let arrive = 64
let nearR = 96
let farR = 270

const body = document.body
const card = $('card')
const panel = $('panel')
const hintText = $('hint-text')
const fly = $('fly')
const dust = $('dust')
const dustCtx = dust.getContext('2d')
const motes = []

function resize() {
  const w = innerWidth
  const h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  const fit = Math.max(1, 0.85 / camera.aspect)
  arrive = 64 * fit
  nearR = arrive * 1.5
  farR = arrive * 4.2
  if (mode === 'live') goal.r = clamp(goal.r, 22, farR * 1.1)
  else if (mode !== 'warp') goal.r = arrive * 2.1
  if (mode === 'loading') view.r = goal.r
  const dpr = Math.min(devicePixelRatio, 2)
  dust.width = w * dpr
  dust.height = h * dpr
  dustCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
addEventListener('resize', resize)
addEventListener('resize', () => selected >= 0 && setLens(panel, 'lens-panel', 36))
resize()

const projected = new THREE.Vector3()
function screenOf(i) {
  projected.copy(nodes[i].sprite.position).project(camera)
  return { x: ((projected.x + 1) / 2) * innerWidth, y: ((1 - projected.y) / 2) * innerHeight, z: projected.z }
}

function pick(x, y, slack = 1) {
  if (mode !== 'live' || !near) return -1
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < nodes.length; i++) {
    const p = screenOf(i)
    if (p.z > 1) continue
    const d = Math.hypot(p.x - x, p.y - y)
    if (d < (16 + stars[i].size * 7) * slack && d < bestD) {
      best = i
      bestD = d
    }
  }
  return best
}

function syncCursor() {
  body.classList.toggle('on-target', uiHover || hovered >= 0)
}

function setHover(i) {
  if (i === hovered) return
  hovered = i
  if (i >= 0) {
    const star = stars[i]
    sfx.hover(i)
    card.querySelector('.card-kind').textContent = `${star.kind} · ${star.meta}`
    card.querySelector('.card-title').textContent = star.title
    card.querySelector('.card-tag').textContent = star.tagline
    card.querySelector('.card-cta').textContent = coarse ? 'Tap again to open' : 'Click to open'
    setLens(card, 'lens-card', 22)
  }
  syncCursor()
  updateHint()
}

let hintKey = ''
let hintHtml = ''
function updateHint() {
  let key
  if (selected >= 0) {
    key = 'panel'
    hintHtml = coarse
      ? 'Use <b>Prev</b> and <b>Next</b> to travel between stars'
      : '<b>← →</b> travel between stars · <b>Esc</b> returns to the lattice'
  } else if (hovered >= 0) {
    key = `star${hovered}`
    hintHtml = `<b>${coarse ? 'Tap again' : 'Click'}</b> to open ${stars[hovered].title}`
  } else if (near) {
    key = 'near'
    hintHtml = coarse
      ? 'Drag to turn the crystal · <b>Tap</b> a star to read its light'
      : 'Drag to turn the crystal · <b>Hover</b> a star to read its light'
  } else {
    key = 'far'
    hintHtml = coarse
      ? '<b>Pinch</b> to approach the constellation'
      : '<b>Scroll down</b> to approach the constellation'
  }
  fly.hidden = key !== 'far'
  if (key === hintKey) return
  hintKey = key
  hintText.classList.add('swap')
  setTimeout(() => {
    hintText.innerHTML = hintHtml
    hintText.classList.remove('swap')
  }, 280)
}

const el = (tag, text) => Object.assign(document.createElement(tag), { textContent: text })

const lensSizes = {}
function setLens(target, id, bezel) {
  const w = target.offsetWidth
  const h = target.offsetHeight
  if (!w || !h || lensSizes[id] === `${w}x${h}`) return
  lensSizes[id] = `${w}x${h}`
  const map = document.createElement('canvas')
  map.width = w
  map.height = h
  const g = map.getContext('2d')
  const image = g.createImageData(w, h)
  const bend = (at, size) => {
    const edge = Math.min(at, size - 1 - at)
    if (edge >= bezel) return 0
    const pull = (1 - edge / bezel) ** 2
    return at < size / 2 ? pull : -pull
  }
  for (let y = 0; y < h; y++) {
    const gy = 128 + bend(y, h) * 127
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      image.data[i] = 128 + bend(x, w) * 127
      image.data[i + 1] = gy
      image.data[i + 2] = 128
      image.data[i + 3] = 255
    }
  }
  g.putImageData(image, 0, 0)
  const feImage = document.querySelector(`#${id} feImage`)
  feImage.setAttribute('width', w)
  feImage.setAttribute('height', h)
  feImage.setAttribute('href', map.toDataURL())
}

function factItem(fact) {
  const href = /^\S+@\S+\.\S+$/.test(fact) ? `mailto:${fact}` : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(fact) ? `https://${fact}` : ''
  if (!href) return el('li', fact)
  const a = el('a', fact)
  a.href = href
  if (href.startsWith('http')) {
    a.target = '_blank'
    a.rel = 'noopener'
  }
  const li = document.createElement('li')
  li.append(a)
  return li
}

function fillPanel() {
  const star = stars[selected]
  $('panel-kind').textContent = star.kind
  $('panel-title').textContent = star.title
  $('panel-meta').textContent = star.meta
  $('panel-count').textContent = `${String(selected + 1).padStart(2, '0')} / ${stars.length}`
  $('panel-links').replaceChildren(
    ...star.links.map((link) => {
      const a = el('a', `${link.label} ↗`)
      a.href = link.href
      if (link.href.startsWith('http')) {
        a.target = '_blank'
        a.rel = 'noopener'
      }
      const li = document.createElement('li')
      li.append(a)
      return li
    }),
  )
  const facts = document.createElement('ul')
  facts.append(...star.facts.map(factItem))
  const bodyEl = $('panel-body')
  bodyEl.replaceChildren(...star.body.map((p) => el('p', p)), facts)
  bodyEl.scrollTop = 0
}

function open(i, dir = 0) {
  const fresh = selected < 0
  zoomLeft = 0
  selected = (i + stars.length) % stars.length
  focusGoal.copy(nodes[selected].sprite.position)
  goal.r = 30 + stars[selected].size * 3
  speed = 3
  hovered = -1
  syncCursor()
  body.classList.add('panel-open')
  if (fresh) {
    sfx.open(selected)
    fillPanel()
    reveal(panel)
    setLens(panel, 'lens-panel', 36)
    $('panel-title').focus({ preventScroll: true })
  } else {
    if (dir < 0) sfx.prev()
    else if (dir > 0) sfx.next()
    else sfx.open(selected)
    panel.classList.add('swap')
    setTimeout(() => {
      fillPanel()
      panel.classList.remove('swap')
    }, 250)
  }
  updateHint()
}

function close() {
  if (selected < 0) return
  selected = -1
  focusGoal.set(0, 0, 0)
  goal.r = arrive
  sfx.close()
  body.classList.remove('panel-open')
  panel.classList.remove('show')
  setTimeout(() => {
    if (selected < 0) panel.hidden = true
  }, 700)
  updateHint()
}

const touches = new Map()
let drag = null
let pinch = 0
const spread = () => {
  const [a, b] = [...touches.values()]
  return Math.hypot(a.x - b.x, a.y - b.y)
}
let zoomLeft = 0
const zoom = (factor) => {
  goal.r = clamp(goal.r * factor, 22, farR * 1.1)
  speed = 5
}

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'live') return
  canvas.setPointerCapture(e.pointerId)
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (touches.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0 }
  else {
    drag = null
    pinch = spread()
  }
})

canvas.addEventListener('pointermove', (e) => {
  if (mode !== 'live') return
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (touches.size === 2) {
    const d = spread()
    zoom(pinch / d)
    pinch = d
  } else if (drag) {
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    drag.x = e.clientX
    drag.y = e.clientY
    drag.moved += Math.abs(dx) + Math.abs(dy)
    if (drag.moved > 6) {
      body.classList.add('is-dragging')
      goal.theta -= dx * 0.005
      goal.phi = clamp(goal.phi - dy * 0.005, 0.3, Math.PI - 0.3)
      speed = 5
      setHover(-1)
    }
  } else if (e.pointerType === 'mouse') {
    setHover(pick(e.clientX, e.clientY))
  }
})

function release(e, tapped) {
  touches.delete(e.pointerId)
  if (drag && tapped && drag.moved <= 6) {
    const touch = e.pointerType !== 'mouse'
    const i = pick(e.clientX, e.clientY, touch ? 1.6 : 1)
    if (i >= 0 && (!touch || i === hovered)) open(i)
    else setHover(i)
  }
  drag = null
  body.classList.remove('is-dragging')
}
canvas.addEventListener('pointerup', (e) => release(e, true))
canvas.addEventListener('pointercancel', (e) => release(e, false))
canvas.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && !drag && setHover(-1))

addEventListener(
  'wheel',
  (e) => {
    if (mode !== 'live' || e.target.closest('#panel')) return
    e.preventDefault()
    zoomLeft = clamp(zoomLeft - e.deltaY * 0.0011, -1.6, 1.6)
    speed = 5
  },
  { passive: false },
)

addEventListener('pointermove', (e) => {
  pointer.x = e.clientX
  pointer.y = e.clientY
  pointer.nx = (e.clientX / innerWidth) * 2 - 1
  pointer.ny = (e.clientY / innerHeight) * 2 - 1
  if (reduced || e.pointerType !== 'mouse') return
  for (let i = 0; i < 2 && motes.length < 160; i++) {
    motes.push({
      x: e.clientX + (Math.random() - 0.5) * 8,
      y: e.clientY + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 34,
      vy: (Math.random() - 0.5) * 34 + 12,
      life: 1,
      size: 0.4 + Math.random() * 1.3,
    })
  }
})

document.addEventListener('pointerover', (e) => {
  const target = e.target.closest?.('[data-hover], a')
  if (!!target === uiHover) return
  uiHover = !!target
  if (uiHover) sfx.tick()
  syncCursor()
})

addEventListener('keydown', (e) => {
  if (mode !== 'live') return
  if (e.key === 'ArrowRight') open(selected + 1, 1)
  else if (e.key === 'ArrowLeft') open(selected < 0 ? -1 : selected - 1, -1)
  else if (e.key === 'Escape') close()
})

$('prev').addEventListener('click', () => open(selected - 1, -1))
$('next').addEventListener('click', () => open(selected + 1, 1))
$('panel-close').addEventListener('click', close)
panel.addEventListener('pointermove', (e) => {
  const box = panel.getBoundingClientRect()
  panel.style.setProperty('--mx', `${e.clientX - box.left}px`)
  panel.style.setProperty('--my', `${e.clientY - box.top}px`)
  panel.style.setProperty('--lit', 1)
})
panel.addEventListener('pointerleave', () => panel.style.setProperty('--lit', 0))

fly.addEventListener('click', () => {
  zoomLeft = 0
  goal.r = arrive
  goal.theta += 2.2
  goal.phi = 1.25
  speed = 1.5
  sfx.descend()
})

$('sound').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'
  e.currentTarget.setAttribute('aria-pressed', on)
  e.currentTarget.textContent = on ? 'Sound on' : 'Sound off'
  setMuted(!on)
  if (on) {
    initAudio()
    sfx.unmute()
  }
})

$('home').addEventListener('click', () => {
  if (mode !== 'live') return
  close()
  setHover(-1)
  mode = 'title'
  near = false
  zoomLeft = 0
  goal.r = arrive * 2.1
  speed = 2
  body.classList.replace('is-live', 'is-title')
  const hud = $('hud')
  hud.classList.remove('show')
  setTimeout(() => {
    if (mode !== 'live') hud.hidden = true
  }, 1400)
  reveal($('title'))
})

$('index').append(
  ...stars.map((star, i) => {
    const b = el('button', `${star.kind}: ${star.title}`)
    b.addEventListener('focus', () => setHover(i))
    b.addEventListener('blur', () => setHover(-1))
    b.addEventListener('click', () => open(i))
    return b
  }),
)

function drawDust(dt) {
  dustCtx.clearRect(0, 0, innerWidth, innerHeight)
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i]
    m.life -= dt * 1.1
    if (m.life <= 0) {
      motes.splice(i, 1)
      continue
    }
    m.x += m.vx * dt
    m.y += m.vy * dt
    dustCtx.fillStyle = `rgba(255,255,255,${m.life * 0.85})`
    dustCtx.beginPath()
    dustCtx.arc(m.x, m.y, m.size * (0.5 + m.life * 0.5), 0, Math.PI * 2)
    dustCtx.fill()
  }
}

const cursorDot = document.querySelector('.cursor')
const cursorRing = document.querySelector('.cursor-ring')
function drawCursor(dt) {
  const k = damp(dt, 14)
  pointer.rx += (pointer.x - pointer.rx) * k
  pointer.ry += (pointer.y - pointer.ry) * k
  cursorDot.style.setProperty('--x', `${pointer.x}px`)
  cursorDot.style.setProperty('--y', `${pointer.y}px`)
  cursorRing.style.setProperty('--x', `${pointer.rx}px`)
  cursorRing.style.setProperty('--y', `${pointer.ry}px`)
}

function placeCard() {
  const show = hovered >= 0 && hovered !== selected
  card.classList.toggle('show', show)
  if (!show) return
  const p = screenOf(hovered)
  const w = card.offsetWidth
  const h = card.offsetHeight
  const x = p.x + 28 + w > innerWidth - 12 ? p.x - 28 - w : p.x + 28
  card.style.transform = `translate(${clamp(x, 12, innerWidth - w - 12)}px, ${clamp(p.y - h / 2, 76, innerHeight - h - 130)}px)`
}

let last = performance.now()
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  const t = now / 1000

  if (!reduced && !drag && selected < 0 && hovered < 0) goal.theta += dt * 0.035
  if (Math.abs(zoomLeft) > 0.0004) {
    const step = zoomLeft * damp(dt, 4)
    zoomLeft -= step
    zoom(Math.exp(step))
  }
  const k = damp(dt, speed)
  view.r += (goal.r - view.r) * k
  view.theta += (goal.theta - view.theta) * k
  view.phi += (goal.phi - view.phi) * k
  focus.lerp(focusGoal, damp(dt, 3.5))
  if (!reduced) {
    pointer.sx += (pointer.nx - pointer.sx) * damp(dt, 2.5)
    pointer.sy += (pointer.ny - pointer.sy) * damp(dt, 2.5)
  }
  const phi = clamp(view.phi - pointer.sy * 0.07, 0.15, Math.PI - 0.15)
  camera.position.setFromSphericalCoords(view.r, phi, view.theta - pointer.sx * 0.11).add(focus)
  camera.lookAt(focus)

  const wide = innerWidth > 720
  const ks = damp(dt, 4)
  shift.x += ((selected >= 0 && wide ? Math.min(460, innerWidth) / 2 : 0) - shift.x) * ks
  shift.y += ((selected >= 0 && !wide ? innerHeight * 0.3 : 0) - shift.y) * ks
  if (shift.x > 0.5 || shift.y > 0.5) camera.setViewOffset(innerWidth, innerHeight, shift.x, shift.y, innerWidth, innerHeight)
  else if (camera.view) camera.clearViewOffset()

  if (mode === 'live') {
    const isNear = view.r < nearR
    if (isNear !== near) {
      near = isNear
      if (near) sfx.near()
      else {
        sfx.far()
        setHover(-1)
      }
      updateHint()
    }
  }

  intro += (introGoal - intro) * damp(dt, 2.2)
  motesNear.material.opacity = 0.6 * intro
  const kg = damp(dt, 9)
  nodes.forEach((node, i) => {
    const active = i === hovered || i === selected
    node.grow += ((active ? 1 : 0) - node.grow) * kg
    const twinkle = 1 + Math.sin(t * 1.7 + i * 2.1) * 0.07
    node.sprite.scale.setScalar(node.base * (1 + node.grow * 0.55) * twinkle)
    node.fade += ((selected >= 0 && !active ? 0.4 : 1) - node.fade) * kg
    node.sprite.material.opacity = node.fade * intro
  })
  lines.material.opacity = (0.1 + 0.3 * (1 - smoothstep(view.r, arrive, farR))) * intro

  const lit = hovered >= 0 ? hovered : selected
  marker.material.opacity += ((lit >= 0 ? 0.9 : 0) - marker.material.opacity) * kg
  if (lit >= 0) {
    marker.position.copy(nodes[lit].sprite.position)
    marker.scale.setScalar(nodes[lit].base * (0.48 + Math.sin(t * 3) * 0.03))
    marker.material.rotation = t * 0.5
  }
  sky.rotation.y += dt * 0.003

  renderer.render(scene, camera)
  placeCard()
  drawDust(dt)
  drawCursor(dt)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

function countUp(target, ms, pad, onStep) {
  return new Promise((resolve) => {
    const start = performance.now()
    const step = (now) => {
      const p = Math.min((now - start) / ms, 1)
      const eased = 1 - (1 - p) ** 3
      target.textContent = String(Math.round(eased * 100)).padStart(pad, '0')
      onStep?.(eased)
      if (p < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

async function boot() {
  await Promise.race([document.fonts.ready, wait(1500)])
  body.classList.add('is-title', 'is-intro')
  reveal($('title'))
  mode = 'title'
  await wait(reduced ? 0 : 800)
  introGoal = 1
  await wait(3200)
  body.classList.remove('is-intro')
}

$('begin').addEventListener('click', async () => {
  if (mode !== 'title') return
  mode = 'warp'
  initAudio()
  sfx.begin()
  const title = $('title')
  const warp = $('warp')
  const text = $('warp-text')
  const phases = ['Aligning stars', 'Cutting facets', 'Opening the sky']
  title.classList.remove('show')
  reveal(warp)
  goal.r = farR
  goal.theta += 2.4
  speed = 0.9
  await countUp($('warp-count'), reduced ? 800 : 3000, 2, (p) => (text.textContent = phases[Math.min(2, Math.floor(p * 3))]))
  title.hidden = true
  body.classList.replace('is-title', 'is-live')
  warp.classList.remove('show')
  reveal($('hud'))
  mode = 'live'
  speed = 5
  sfx.arrive()
  updateHint()
  await wait(900)
  warp.hidden = true
})

boot()
