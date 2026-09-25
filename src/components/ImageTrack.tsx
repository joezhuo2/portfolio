import { motion, useTransform, type MotionValue } from 'motion/react'
import { images } from '../data/content'
import { imageWindow, smootherstep, type Timeline } from '../lib/timeline'
import { useScrollValue } from '../lib/useFade'

interface Props {
  progress: MotionValue<number>
  timeline: Timeline
}

/** The backdrops: each one slowly zooms and drifts while it's on screen. */
export function ImageTrack({ progress, timeline }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {images.map((img, k) => (
        <Backdrop key={img.src} src={img.src} k={k} progress={progress} timeline={timeline} />
      ))}
    </div>
  )
}

function Backdrop({ src, k, progress, timeline }: { src: string; k: number } & Props) {
  const { opacity: o, pan } = imageWindow(timeline, k)
  const opacity = useScrollValue(progress, o.input, o.output, smootherstep)
  // Flying forward: push in and drift, alternating direction per image.
  const dir = k % 2 === 0 ? 1 : -1
  const scale = useScrollValue(progress, pan, [1.06, 1.28])
  const x = useScrollValue(progress, pan, [`${-2 * dir}%`, `${2 * dir}%`])
  const y = useScrollValue(progress, pan, ['2%', '-3%'])
  const visibility = useTransform(() => (opacity.get() < 0.005 ? 'hidden' : 'visible'))

  return (
    <motion.img
      src={src}
      alt=""
      decoding="async"
      loading={k < 2 ? 'eager' : 'lazy'}
      className="absolute inset-0 size-full object-cover will-change-transform"
      style={{ opacity, scale, x, y, visibility }}
    />
  )
}
