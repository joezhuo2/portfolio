// Converts the source renders in art/ (Higgsfield z_image, 2048x1152 PNG)
// into the WebP backdrops served from public/images.
import { mkdirSync, readdirSync } from 'node:fs'
import sharp from 'sharp'

mkdirSync('public/images', { recursive: true })
for (const file of readdirSync('art').filter((f) => f.endsWith('.png'))) {
  const out = `public/images/${file.replace(/\.png$/, '.webp')}`
  await sharp(`art/${file}`).webp({ quality: 82 }).toFile(out)
  console.log('wrote', out)
}
