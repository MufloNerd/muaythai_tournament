/**
 * Sak Yant style line art (Suea Koo twin tigers, Erawan elephant, unalom, Khom-like script) and
 * Muay Thai ornaments,
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

function inkStyle(ctx: Ctx, width: number, color = INK) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// ---------------------------------------------------------------------------------------------
// Geometry helpers: cubic segments sampled into "tubes" (body, legs, tail, trunk)

type Pt = { x: number; y: number }
/** Cubic Bézier: x0 y0, x1 y1, x2 y2, x3 y3 */
type Seg = [number, number, number, number, number, number, number, number]

function sampleSegs(segs: Seg[], perSeg = 28): Pt[] {
  const out: Pt[] = []
  segs.forEach((s, si) => {
    for (let i = si === 0 ? 0 : 1; i <= perSeg; i++) {
      const t = i / perSeg
      const u = 1 - t
      const a = u * u * u
      const b = 3 * u * u * t
      const c = 3 * u * t * t
      const d = t * t * t
      out.push({ x: a * s[0] + b * s[2] + c * s[4] + d * s[6], y: a * s[1] + b * s[3] + c * s[5] + d * s[7] })
    }
  })
  return out
}

interface Tube {
  pts: Pt[]
  tan: Pt[]
  nrm: Pt[]
  w: number[]
}

function makeTube(segs: Seg[], width: (t: number) => number): Tube {
  const pts = sampleSegs(segs)
  const n = pts.length
  const tan: Pt[] = []
  const nrm: Pt[] = []
  const w: number[] = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l = Math.hypot(dx, dy) || 1
    tan.push({ x: dx / l, y: dy / l })
    nrm.push({ x: -dy / l, y: dx / l })
    w.push(width(i / (n - 1)))
  }
  return { pts, tan, nrm, w }
}

function tubePath(tb: Tube): Path2D {
  const { pts, tan, nrm, w } = tb
  const n = pts.length
  const side = (i: number, s: number) => ({ x: pts[i].x + (s * nrm[i].x * w[i]) / 2, y: pts[i].y + (s * nrm[i].y * w[i]) / 2 })
  const p = new Path2D()
  const l0 = side(0, 1)
  p.moveTo(l0.x, l0.y)
  for (let i = 1; i < n; i++) {
    const q = side(i, 1)
    p.lineTo(q.x, q.y)
  }
  const e = n - 1
  const re = side(e, -1)
  p.quadraticCurveTo(pts[e].x + tan[e].x * w[e] * 0.8, pts[e].y + tan[e].y * w[e] * 0.8, re.x, re.y)
  for (let i = e - 1; i >= 0; i--) {
    const q = side(i, -1)
    p.lineTo(q.x, q.y)
  }
  p.quadraticCurveTo(pts[0].x - tan[0].x * w[0] * 0.8, pts[0].y - tan[0].y * w[0] * 0.8, l0.x, l0.y)
  p.closePath()
  return p
}

/** Flame-shaped tiger stripes entering the tube from its edges (call inside a clip). */
function tubeStripes(
  ctx: Ctx,
  tb: Tube,
  count: number,
  rng: Rng,
  o: { from?: number; to?: number; depth?: [number, number]; thick?: number; rings?: boolean } = {},
) {
  const { from = 0.05, to = 0.95, depth = [0.3, 0.62], thick = 0.17, rings = false } = o
  const n = tb.pts.length
  for (let k = 0; k < count; k++) {
    for (const s of [1, -1]) {
      const t = from + ((to - from) * (k + (rings ? 0.5 : s === 1 ? 0.25 : 0.75))) / count
      const i = Math.round(t * (n - 1))
      const p = tb.pts[i]
      const nv = tb.nrm[i]
      const tv = tb.tan[i]
      const wi = tb.w[i]
      const d = wi * (depth[0] + rng() * (depth[1] - depth[0]))
      const th = wi * thick * (0.7 + rng() * 0.6)
      const bend = (rng() - 0.3) * th
      const ex = p.x + nv.x * s * wi * 0.62
      const ey = p.y + nv.y * s * wi * 0.62
      const tx = p.x + nv.x * s * (wi / 2 - d) + tv.x * bend
      const ty = p.y + nv.y * s * (wi / 2 - d) + tv.y * bend
      const ax = ex - (tv.x * th) / 2
      const ay = ey - (tv.y * th) / 2
      const bx = ex + (tv.x * th) / 2
      const by = ey + (tv.y * th) / 2
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.quadraticCurveTo((ax + tx) / 2 + tv.x * th * 0.3, (ay + ty) / 2 + tv.y * th * 0.3, tx, ty)
      ctx.quadraticCurveTo((bx + tx) / 2 + tv.x * th * 0.3, (by + ty) / 2 + tv.y * th * 0.3, bx, by)
      ctx.closePath()
      ctx.fill()
    }
  }
}

