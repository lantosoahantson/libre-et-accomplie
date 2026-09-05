// Génère les icônes PNG de la PWA (192 et 512 px) sans dépendance externe :
// un carré vert forêt arrondi avec une forme de cocon crème.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})
const crc32 = (buf) => {
  let c = -1
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const png = (size, pixel) => {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size)
      raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}
const FOREST = [63, 107, 79], CREAM = [246, 241, 231], SAGE = [157, 184, 156]
const inRoundedSquare = (u, v, r) => {
  const dx = Math.max(Math.abs(u - 0.5) - (0.5 - r), 0), dy = Math.max(Math.abs(v - 0.5) - (0.5 - r), 0)
  return dx * dx + dy * dy <= r * r
}
const cocoon = (u, v, cx, cy, w, h) => ((u - cx) / w) ** 2 + ((v - cy) / h) ** 2 <= 1
const pixel = (u, v) => {
  if (!inRoundedSquare(u, v, 0.22)) return [0, 0, 0, 0]
  if (cocoon(u, v, 0.5, 0.56, 0.16, 0.2)) return [...SAGE, 255]
  if (cocoon(u, v, 0.5, 0.53, 0.26, 0.32)) return [...CREAM, 255]
  return [...FOREST, 255]
}
mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size, pixel))
console.log('Icônes générées dans public/icons/')
