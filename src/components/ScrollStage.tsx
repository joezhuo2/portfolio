import { motion, useMotionTemplate, useScroll, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { projects } from '../data/content'
import { at, BEATS, dimKeyframes, find, projectKeyframes, type Segment, type Timeline } from '../lib/timeline'
import { useFade, useScrollValue } from '../lib/useFade'
import { HeroContent, ScrollHint } from './Hero'
import { ImageTrack } from './ImageTrack'
import { OutroContent } from './Outro'
import { ProjectDetails, ProjectIcon } from './ProjectCard'
import { Starfield } from './Starfield'

/**
 * One tall scroll container with a pinned full-screen stage. Every layer
 * reads the container's scroll progress and maps it through the timeline.
 */
export function ScrollStage({ timeline }: { timeline: Timeline }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const dim = dimKeyframes(timeline, 0.1, 0.5)
  const dimOpacity = useScrollValue(scrollYProgress, dim.input, dim.output)

  return (
    <div ref={ref} className="relative" style={{ height: `${timeline.totalLength + 100}svh` }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <ImageTrack progress={scrollYProgress} timeline={timeline} />
        <motion.div className="absolute inset-0 bg-void" style={{ opacity: dimOpacity }} aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_40%,rgb(2_4_12/0.85)_100%)]"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-70">
          <Starfield />
        </div>

        <HeroLayer progress={scrollYProgress} seg={find(timeline, 'hero')} />
        {projects.map((p, i) => (
          <ProjectLayer key={p.name} index={i} progress={scrollYProgress} seg={find(timeline, 'project', i)} />
        ))}
        <OutroLayer progress={scrollYProgress} seg={find(timeline, 'outro')} />

        <ProgressBar progress={scrollYProgress} />
      </div>
    </div>
  )
}

interface LayerProps {
  progress: MotionValue<number>
  seg: Segment
}

function HeroLayer({ progress, seg }: LayerProps) {
  const range = [at(seg, BEATS.heroOut[0]), at(seg, BEATS.heroOut[1])]
  const fade = useFade(progress, range, [1, 0])
  const y = useScrollValue(progress, range, [0, -80])
  const blur = useScrollValue(progress, range, [0, 14])
  const filter = useMotionTemplate`blur(${blur}px)`
  const hintOpacity = useScrollValue(progress, [0, at(seg, 0.2)], [1, 0])

  return (
    <motion.section
      aria-label="Intro"
      className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 lg:px-24"
      style={{ ...fade }}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgb(2_4_12/0.8)_0%,rgb(2_4_12/0.35)_45%,transparent_70%)]"
        aria-hidden
      />
      <motion.div className="relative" style={{ y, filter }}>
        <HeroContent />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-8 flex justify-center" style={{ opacity: hintOpacity }}>
        <ScrollHint />
      </motion.div>
    </motion.section>
  )
}

function ProjectLayer({ progress, seg, index }: LayerProps & { index: number }) {
  const project = projects[index]
  const flip = index % 2 === 1
  const keys = projectKeyframes(seg)
  const fade = useFade(progress, keys, [0, 1, 1, 0])
  const s = flip ? -1 : 1
  const iconX = useScrollValue(progress, keys, [-70 * s, 0, 0, -30 * s])
  const cardX = useScrollValue(progress, keys, [70 * s, 0, 0, 30 * s])
  const y = useScrollValue(progress, keys, [40, 0, 0, -40])
  const scale = useScrollValue(progress, keys, [0.94, 1, 1, 0.97])

  return (
    <motion.section
      aria-label={project.name}
      className="absolute inset-0 flex items-center justify-center overflow-y-auto px-5 py-16 md:px-12"
      style={{ ...fade }}
    >
      <motion.div
        className="grid w-full max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14"
        style={{ y, scale }}
      >
        <motion.div className={flip ? 'md:order-2' : ''} style={{ x: iconX }}>
          <ProjectIcon project={project} />
        </motion.div>
        <motion.div className={flip ? 'md:order-1' : ''} style={{ x: cardX }}>
          <ProjectDetails project={project} index={index} total={projects.length} />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}

function OutroLayer({ progress, seg }: LayerProps) {
  const range = [at(seg, BEATS.outroIn[0]), at(seg, BEATS.outroIn[1])]
  const fade = useFade(progress, range, [0, 1])
  const y = useScrollValue(progress, range, [50, 0])

  return (
    <motion.section
      aria-label="Contact"
      className="absolute inset-0 flex items-center justify-center px-5 py-16"
      style={{ ...fade }}
    >
      <div className="absolute inset-0 bg-void/45" aria-hidden />
      <motion.div className="relative flex w-full justify-center" style={{ y }}>
        <OutroContent />
      </motion.div>
    </motion.section>
  )
}

function ProgressBar({ progress }: { progress: MotionValue<number> }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-[#3b6fff] via-glow to-[#a5c8ff]"
      style={{ scaleX: progress }}
      aria-hidden
    />
  )
}