function drawTube(ctx: Ctx, tb: Tube, paper: string, ink: string, lw: number, inside?: () => void) {
  const path = tubePath(tb)
  ctx.fillStyle = paper
  ctx.fill(path)
  if (inside) {
    ctx.save()
    ctx.clip(path)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    inside()
    ctx.restore()
  }
  ctx.strokeStyle = ink
  ctx.lineWidth = lw
  ctx.stroke(path)
}

/** Runs `draw` for the left half and again mirrored for the right half. */
function bothSides(ctx: Ctx, draw: () => void) {
  for (const s of [1, -1]) {
    ctx.save()
    ctx.scale(s, 1)
    draw()
    ctx.restore()
  }
}

// ---------------------------------------------------------------------------------------------
// Suea Koo — twin tigers facing each other (left tiger drawn, right one mirrored).
// Art box about 460 × 660 units centred on (0, 0).

function paw(ctx: Ctx, x: number, y: number, r: number, rot: number, paper: string, ink: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2)
  ctx.fillStyle = paper
  ctx.fill()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = ink
  ctx.stroke()
  ctx.lineWidth = 2.5
  for (const yy of [-0.36, 0, 0.36]) {
    ctx.beginPath()
    ctx.moveTo(r * 0.35, yy * r)
    ctx.lineTo(r * 0.92, yy * r * 1.1)
    ctx.stroke()
  }
  ctx.fillStyle = ink
  for (const yy of [-0.56, -0.19, 0.19, 0.56]) {
    ctx.beginPath()
    ctx.moveTo(r * 0.88, yy * r - r * 0.1)
    ctx.quadraticCurveTo(r * 1.35, yy * r, r * 1.42, yy * r + r * 0.18)
    ctx.quadraticCurveTo(r * 1.2, yy * r + r * 0.05, r * 0.88, yy * r + r * 0.1)
    ctx.fill()
  }
  ctx.restore()
}

