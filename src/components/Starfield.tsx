import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  base: number
  twinkle: number
  phase: number
  depth: number
}

/**
 * Twinkling stars that drift with scroll (deeper stars move less). Sits over
 * the backdrops with a screen blend so the images feel like one sky.
 */
export function Starfield({ animate = true }: { animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let stars: Star[] = []
    let w = 0
    let h = 0
    let raf = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(420, Math.round((w * h) / 3200))
      stars = Array.from({ length: count }, () => {
        const depth = Math.random()
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.35 + depth ** 2.5 * 1.5,
          base: 0.25 + depth * 0.6,
          twinkle: 0.6 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
          depth,
        }
      })
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const scroll = window.scrollY
      for (const s of stars) {
        const y = (((s.y - scroll * (0.02 + s.depth * 0.08)) % h) + h) % h
        const a = animate ? s.base * (0.65 + 0.35 * Math.sin(t * 0.001 * s.twinkle + s.phase)) : s.base
        ctx.globalAlpha = a
        ctx.fillStyle = s.depth > 0.85 ? '#cfe0ff' : '#ffffff'
        ctx.beginPath()
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (animate) raf = requestAnimationFrame(draw)
    }

    resize()
    draw(0)
    const ro = new ResizeObserver(() => {
      resize()
      if (!animate) draw(0)
    })
    ro.observe(canvas)

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (animate && !document.hidden) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [animate])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full mix-blend-screen" aria-hidden />
}
