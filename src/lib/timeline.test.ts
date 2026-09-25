import { describe, expect, it } from 'vitest'
import { at, buildTimeline, defaultSpecs, dimKeyframes, find, imageWindow, projectKeyframes } from './timeline'

const isNonDecreasing = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1])

describe('timeline', () => {
  const timeline = buildTimeline(defaultSpecs(3))

  it('orders hero, image/project pairs, a final image, then outro', () => {
    expect(timeline.segments.map((s) => s.kind)).toEqual([
      'hero', 'image', 'project', 'image', 'project', 'image', 'project', 'image', 'outro',
    ])
  })

  it('covers 0..1 with contiguous segments', () => {
    const { segments } = timeline
    expect(segments[0].start).toBe(0)
    expect(segments.at(-1)!.end).toBeCloseTo(1)
    segments.slice(1).forEach((s, i) => expect(s.start).toBeCloseTo(segments[i].end))
  })

  it('maps local points to global progress', () => {
    const seg = find(timeline, 'project', 1)
    expect(at(seg, 0)).toBe(seg.start)
    expect(at(seg, 1)).toBeCloseTo(seg.end)
    expect(at(seg, 0.5)).toBeCloseTo((seg.start + seg.end) / 2)
  })

  it('crossfades each image into the next inside the image segment between projects', () => {
    for (let k = 0; k <= 4; k++) {
      const w = imageWindow(timeline, k)
      expect(isNonDecreasing(w.opacity.input)).toBe(true)
      expect(w.pan[0]).toBeLessThan(w.pan[1])
    }
    // the outgoing image holds at full opacity until the incoming one is fully in
    const out1 = imageWindow(timeline, 1).opacity.input.slice(2)
    const in2 = imageWindow(timeline, 2).opacity.input.slice(0, 2)
    expect(out1[1]).toBe(in2[1])
    expect(out1[0]).toBeGreaterThan(in2[0])
    const between = find(timeline, 'image', 1)
    expect(in2[0]).toBeGreaterThanOrEqual(between.start)
    expect(in2[1]).toBeLessThanOrEqual(between.end)
  })

  it('shows the first image behind the hero from the start', () => {
    const first = imageWindow(timeline, 0)
    expect(first.opacity.output).toEqual([1, 0])
    expect(first.pan[0]).toBe(0)
  })

  it('keeps the last image on screen to the end', () => {
    const last = imageWindow(timeline, 4)
    expect(last.opacity.output).toEqual([0, 1])
    expect(last.pan[1]).toBe(1)
  })

  it('fades a project in and out within its own segment', () => {
    const seg = find(timeline, 'project', 0)
    const keys = projectKeyframes(seg)
    expect(isNonDecreasing(keys)).toBe(true)
    expect(keys[0]).toBe(seg.start)
    expect(keys[3]).toBeCloseTo(seg.end)
  })

  it('builds monotonic dim keyframes', () => {
    const { input, output } = dimKeyframes(timeline, 0.2, 0.6)
    expect(input.length).toBe(output.length)
    expect(isNonDecreasing(input)).toBe(true)
  })

  it('throws for a missing segment', () => {
    expect(() => find(timeline, 'project', 9)).toThrow()
  })
})
