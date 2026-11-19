let seed = 20080502
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const vary = (amount) => (rnd() - 0.5) * 2 * amount

const ring = (y, r, offset) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = offset + (i / 5) * Math.PI * 2 + vary(0.44)
    const radius = r * (1 + vary(0.4))
    return [Math.cos(a) * radius, y + vary(6.5), Math.sin(a) * radius]
  })

export const positions = [
  [2.5, 1.5, -2],
  [5, 24, -4],
  ...ring(11, 11, 0.2),
  ...ring(-1, 17, Math.PI / 5),
  ...ring(-13, 10, -0.15),
  [-13, -8, -5],
  [10.5, 6, -10.5],
  [-14, 6, -13],
  [-6, -27, 4.5],
]

const CROWN = 2
const GIRDLE = 7
const PAVILION = 12
const TOP = 1
const SHARD_LOW = 17
const SHARD_HIGH = 18
const SHARD_BACK = 19
const BOTTOM = 20

const full = [[0, TOP], [0, BOTTOM], [0, GIRDLE + 1], [0, CROWN + 3], [0, PAVILION + 4]]
for (let i = 0; i < 5; i++) {
  const n = (i + 1) % 5
  const p = (i + 4) % 5
  full.push(
    [TOP, CROWN + i],
    [CROWN + i, CROWN + n],
    [CROWN + i, GIRDLE + i],
    [CROWN + i, GIRDLE + p],
    [GIRDLE + i, GIRDLE + n],
    [GIRDLE + i, PAVILION + i],
    [GIRDLE + i, PAVILION + n],
    [PAVILION + i, PAVILION + n],
    [PAVILION + i, BOTTOM],
  )
}

const HUB = GIRDLE + 2
const MOONS = [
  [4.5, 2.5, 1.5],
  [-3, 4, 2.5],
  [1.5, -4.5, 3],
  [-4.5, -1.5, -2.5],
  [2.5, 3, -4.5],
  [-1, -3.5, -4.5],
]
const FIRST_MOON = positions.length
for (const moon of MOONS) positions.push(positions[HUB].map((v, i) => v + moon[i]))
const BOOK = positions.length
positions.push(positions[TOP].map((v, i) => v + [-4.5, -2, 3.5][i]))

const DESIGN = positions.length
positions.push(positions[GIRDLE].map((v, i) => v + [6, -4, 5][i]))

const SPREAD = 1.5
for (const p of positions) for (let i = 0; i < 3; i++) p[i] *= SPREAD

const degree = positions.map(() => 0)
for (const [a, b] of full) {
  degree[a]++
  degree[b]++
}

export const edges = full
  .filter(([a, b]) => {
    if (rnd() > 0.32 || degree[a] <= 3 || degree[b] <= 3) return true
    degree[a]--
    degree[b]--
    return false
  })
  .concat([
    [SHARD_LOW, GIRDLE + 2],
    [SHARD_LOW, PAVILION + 2],
    [SHARD_LOW, PAVILION + 3],
    [SHARD_HIGH, CROWN + 4],
    [SHARD_HIGH, GIRDLE + 4],
    [SHARD_HIGH, GIRDLE + 3],
    [SHARD_BACK, CROWN + 3],
    [SHARD_BACK, CROWN + 2],
    [SHARD_BACK, GIRDLE + 3],
    ...MOONS.map((_, i) => [HUB, FIRST_MOON + i]),
    [TOP, BOOK],
    [GIRDLE, DESIGN],
    [DESIGN, PAVILION],
  ])
