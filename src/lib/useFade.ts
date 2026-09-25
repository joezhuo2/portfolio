import { useTransform, type MotionValue } from 'motion/react'

/**
 * Pads a keyframe range out to the full 0..1 scroll so values hold before the
 * first and after the last keyframe. Without this, Motion's accelerated
 * scroll timeline lets opacity drift back to its base value outside the range.
 */
export function fullRange<T>(input: number[], output: T[]): [number[], T[]] {
  const i = [...input]
  const o = [...output]
  if (i[0] > 0) {
    i.unshift(0)
    o.unshift(o[0])
  }
  if (i[i.length - 1] < 1) {
    i.push(1)
    o.push(o[o.length - 1])
  }
  return [i, o]
}

/** useTransform over scroll progress with the range padded to 0..1. */
export function useScrollValue<T extends number | string>(
  progress: MotionValue<number>,
  input: number[],
  output: T[],
  ease?: (t: number) => number,
) {
  const [i, o] = fullRange(input, output)
  return useTransform(progress, i, o, ease ? { ease } : undefined)
}

/**
 * Opacity driven by scroll progress, plus visibility/pointer-events so a
 * faded-out layer can't be clicked or tabbed into.
 */
export function useFade(progress: MotionValue<number>, input: number[], output: number[]) {
  const opacity = useScrollValue(progress, input, output)
  const visibility = useTransform(() => (opacity.get() < 0.02 ? 'hidden' : 'visible'))
  const pointerEvents = useTransform(() => (opacity.get() < 0.6 ? 'none' : 'auto'))
  return { opacity, visibility, pointerEvents }
}
