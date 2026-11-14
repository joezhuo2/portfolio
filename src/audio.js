let ctx
let out
let muted = false

const SCALE = [1046.5, 1174.7, 1396.9, 1568, 1760, 2093, 2349.3, 2793.8]
const GLASS = [1, 2.76, 5.4, 8.93]

export function initAudio() {
  if (ctx) return ctx.resume()
  ctx = new AudioContext()
  out = ctx.createGain()
  out.gain.value = 0.6
  out.connect(ctx.destination)
  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.27
  const feedback = ctx.createGain()
  feedback.gain.value = 0.42
  const damp = ctx.createBiquadFilter()
  damp.type = 'lowpass'
  damp.frequency.value = 3800
  const wet = ctx.createGain()
  wet.gain.value = 0.5
  out.connect(delay)
  delay.connect(damp).connect(feedback).connect(delay)
  damp.connect(wet).connect(ctx.destination)
}

export function setMuted(value) {
  muted = value
  if (out) out.gain.setTargetAtTime(value ? 0 : 0.6, ctx.currentTime, 0.05)
}

function bell(freq, { at = 0, dur = 0.9, vol = 0.12, partials = GLASS } = {}) {
  if (!ctx || muted) return
  const t = ctx.currentTime + at
  partials.forEach((ratio, i) => {
    const f = freq * ratio
    if (f > 16000) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol / (i + 1) ** 1.6, t + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i * 0.7 + 1))
    osc.connect(gain).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  })
}

function whoosh({ at = 0, dur = 2, from = 300, to = 5000, vol = 0.1 } = {}) {
  if (!ctx || muted) return
  const t = ctx.currentTime + at
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 1.4
  band.frequency.setValueAtTime(from, t)
  band.frequency.exponentialRampToValueAtTime(to, t + dur)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + dur * 0.6)
  gain.gain.linearRampToValueAtTime(0, t + dur)
  src.connect(band).connect(gain).connect(out)
  src.start(t)
}

const glitter = (count, span, rising) => {
  for (let i = 0; i < count; i++) {
    const k = rising ? i : count - 1 - i
    const note = SCALE[(k * 3) % SCALE.length] * (1 + Math.floor((k / count) * 2))
    bell(note, { at: (i / count) * span + Math.random() * 0.04, dur: 0.7, vol: 0.05 })
  }
}

export const sfx = {
  tick: () => bell(3136, { dur: 0.12, vol: 0.03, partials: [1, 2.4] }),
  hover: (i) => bell(SCALE[i % SCALE.length] * 2 ** (Math.floor(i / SCALE.length) % 3), { dur: 0.6, vol: 0.07 }),
  open: (i) => {
    const f = SCALE[i % SCALE.length]
    bell(f / 2, { dur: 1.6, vol: 0.12 })
    bell(f * 0.75, { at: 0.07, dur: 1.4, vol: 0.09 })
    bell(f, { at: 0.14, dur: 1.8, vol: 0.09 })
  },
  close: () => {
    bell(1568, { dur: 0.5, vol: 0.07 })
    bell(1046.5, { at: 0.09, dur: 0.9, vol: 0.07 })
  },
  next: () => {
    bell(1318.5, { dur: 0.6, vol: 0.12 })
    bell(1975.5, { at: 0.08, dur: 1.1, vol: 0.11 })
  },
  prev: () => {
    bell(1975.5, { dur: 0.6, vol: 0.12 })
    bell(1318.5, { at: 0.08, dur: 1.1, vol: 0.11 })
  },
  begin: () => {
    ;[523.3, 784, 1046.5, 1568, 2093].forEach((f, i) => bell(f, { at: i * 0.09, dur: 2.6, vol: 0.09 }))
    whoosh({ dur: 2.8, from: 200, to: 6000, vol: 0.07 })
    glitter(14, 2.6, true)
  },
  arrive: () => {
    bell(2093, { dur: 2.4, vol: 0.08 })
    bell(3136, { at: 0.12, dur: 2, vol: 0.05 })
  },
  descend: () => {
    whoosh({ dur: 2.4, from: 5000, to: 250, vol: 0.08 })
    glitter(12, 2.2, false)
  },
  near: () => {
    bell(1975.5, { dur: 1.5, vol: 0.06 })
    bell(2960, { at: 0.1, dur: 1.2, vol: 0.04 })
  },
  far: () => bell(880, { dur: 1.4, vol: 0.06, partials: [1, 2.76] }),
  unmute: () => bell(2637, { dur: 0.5, vol: 0.06 }),
}
