// Scroll choreography. The whole page is one pinned stage; every layer maps
// its opacity/transform from the page's scroll progress (0..1). Segment
// lengths are in viewport heights and only matter relative to each other.

export type SegmentKind = 'hero' | 'image' | 'project' | 'outro'

export interface SegmentSpec {
  kind: SegmentKind
  length: number
  /** image segments: the image entering; project segments: the project shown */
  index?: number
}

export interface Segment extends SegmentSpec {
  start: number
  end: number
}

export interface Timeline {
  segments: Segment[]
  /** sum of segment lengths, in viewport heights */
  totalLength: number
}

export const LENGTHS = { hero: 1080, image: 1360, project: 1920, outro: 1200 }

/** Local (0..1) points inside a segment where things happen. */
export const BEATS = {
  heroOut: [0.55, 1],
  /** blend between backdrops across the whole stretch between projects */
  crossfade: [0, 1],
  projectIn: [0, 0.15],
  projectOut: [0.85, 1],
  outroIn: [0, 0.3],
} as const

/** hero → image0 → project0 → image1 → project1 → … → imageN → outro */
export function defaultSpecs(projectCount: number, lengths = LENGTHS): SegmentSpec[] {
  const specs: SegmentSpec[] = [{ kind: 'hero', length: lengths.hero }]
  for (let i = 0; i < projectCount; i++) {
    specs.push({ kind: 'image', length: lengths.image, index: i })
    specs.push({ kind: 'project', length: lengths.project, index: i })
  }
  specs.push({ kind: 'image', length: lengths.image, index: projectCount })
  specs.push({ kind: 'outro', length: lengths.outro })
  return specs
}

export function buildTimeline(specs: SegmentSpec[]): Timeline {
  const totalLength = specs.reduce((sum, s) => sum + s.length, 0)
  let cursor = 0
  const segments = specs.map((spec) => {
    const start = cursor / totalLength
    cursor += spec.length
    return { ...spec, start, end: cursor / totalLength }
  })
  return { segments, totalLength }
}

/** Global progress at local point t (0..1) of a segment. */
export function at(seg: Segment, t: number): number {
  return seg.start + (seg.end - seg.start) * t
}

export function find(timeline: Timeline, kind: SegmentKind, index?: number): Segment {
  const seg = timeline.segments.find((s) => s.kind === kind && (index === undefined || s.index === index))
  if (!seg) throw new Error(`No ${kind} segment${index === undefined ? '' : ` #${index}`}`)
  return seg
}

export interface ImageWindow {
  /** opacity keyframes (input progress → output opacity) */
  opacity: { input: number[]; output: number[] }
  /** the span the image pans across while it exists */
  pan: [number, number]
}

/** Width of the hand-off once the incoming image is fully opaque. */
const HANDOFF = 0.0005

/**
 * Image 0 sits behind the hero from the first frame. Image k (k ≥ 1) fades
 * in over the previous image during image segment k - 1. Later images stack
 * on top, so the outgoing image stays fully opaque underneath the whole
 * blend and only drops out once it's covered: no dip to black, no swap.
 * The last image never leaves. Needs image segments + 1 images.
 */
export function imageWindow(timeline: Timeline, k: number): ImageWindow {
  const enter = k === 0 ? undefined : find(timeline, 'image', k - 1)
  const inStart = enter ? at(enter, BEATS.crossfade[0]) : 0
  const inEnd = enter ? at(enter, BEATS.crossfade[1]) : 0

  const exit = timeline.segments.find((s) => s.kind === 'image' && s.index === k)
  if (!exit) {
    return { opacity: { input: [inStart, inEnd], output: [enter ? 0 : 1, 1] }, pan: [inStart, 1] }
  }
  const outEnd = at(exit, BEATS.crossfade[1])
  const outStart = outEnd - HANDOFF
  if (!enter) {
    return { opacity: { input: [outStart, outEnd], output: [1, 0] }, pan: [0, outEnd] }
  }
  return {
    opacity: { input: [inStart, inEnd, outStart, outEnd], output: [0, 1, 1, 0] },
    pan: [inStart, outEnd],
  }
}

/** Fade-in / hold / fade-out keyframes for a project panel. */
export function projectKeyframes(seg: Segment): number[] {
  return [
    at(seg, BEATS.projectIn[0]),
    at(seg, BEATS.projectIn[1]),
    at(seg, BEATS.projectOut[0]),
    at(seg, BEATS.projectOut[1]),
  ]
}

/**
 * Darkening over the images: light while you're "flying through" an image,
 * heavier behind a project card so the glass stays readable.
 */
export function dimKeyframes(timeline: Timeline, light: number, heavy: number) {
  const input: number[] = [0]
  const output: number[] = [light]
  for (const seg of timeline.segments.filter((s) => s.kind === 'project')) {
    input.push(seg.start, at(seg, 0.2), at(seg, 0.8), seg.end)
    output.push(light, heavy, heavy, light)
  }
  input.push(1)
  output.push(light)
  return { input, output }
}

/** Smootherstep: zero velocity and acceleration at both ends, so blends start and settle imperceptibly. */
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