/** Snarling tiger head, mouth pointing to local +y. */
function tigerHead(ctx: Ctx, paper: string, ink: string) {
  const ears = [
    'M -44 -36 C -58 -60 -46 -78 -24 -64 Z',
    'M 44 -36 C 58 -60 46 -78 24 -64 Z',
  ]
  ctx.lineWidth = 3.5
  for (const d of ears) {
    const p = new Path2D(d)
    ctx.fillStyle = paper
    ctx.fill(p)
    ctx.strokeStyle = ink
    ctx.stroke(p)
  }
  ctx.fillStyle = ink
  ctx.fill(new Path2D('M -40 -42 C -48 -56 -42 -66 -30 -60 Z'))
  ctx.fill(new Path2D('M 40 -42 C 48 -56 42 -66 30 -60 Z'))

  const skull = new Path2D(
    'M -40 -32 C -44 -56 -20 -64 0 -62 C 20 -64 44 -56 40 -32 L 54 -14 L 44 -4 L 56 8 L 42 14 L 48 26 L 34 28 ' +
      'C 28 46 14 56 0 58 C -14 56 -28 46 -34 28 L -48 26 L -42 14 L -56 8 L -44 -4 L -54 -14 Z',
  )
  ctx.fillStyle = paper
  ctx.fill(skull)
  ctx.save()
  ctx.clip(skull)
  ctx.fillStyle = ink
  const stripes = [
    'M -7 -66 L 7 -66 L 0 -40 Z',
    'M -24 -64 L -14 -64 L -12 -42 Z',
    'M 24 -64 L 14 -64 L 12 -42 Z',
    'M -40 -48 L -30 -56 L -24 -38 Z',
    'M 40 -48 L 30 -56 L 24 -38 Z',
    'M -60 -10 L -58 0 L -36 -2 Z',
    'M 60 -10 L 58 0 L 36 -2 Z',
    'M -60 12 L -56 22 L -36 16 Z',
    'M 60 12 L 56 22 L 36 16 Z',
    'M -40 34 L -34 44 L -24 32 Z',
    'M 40 34 L 34 44 L 24 32 Z',
  ]
  for (const d of stripes) ctx.fill(new Path2D(d))
  ctx.restore()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = ink
  ctx.stroke(skull)

  ctx.lineWidth = 3
  for (const s of [1, -1]) {
    const eye = new Path2D(`M ${s * 32} -24 C ${s * 26} -34 ${s * 12} -32 ${s * 6} -20 C ${s * 14} -14 ${s * 26} -15 ${s * 32} -24 Z`)
    ctx.fillStyle = paper
    ctx.fill(eye)
    ctx.stroke(eye)
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.ellipse(s * 18, -22, 2.4, 5.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(s * 36, -30)
    ctx.quadraticCurveTo(s * 22, -42, s * 4, -30)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 6, -14)
    ctx.quadraticCurveTo(s * 9, -2, s * 10, 4)
    ctx.stroke()
  }
  ctx.fillStyle = ink
  ctx.fill(new Path2D('M -11 4 L 11 4 L 0 15 Z'))
  ctx.fill(new Path2D('M -22 24 C -14 19 -6 21 0 23 C 6 21 14 19 22 24 C 18 42 9 50 0 50 C -9 50 -18 42 -22 24 Z'))
  ctx.fillStyle = paper
  for (const s of [1, -1]) {
    ctx.fill(new Path2D(`M ${s * 16} 24 L ${s * 11} 37 L ${s * 7} 23 Z`))
    ctx.fill(new Path2D(`M ${s * 10} 49 L ${s * 7} 40 L ${s * 4} 49 Z`))
  }
  ctx.fillStyle = ink
  for (const s of [1, -1]) {
    for (const [x, y] of [
      [14, 12],
      [21, 10],
      [18, 17],
      [25, 16],
    ]) {
      ctx.beginPath()
      ctx.arc(s * x, y, 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function tiger(ctx: Ctx, paper: string, ink: string) {
  const rng = seededRng(31)
  const lw = 3.5

  const tail = makeTube(
    [
      [-100, -150, -112, -215, -172, -212, -166, -262],
      [-166, -262, -160, -304, -108, -310, -110, -276],
    ],
    (t) => 26 - 14 * t,
  )
  drawTube(ctx, tail, paper, ink, lw, () =>
    tubeStripes(ctx, tail, 11, rng, { rings: true, depth: [0.5, 0.62], thick: 0.4, from: 0.04, to: 0.98 }),
  )

  const limb = (segs: Seg[], w0: number, w1: number, pawAt: [number, number, number], stripes = 5) => {
    const tb = makeTube(segs, (t) => w0 + (w1 - w0) * t)
    drawTube(ctx, tb, paper, ink, lw, () =>
      tubeStripes(ctx, tb, stripes, rng, { depth: [0.42, 0.7], thick: 0.26, from: 0.08, to: 0.86 }),
    )
    paw(ctx, pawAt[0], pawAt[1], 19, pawAt[2], paper, ink)
  }
  // hind legs (outer, inner): thigh out, then bent back up
  limb(
    [[-118, -118, -150, -128, -176, -148, -172, -186]],
    52,
    28,
    [-170, -202, -Math.PI * 0.45],
  )
  limb([[-80, -120, -52, -150, -40, -176, -46, -204]], 46, 26, [-48, -220, -Math.PI * 0.58])
  // outer front leg: elbow out, paw forward/down
  limb(
    [
      [-98, 140, -146, 118, -186, 136, -182, 182],
      [-182, 182, -180, 196, -178, 206, -176, 214],
    ],
    52,
    28,
    [-174, 230, Math.PI * 0.48],
  )

  const body = makeTube([[-70, 150, -136, 64, -40, -40, -100, -146]], (t) => 60 + 12 * Math.cos(2 * Math.PI * t) - 4 * t)
  drawTube(ctx, body, paper, ink, lw, () => {
    tubeStripes(ctx, body, 17, rng, { depth: [0.34, 0.74], thick: 0.2, from: 0.03, to: 0.99 })
    // spine marks
    for (let i = 3; i < body.pts.length - 3; i += 6) {
      const p = body.pts[i]
      const tv = body.tan[i]
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, 2.2, 6, Math.atan2(tv.y, tv.x) + Math.PI / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // inner front leg, in front of the body
  limb([[-42, 160, -22, 196, -12, 226, -18, 256]], 44, 26, [-20, 270, Math.PI * 0.55])

  ctx.save()
  ctx.translate(-64, 206)
  ctx.rotate(-0.42)
  ctx.scale(1.02, 1.02)
  tigerHead(ctx, paper, ink)
  ctx.restore()
}

function smallYant(ctx: Ctx, cx: number, cy: number, s: number, ink: string, paper: string) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(Math.PI / 4)
  ctx.fillStyle = paper
  ctx.fillRect(-s / 2, -s / 2, s, s)
  inkStyle(ctx, 3, ink)
  ctx.strokeRect(-s / 2, -s / 2, s, s)
  ctx.strokeRect(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72)
  ctx.lineWidth = 2
  for (const f of [-1 / 6, 1 / 6]) {
    ctx.beginPath()
    ctx.moveTo(f * s * 0.72 * 1.5, -s * 0.36)
    ctx.lineTo(f * s * 0.72 * 1.5, s * 0.36)
    ctx.moveTo(-s * 0.36, f * s * 0.72 * 1.5)
    ctx.lineTo(s * 0.36, f * s * 0.72 * 1.5)
    ctx.stroke()
  }
  for (const gx of [-1, 0, 1]) {
    for (const gy of [-1, 0, 1]) {
      ctx.beginPath()
      ctx.arc(gx * s * 0.24, gy * s * 0.24, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const r = s * 0.78
    ctx.beginPath()
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 4, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function scriptColumn(ctx: Ctx, x: number, yTop: number, yBottom: number, s: number, rng: Rng, ink: string) {
  inkStyle(ctx, Math.max(2, s * 0.1), ink)
  for (let y = yTop; y < yBottom; y += s * 1.05) glyph(ctx, x - s * 0.3, y, s, rng)
}

export function drawSueaKoo(ctx: Ctx, cx: number, cy: number, size: number, paper: string, ink = INK) {
  const k = size / 460
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  const rng = seededRng(5)

  drawUnalom(ctx, 0, -112, 172, ink)
  for (const x of [-34, 34]) scriptColumn(ctx, x, -300, -206, 17, rng, ink)
  smallYant(ctx, 0, 40, 62, ink, paper)
  scriptArc(ctx, 0, 30, 312, Math.PI * 0.27, Math.PI * 0.73, 24, rng, ink, true)
  scriptArc(ctx, 0, 30, 342, Math.PI * 0.31, Math.PI * 0.69, 22, rng, ink, true)

  bothSides(ctx, () => tiger(ctx, paper, ink))
  ctx.restore()
}

// ---------------------------------------------------------------------------------------------
// Ornate elephant (Erawan) head, frontal. Art box about 460 × 620 units centred on (0, 0).

/** Thai flame-leaf ornament pointing along `angle` (0 = up), tip curling clockwise. */
function kranok(ctx: Ctx, x: number, y: number, L: number, angle: number, paper: string, ink: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const leaf = new Path2D(
    `M ${-L * 0.2} 0 C ${-L * 0.36} ${-L * 0.36} ${-L * 0.22} ${-L * 0.78} ${L * 0.1} ${-L} ` +
      `C ${L * 0.02} ${-L * 0.84} ${L * 0.18} ${-L * 0.7} ${L * 0.22} ${-L * 0.52} ` +
      `C ${L * 0.3} ${-L * 0.3} ${L * 0.26} ${-L * 0.12} ${L * 0.2} 0 Z`,
  )
  ctx.fillStyle = paper
  ctx.fill(leaf)
  ctx.lineWidth = 3
  ctx.strokeStyle = ink
  ctx.stroke(leaf)
  ctx.lineWidth = 2
  ctx.stroke(new Path2D(`M 0 ${-L * 0.06} C ${-L * 0.12} ${-L * 0.36} ${-L * 0.04} ${-L * 0.66} ${L * 0.08} ${-L * 0.84}`))
  ctx.fillStyle = ink
  ctx.fill(new Path2D(`M ${-L * 0.1} ${-L * 0.04} C ${-L * 0.16} ${-L * 0.2} ${-L * 0.1} ${-L * 0.32} 0 ${-L * 0.4} C ${-L * 0.02} ${-L * 0.26} ${L * 0.04} ${-L * 0.12} ${L * 0.1} ${-L * 0.04} Z`))
  ctx.restore()
}

function curl(ctx: Ctx, x: number, y: number, r: number, angle: number, dir: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(1, dir)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(r * 0.6, -r * 0.2, r * 1.2, -r * 0.2, r * 1.5, -r * 0.9)
  const cxp = r * 1.5 - r * 0.62
  const cyp = -r * 0.9
  for (let t = 0; t <= Math.PI * 2.4; t += 0.12) {
    const rr = r * 0.62 * (1 - t / (Math.PI * 3))
    ctx.lineTo(cxp + rr * Math.cos(t), cyp + rr * Math.sin(t))
  }
  ctx.stroke()
  ctx.restore()
}

function pendant(ctx: Ctx, x: number, y: number, len: number, paper: string, ink: string) {
  ctx.fillStyle = ink
  for (let d = 0; d < len; d += 8) {
    ctx.beginPath()
    ctx.arc(x, y + d, d % 16 === 0 ? 2.8 : 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
  const yb = y + len
  const drop = new Path2D(`M ${x} ${yb} C ${x - 9} ${yb + 8} ${x - 8} ${yb + 20} ${x} ${yb + 28} C ${x + 8} ${yb + 20} ${x + 9} ${yb + 8} ${x} ${yb} Z`)
  ctx.fillStyle = paper
  ctx.fill(drop)
  ctx.lineWidth = 2.5
  ctx.strokeStyle = ink
  ctx.stroke(drop)
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(x, yb + 15, 3, 0, Math.PI * 2)
  ctx.fill()
}

function mandala(ctx: Ctx, cx: number, cy: number, r: number, paper: string, ink: string) {
  ctx.fillStyle = paper
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = ink
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(a)
    const petal = new Path2D(`M 0 ${-r} C ${r * 0.28} ${-r * 1.12} ${r * 0.18} ${-r * 1.36} 0 ${-r * 1.45} C ${-r * 0.18} ${-r * 1.36} ${-r * 0.28} ${-r * 1.12} 0 ${-r} Z`)
    ctx.stroke(petal)
    ctx.restore()
  }
  for (const [rr, w] of [
    [r, 3],
    [r * 0.72, 2.5],
  ]) {
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = ink
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(a)
    ctx.fill(new Path2D(`M 0 ${-r * 0.16} C ${r * 0.14} ${-r * 0.32} ${r * 0.1} ${-r * 0.55} 0 ${-r * 0.66} C ${-r * 0.1} ${-r * 0.55} ${-r * 0.14} ${-r * 0.32} 0 ${-r * 0.16} Z`))
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx + r * 0.86 * Math.cos(a), cy + r * 0.86 * Math.sin(a), 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawErawan(ctx: Ctx, cx: number, cy: number, size: number, paper: string, ink = INK) {
  const k = size / 460
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  inkStyle(ctx, 3.5, ink)

  // Halo of kranok flame-leaves behind the head (drawn first, so the head covers their bases)
  bothSides(ctx, () => {
    const n = 14
    for (let i = n - 1; i >= 0; i--) {
      const a = -Math.PI / 2 - 0.06 - (i / (n - 1)) * Math.PI * 0.92
      const r = 132 + (i % 2) * 10
      const L = i % 2 === 0 ? 104 : 84
      kranok(ctx, r * Math.cos(a) * 1.22, -60 + r * Math.sin(a), L, a + Math.PI / 2, paper, ink)
    }
  })

  // Ears
  bothSides(ctx, () => {
    const ear = new Path2D(
      'M -78 -118 C -138 -168 -214 -146 -210 -64 C -208 -4 -198 58 -166 96 C -140 124 -108 112 -94 82 C -84 60 -76 40 -70 18 Z',
    )
    ctx.fillStyle = paper
    ctx.fill(ear)
    ctx.lineWidth = 4
    ctx.strokeStyle = ink
    ctx.stroke(ear)
    ctx.save()
    ctx.clip(ear)
    ctx.lineWidth = 2.5
    for (const d of [
      'M -92 -106 C -140 -140 -192 -122 -190 -60 C -188 -4 -178 48 -152 80',
      'M -104 -88 C -140 -110 -170 -94 -168 -48 C -166 -6 -158 30 -138 58',
      'M -116 -66 C -138 -78 -150 -64 -148 -36 C -146 -8 -140 16 -126 36',
    ])
      ctx.stroke(new Path2D(d))
    ctx.lineWidth = 3
    curl(ctx, -176, 20, 26, -1.2, 1)
    curl(ctx, -150, -100, 20, 0.4, -1)
    curl(ctx, -128, 70, 18, -0.6, 1)
    ctx.fillStyle = ink
    const rim = sampleSegs(
      [
        [-96, -128, -144, -158, -200, -134, -198, -64],
        [-198, -64, -196, -8, -186, 50, -158, 84],
      ],
      16,
    )
    rim.forEach((p, i) => {
      if (i % 2 === 0) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    ctx.restore()
    // long pendants under the ears
    pendant(ctx, -168, 102, 96, paper, ink)
    pendant(ctx, -140, 116, 64, paper, ink)
  })

  // Head
  const head = new Path2D(
    'M 0 -172 C 56 -172 94 -136 98 -80 C 102 -28 92 22 64 62 C 52 80 42 94 36 106 L -36 106 C -42 94 -52 80 -64 62 C -92 22 -102 -28 -98 -80 C -94 -136 -56 -172 0 -172 Z',
  )
  ctx.fillStyle = paper
  ctx.fill(head)
  ctx.lineWidth = 4
  ctx.strokeStyle = ink
  ctx.stroke(head)
  ctx.save()
  ctx.clip(head)
  ctx.lineWidth = 1.8
  bothSides(ctx, () => {
    for (const d of [
      'M -90 -96 C -84 -60 -84 -20 -74 20',
      'M -82 -120 C -74 -80 -72 -36 -62 4',
      'M -70 30 C -62 46 -54 58 -44 68',
      'M -80 12 C -72 34 -62 52 -50 66',
    ])
      ctx.stroke(new Path2D(d))
  })
  ctx.restore()

  // Necklace with pendants (behind trunk and tusks)
  bothSides(ctx, () => {
    const neck = sampleSegs([[-132, 104, -100, 150, -48, 168, 0, 170]], 30)
    ctx.lineWidth = 3
    ctx.strokeStyle = ink
    ctx.beginPath()
    neck.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
    ctx.beginPath()
    neck.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y + 10) : ctx.moveTo(p.x, p.y + 10)))
    ctx.stroke()
    ctx.fillStyle = ink
    neck.forEach((p, i) => {
      if (i % 2 === 0) {
        ctx.beginPath()
        ctx.arc(p.x, p.y + 5, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    for (const [i, len] of [
      [3, 70],
      [9, 46],
      [15, 30],
      [21, 20],
    ]) {
      const p = neck[i]
      pendant(ctx, p.x, p.y + 12, len, paper, ink)
    }
  })

  // Forehead jewellery: mandala, flame, bead chains, crown band
  mandala(ctx, 0, -96, 30, paper, ink)
  const flame = new Path2D('M 0 -186 C 10 -170 12 -158 0 -146 C -12 -158 -10 -170 0 -186 Z')
  ctx.fillStyle = paper
  ctx.fill(flame)
  ctx.lineWidth = 2.5
  ctx.stroke(flame)
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(0, -162, 3.2, 0, Math.PI * 2)
  ctx.fill()
  bothSides(ctx, () => {
    const chain = sampleSegs([[-38, -110, -62, -96, -74, -66, -68, -40]], 12)
    for (const p of chain) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    const band = sampleSegs([[-40, -138, -60, -140, -80, -126, -88, -104]], 10)
    for (const p of band) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    pendant(ctx, -66, -38, 10, paper, ink)
  })

  // Eyes
  bothSides(ctx, () => {
    const eye = new Path2D('M -62 -14 C -54 -26 -36 -26 -26 -12 C -36 -6 -52 -4 -62 -14 Z')
    ctx.fillStyle = paper
    ctx.fill(eye)
    ctx.lineWidth = 3
    ctx.stroke(eye)
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(-42, -14, 5.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2.2
    for (const d of ['M -66 -22 C -54 -36 -34 -34 -22 -20', 'M -60 -2 C -50 4 -38 4 -30 -2', 'M -58 6 C -48 12 -38 12 -32 8'])
      ctx.stroke(new Path2D(d))
  })

  // Tusks
  bothSides(ctx, () => {
    const tusk = new Path2D('M -40 96 C -50 140 -72 172 -104 186 C -82 162 -66 136 -56 96 Z')
    ctx.fillStyle = paper
    ctx.fill(tusk)
    ctx.lineWidth = 3.5
    ctx.stroke(tusk)
    ctx.lineWidth = 3
    for (const y of [108, 118]) {
      ctx.beginPath()
      ctx.moveTo(-58, y)
      ctx.lineTo(-42 - (y - 96) * 0.2, y + 2)
      ctx.stroke()
    }
  })

  // Trunk (curls to the right at the bottom)
  const trunk = makeTube(
    [
      [0, 50, 0, 120, -4, 176, -2, 226],
      [-2, 226, 0, 266, 22, 296, 44, 290],
      [44, 290, 64, 284, 66, 256, 48, 254],
    ],
    (t) => 74 - 56 * Math.pow(t, 0.8),
  )
  drawTube(ctx, trunk, paper, ink, 4, () => {
    ctx.lineWidth = 2
    for (let i = 4; i < trunk.pts.length - 6; i += 4) {
      const p = trunk.pts[i]
      const nv = trunk.nrm[i]
      const tv = trunk.tan[i]
      const w = trunk.w[i]
      ctx.beginPath()
      ctx.moveTo(p.x + (nv.x * w) / 2, p.y + (nv.y * w) / 2)
      ctx.quadraticCurveTo(p.x + tv.x * w * 0.18, p.y + tv.y * w * 0.18, p.x - (nv.x * w) / 2, p.y - (nv.y * w) / 2)
      ctx.stroke()
    }
  })
  // Jewelled strip down the top of the trunk
  ctx.fillStyle = paper
  ctx.lineWidth = 2.5
  for (let i = 0; i < 6; i++) {
    const y = 66 + i * 22
    const r = 9 - i * 0.8
    const gem = new Path2D(`M 0 ${y - r} L ${r * 0.8} ${y} L 0 ${y + r} L ${-r * 0.8} ${y} Z`)
    ctx.fill(gem)
    ctx.stroke(gem)
  }
  ctx.fillStyle = ink
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(0, 66 + i * 22, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Lotus ornament below the trunk
  ctx.lineWidth = 3
  for (const [d, r] of [
    [0, 0],
    [-1, 1],
    [1, 1],
  ] as const) {
    const lotus = new Path2D(`M ${d * 18} 330 C ${d * 18 - 12 + r * d * 6} 316 ${d * 18 - 8} 300 ${d * 18 + d * 6} 292 C ${d * 18 + 8} 300 ${d * 18 + 12 + r * d * 6} 316 ${d * 18} 330 Z`)
    ctx.fillStyle = paper
    ctx.fill(lotus)
    ctx.stroke(lotus)
  }
  pendant(ctx, 0, 334, 8, paper, ink)

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
  below = false,
) {
  inkStyle(ctx, Math.max(2, s * 0.09), ink)
  // Above the centre glyphs run clockwise; below it they run counter-clockwise so they stay upright.
  let a = below ? to : from
  while (below ? a > from : a < to) {
    ctx.save()
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a))
    ctx.rotate(below ? a - Math.PI / 2 : a + Math.PI / 2)
    const advance = glyph(ctx, 0, 0, s, rng)
    ctx.restore()
    a += ((below ? -1 : 1) * advance) / radius
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
