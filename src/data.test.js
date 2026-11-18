import test from 'node:test'
import assert from 'node:assert/strict'
import { stars } from './data.js'
import { positions, edges } from './lattice.js'

test('every star has a lattice slot and complete content', () => {
  assert.deepEqual(
    stars.map((s) => s.slot).sort((a, b) => a - b),
    positions.map((_, i) => i),
  )
  assert.equal(new Set(stars.map((s) => s.id)).size, stars.length)
  for (const s of stars) {
    assert.ok(s.title && s.kind && s.tagline && s.body.length, s.id)
    assert.ok([0, 1, 2, 3, 4].includes(s.size), s.id)
    for (const l of s.links) assert.match(l.href, /^(https:\/\/|mailto:)/, s.id)
  }
})

test('lattice edges connect existing, distinct stars and reach all of them', () => {
  const seen = new Set()
  for (const [a, b] of edges) {
    assert.notEqual(a, b)
    assert.ok(positions[a] && positions[b])
    seen.add(a).add(b)
  }
  assert.equal(seen.size, positions.length)
})
