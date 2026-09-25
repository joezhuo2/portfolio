import Lenis from 'lenis'

let instance: Lenis | null = null

/** Smooth wheel scrolling. Skipped entirely under reduced motion. */
export function startLenis(): () => void {
  instance = new Lenis({ autoRaf: true, lerp: 0.06 })
  if (import.meta.env.DEV) Object.assign(window, { __lenis: instance })
  return () => {
    instance?.destroy()
    instance = null
  }
}

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { duration: 2.4 })
  else window.scrollTo({ top: 0 })
}
