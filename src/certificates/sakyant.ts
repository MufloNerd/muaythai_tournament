/**
 * Sak Yant style line art (tiger, Erawan, unalom, Khom-like script) and Muay Thai ornaments,
 * drawn as vectors so certificates stay sharp at any resolution. Artwork is original.
 */

type Ctx = CanvasRenderingContext2D
export type Rng = () => number

export const INK = '#2b1a0c'

export function seededRng(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Strokes (or fills) SVG paths drawn for the left half, mirrored onto the right half. */
function mirrored(ctx: Ctx, paths: string[], mode: 'stroke' | 'fill', mirror = true) {
  for (const d of paths) {
    const p = new Path2D(d)
    if (mode === 'stroke') ctx.stroke(p)
    else ctx.fill(p)
    if (mirror) {
      ctx.save()
      ctx.scale(-1, 1)
      if (mode === 'stroke') ctx.stroke(p)
      else ctx.fill(p)
      ctx.restore()
    }
  }
}

function inkStyle(ctx: Ctx, width: number, color = INK) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// ---------------------------------------------------------------------------------------------
// Tiger (Suea) — frontal head, art box about 400 × 360 units centred on (0, 0)

const TIGER_LINES = [
  'M 0 -128 C -40 -130 -78 -124 -100 -108 C -122 -96 -138 -78 -150 -52 L -176 -40 L -160 -22 L -190 -6 L -164 8 L -186 28 L -156 36 L -170 60 L -138 64 C -128 96 -96 124 -60 140 C -36 150 -16 154 0 154',
  'M -100 -108 C -112 -148 -136 -176 -160 -172 C -172 -150 -166 -112 -150 -80',
  'M -112 -118 C -124 -140 -138 -152 -148 -150 C -153 -132 -151 -112 -142 -96',
  'M -98 -62 C -74 -86 -42 -84 -16 -66',
  'M -88 -40 C -72 -60 -42 -62 -22 -46 C -40 -34 -66 -30 -88 -40 Z',
  'M -16 -44 C -20 -22 -26 -8 -32 4',
  'M 0 24 C -14 24 -30 18 -34 6 C -30 -4 -16 -6 0 -6',
  'M 0 24 L 0 40',
  'M 0 40 C -12 52 -30 56 -50 48',
  'M -50 48 C -52 78 -30 102 0 106',
  'M -52 30 C -92 18 -124 20 -156 30',
  'M -54 42 C -94 42 -126 48 -154 60',
  'M -60 140 L -44 126 L -34 146 L -20 132 L -8 152',
]

const TIGER_FILLS = [
  'M -36 54 L -30 88 L -22 58 Z',
  'M -22 104 L -17 84 L -11 105 Z',
  'M -30 -124 C -24 -108 -38 -98 -30 -80 C -26 -96 -18 -106 -24 -124 Z',
  'M -62 -118 C -54 -106 -64 -96 -56 -84 C -52 -96 -48 -106 -54 -116 Z',
  'M -150 -52 C -126 -50 -110 -38 -102 -24 C -118 -32 -134 -36 -156 -36 Z',
  'M -164 14 C -136 12 -116 22 -104 36 C -122 32 -142 30 -160 32 Z',
  'M -132 82 C -110 78 -94 86 -84 100 C -100 94 -116 94 -128 98 Z',
  'M -90 -98 C -86 -86 -94 -78 -88 -68 C -82 -78 -80 -90 -84 -100 Z',
  'M -120 -40 C -108 -30 -106 -14 -112 0 C -100 -12 -100 -28 -112 -40 Z',
]

export function drawTiger(ctx: Ctx, cx: number, cy: number, size: number, ink = INK) {
  const k = size / 400
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  inkStyle(ctx, 6, ink)
  mirrored(ctx, TIGER_LINES, 'stroke')
  mirrored(ctx, TIGER_FILLS, 'fill')
  ctx.lineWidth = 9
  ctx.stroke(new Path2D('M 0 -124 C 7 -108 -7 -94 0 -76'))
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * 54, -46, 6, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    for (const [x, y] of [
      [26, 30],
      [36, 37],
      [28, 44],
    ]) {
      ctx.beginPath()
      ctx.arc(side * x, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// ---------------------------------------------------------------------------------------------
// Erawan — three-headed elephant with chada crowns

const HEAD_LINES = [
  'M 0 -76 C -34 -78 -58 -66 -62 -40 C -64 -14 -56 8 -38 22 C -30 28 -22 30 -16 26',
  'M -42 -34 C -34 -42 -22 -42 -16 -34 C -24 -28 -34 -28 -42 -34 Z',
  'M -52 -50 C -38 -60 -20 -60 -8 -54',
  'M -32 24 C -44 44 -50 70 -40 94 C -36 76 -30 54 -22 34',
  'M -50 -72 C -70 -82 -78 -104 -62 -118 C -64 -100 -56 -92 -44 -88',
]
const EAR_LINES = [
  'M -60 -50 C -112 -86 -156 -62 -156 -10 C -156 42 -114 72 -72 52 C -64 38 -58 24 -52 12',
  'M -68 -38 C -102 -58 -132 -40 -132 -8 C -132 22 -106 42 -80 36',
  'M -86 -26 C -106 -30 -118 -16 -116 0 C -114 16 -100 24 -88 22',
]
const CROWN_LINES = [
  'M -50 -72 C -30 -82 30 -82 50 -72 L 46 -88 C 28 -96 -28 -96 -46 -88 Z',
  'M -38 -94 L -30 -124 L 30 -124 L 38 -94',
  'M -26 -124 L -19 -152 L 19 -152 L 26 -124',
  'M -15 -152 L -9 -176 L 9 -176 L 15 -152',
  'M -9 -176 C -7 -196 -3 -214 0 -238 C 3 -214 7 -196 9 -176',
]
const TRUNK_LINES = [
  'M -16 26 C -18 60 -20 96 -14 128 C -10 150 -20 168 -40 168 C -58 168 -64 150 -52 142 C -44 138 -36 144 -38 152',
  'M 16 26 C 18 62 18 100 12 132 C 6 168 -18 188 -44 186 C -78 184 -86 146 -62 132',
]
const HEAD_SILHOUETTE = [
  'M 0 -76 C -34 -78 -58 -66 -62 -40 C -64 -14 -56 8 -38 22 L 38 22 C 56 8 64 -14 62 -40 C 58 -66 34 -78 0 -76 Z',
  'M -60 -50 C -112 -86 -156 -62 -156 -10 C -156 42 -114 72 -72 52 C -64 38 -58 24 -52 12 Z',
  'M 60 -50 C 112 -86 156 -62 156 -10 C 156 42 114 72 72 52 C 64 38 58 24 52 12 Z',
  'M -50 -72 L -46 -88 L -38 -94 L -30 -124 L -19 -152 L -9 -176 C -7 -196 -3 -214 0 -238 C 3 -214 7 -196 9 -176 L 19 -152 L 30 -124 L 38 -94 L 46 -88 L 50 -72 Z',
  'M -16 26 C -18 60 -20 96 -14 128 C -10 150 -20 168 -40 168 L -62 132 C -86 146 -78 184 -44 186 C -18 188 6 168 12 132 C 18 100 18 62 16 26 Z',
]

function elephantHead(ctx: Ctx, x: number, y: number, s: number, paper: string, ink: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = paper
  for (const d of HEAD_SILHOUETTE) ctx.fill(new Path2D(d))
  inkStyle(ctx, 6, ink)
  mirrored(ctx, EAR_LINES, 'stroke')
  mirrored(ctx, HEAD_LINES, 'stroke')
  mirrored(ctx, CROWN_LINES, 'stroke', false)
  mirrored(ctx, TRUNK_LINES, 'stroke', false)
  ctx.lineWidth = 4
  for (const [yy, w] of [
    [44, 17],
    [66, 18],
    [88, 18],
    [110, 16],
  ]) {
    ctx.beginPath()
    ctx.moveTo(-w, yy)
    ctx.quadraticCurveTo(0, yy + 7, w, yy)
    ctx.stroke()
  }
  ctx.fillStyle = ink
  ctx.fill(new Path2D('M 0 -68 L 10 -56 L 0 -44 L -10 -56 Z'))
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(side * 29, -35, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  for (const [yy, n, w] of [
    [-108, 5, 26],
    [-138, 4, 16],
    [-164, 3, 8],
  ]) {
    for (let i = 0; i < n; i++) {
      ctx.beginPath()
      ctx.arc(-w + (2 * w * i) / (n - 1), yy, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

export function drawErawan(ctx: Ctx, cx: number, cy: number, size: number, paper: string, ink = INK) {
  const k = size / 520
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  // Lotus pedestal
  inkStyle(ctx, 5, ink)
  ctx.beginPath()
  ctx.moveTo(-230, 228)
  ctx.lineTo(230, 228)
  ctx.stroke()
  for (let i = -5; i <= 5; i++) {
    const x = i * 42
    ctx.beginPath()
    ctx.moveTo(x - 20, 228)
    ctx.quadraticCurveTo(x - 18, 196, x, 186)
    ctx.quadraticCurveTo(x + 18, 196, x + 20, 228)
    ctx.stroke()
  }
  elephantHead(ctx, -150, 48, 0.74, paper, ink)
  elephantHead(ctx, 150, 48, 0.74, paper, ink)
  elephantHead(ctx, 0, 0, 1, paper, ink)
  ctx.restore()
}

// ---------------------------------------------------------------------------------------------
// Khom-like decorative script

function glyph(ctx: Ctx, x: number, y: number, s: number, rng: Rng): number {
  const r = s * 0.12
  const variant = Math.floor(rng() * 6)
  const w = s * (0.5 + rng() * 0.15)
  ctx.beginPath()
  ctx.arc(x + r, y - s * 0.3, r, 0, Math.PI * 2)
  ctx.moveTo(x + 2 * r, y - s * 0.3)
  switch (variant) {
    case 0:
      ctx.lineTo(x + 2 * r, y + s * 0.3)
      ctx.quadraticCurveTo(x + w, y + s * 0.42, x + w, y - s * 0.1)
      break
    case 1:
      ctx.quadraticCurveTo(x + 2 * r, y + s * 0.4, x + w * 0.6, y + s * 0.38)
      ctx.quadraticCurveTo(x + w, y + s * 0.36, x + w, y - s * 0.4)
      break
    case 2:
      ctx.lineTo(x + 2 * r, y + s * 0.38)
      ctx.moveTo(x + 2 * r, y - s * 0.05)
      ctx.quadraticCurveTo(x + w * 0.7, y - s * 0.5, x + w, y - s * 0.05)
      ctx.lineTo(x + w, y + s * 0.38)
      break
    case 3:
      ctx.quadraticCurveTo(x + w, y - s * 0.45, x + w * 0.55, y)
      ctx.quadraticCurveTo(x, y + s * 0.45, x + w, y + s * 0.35)
      break
    case 4:
      ctx.quadraticCurveTo(x, y + s * 0.4, x + w * 0.5, y + s * 0.38)
      ctx.quadraticCurveTo(x + w, y + s * 0.3, x + w * 0.8, y - s * 0.2)
      ctx.quadraticCurveTo(x + w * 0.65, y - s * 0.45, x + w, y - s * 0.5)
      break
    default:
      ctx.lineTo(x + w * 0.5, y + s * 0.38)
      ctx.lineTo(x + w, y - s * 0.38)
      break
  }
  ctx.stroke()
  if (rng() < 0.25) {
    ctx.beginPath()
    ctx.arc(x + w * 0.6, y - s * 0.62, r * 0.7, 0, Math.PI * 2)
    ctx.stroke()
  }
  return w + s * 0.2
}

export function scriptLine(ctx: Ctx, x0: number, y: number, width: number, s: number, rng: Rng, ink = INK) {
  inkStyle(ctx, Math.max(2, s * 0.09), ink)
  let x = x0
  while (x < x0 + width - s * 0.7) x += glyph(ctx, x, y, s, rng)
}

export function scriptArc(
  ctx: Ctx,
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
  s: number,
  rng: Rng,
  ink = INK,
) {
  inkStyle(ctx, Math.max(2, s * 0.09), ink)
  let a = from
  while (a < to) {
    ctx.save()
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a))
    ctx.rotate(a + Math.PI / 2)
    const advance = glyph(ctx, 0, 0, s, rng)
    ctx.restore()
    a += advance / radius
  }
}

// ---------------------------------------------------------------------------------------------
// Unalom (spiral, waves, line, dots)

export function drawUnalom(ctx: Ctx, x: number, yBottom: number, height: number, ink = INK) {
  const u = height / 200
  inkStyle(ctx, Math.max(3, 5 * u), ink)
  ctx.beginPath()
  const sx = x
  const sy = yBottom - 26 * u
  for (let t = 0; t <= Math.PI * 5; t += 0.08) {
    const r = (3 + t * 1.45) * u
    const px = sx + r * Math.cos(t + Math.PI / 2)
    const py = sy + r * Math.sin(t + Math.PI / 2)
    if (t === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sx, sy - 24 * u)
  let y = sy - 24 * u
  for (let i = 0; i < 3; i++) {
    const dir = i % 2 === 0 ? 1 : -1
    ctx.bezierCurveTo(sx + dir * 22 * u, y - 8 * u, sx + dir * 22 * u, y - 22 * u, sx, y - 26 * u)
    y -= 26 * u
  }
  ctx.lineTo(sx, yBottom - 175 * u)
  ctx.stroke()
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(sx, yBottom - (182 + i * 9) * u, 3 * u, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------------------------
// Corner flourish (stylised kranok curl)

export function cornerFlourish(ctx: Ctx, x: number, y: number, size: number, rot: number, ink = INK) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const k = size / 100
  ctx.scale(k, k)
  inkStyle(ctx, 4, ink)
  ctx.stroke(new Path2D('M 0 110 L 0 22 Q 0 0 22 0 L 110 0'))
  ctx.stroke(new Path2D('M 110 0 C 132 0 140 20 128 32 C 118 42 102 32 110 22'))
  ctx.stroke(new Path2D('M 0 110 C 0 132 20 140 32 128 C 42 118 32 102 22 110'))
  ctx.stroke(new Path2D('M 14 40 L 14 14 L 40 14'))
  ctx.fill(new Path2D('M 20 20 C 40 24 52 36 56 56 C 36 52 24 40 20 20 Z'))
  for (const [px, py] of [
    [70, 16],
    [16, 70],
    [86, 16],
    [16, 86],
  ]) {
    ctx.beginPath()
    ctx.arc(px, py, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ---------------------------------------------------------------------------------------------
// Mongkhon (sacred Muay Thai headband), braided ring with tail

export function drawMongkhon(ctx: Ctx, cx: number, cy: number, radius: number, ink = INK) {
  const strand = (phase: number, onTopOnly: boolean, color: string, width: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    const k = 16
    const w = radius * 0.075
    let drawing = false
    ctx.beginPath()
    for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.01) {
      const wave = Math.sin(k * t + phase)
      const visible = !onTopOnly || Math.cos(k * t + phase) > 0
      const r = radius + w * wave
      const px = cx + r * Math.cos(t)
      const py = cy + r * Math.sin(t)
      if (visible && !drawing) {
        ctx.moveTo(px, py)
        drawing = true
      } else if (visible) {
        ctx.lineTo(px, py)
      } else {
        drawing = false
      }
    }
    ctx.stroke()
  }
  const sw = radius * 0.11
  // Tail (wrapped cloth) behind the ring, hanging down to the lower right.
  const a = Math.PI * 0.3
  const bx = cx + radius * Math.cos(a)
  const by = cy + radius * Math.sin(a)
  const len = radius * 0.9
  const dir = Math.PI * 0.32
  const ex = bx + len * Math.cos(dir)
  const ey = by + len * Math.sin(dir)
  const nx = -Math.sin(dir)
  const ny = Math.cos(dir)
  const w0 = sw * 1.1
  const w1 = sw * 0.55
  const tail = new Path2D()
  tail.moveTo(bx + nx * w0, by + ny * w0)
  tail.lineTo(ex + nx * w1, ey + ny * w1)
  tail.quadraticCurveTo(ex + Math.cos(dir) * w1 * 2, ey + Math.sin(dir) * w1 * 2, ex - nx * w1, ey - ny * w1)
  tail.lineTo(bx - nx * w0, by - ny * w0)
  tail.closePath()
  ctx.fillStyle = '#9b1c1c'
  ctx.fill(tail)
  inkStyle(ctx, 4, ink)
  ctx.stroke(tail)
  ctx.strokeStyle = '#efe2c0'
  ctx.lineWidth = sw * 0.28
  for (const f of [0.3, 0.5, 0.7, 0.88]) {
    const px = bx + (ex - bx) * f
    const py = by + (ey - by) * f
    const w = w0 + (w1 - w0) * f
    ctx.beginPath()
    ctx.moveTo(px + nx * w * 0.9, py + ny * w * 0.9)
    ctx.lineTo(px - nx * w * 0.9 + Math.cos(dir) * w * 0.5, py - ny * w * 0.9 + Math.sin(dir) * w * 0.5)
    ctx.stroke()
  }

  strand(0, false, ink, sw * 1.35)
  strand(Math.PI, false, ink, sw * 1.35)
  strand(0, false, '#9b1c1c', sw)
  strand(Math.PI, false, '#efe2c0', sw)
  strand(0, true, ink, sw * 1.35)
  strand(0, true, '#9b1c1c', sw)
}
