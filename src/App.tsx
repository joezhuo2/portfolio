import { MotionConfig, useReducedMotion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { ScrollStage } from './components/ScrollStage'
import { StaticPage } from './components/StaticPage'
import { images, projects } from './data/content'
import { startLenis } from './lib/lenis'
import { buildTimeline, defaultSpecs } from './lib/timeline'

if (import.meta.env.DEV && images.length !== projects.length + 2) {
  console.warn(`content.ts: expected ${projects.length + 2} images (hero + one per project + outro), got ${images.length}`)
}

export default function App() {
  const reduced = useReducedMotion()
  const timeline = useMemo(() => buildTimeline(defaultSpecs(projects.length)), [])

  useEffect(() => {
    if (reduced) return
    return startLenis()
  }, [reduced])

  return (
    <MotionConfig reducedMotion="user">
      {reduced ? (
        <StaticPage />
      ) : (
        <main>
          <ScrollStage timeline={timeline} />
        </main>
      )}
    </MotionConfig>
  )
}
