import { PLACE_INFO, formatCertificateDate, type CertificateEntry, type Metal } from './content'

export const CERT_WIDTH = 2480
export const CERT_HEIGHT = 1754

const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

const METALS: Record<Metal, { stops: string[]; ink: string; edge: string; light: string }> = {
  gold: {
    stops: ['#7a5a12', '#f6d77a', '#b8892a', '#fff3b8', '#a07a22', '#e9c35a'],
    ink: '#3d2a05',
    edge: '#5c420c',
    light: '#f2c14e',
  },
  silver: {
    stops: ['#5f656c', '#eef1f5', '#9aa2ab', '#ffffff', '#7d848c', '#d9dde2'],
    ink: '#24282d',
    edge: '#454a51',
    light: '#dfe3e8',
  },
  bronze: {
    stops: ['#5e3416', '#e7a76c', '#97552a', '#f6cda3', '#7a4520', '#c98a4b'],
    ink: '#33190a',
    edge: '#4e2a12',
    light: '#e2a46b',
  },
}

type Ctx = CanvasRenderingContext2D

function metal(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, m: Metal) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  const { stops } = METALS[m]
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
  return g
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function star(ctx: Ctx, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  ctx.closePath()
}

function setSpacing(ctx: Ctx, px: number) {
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`
}

/** Draws centered text, shrinking the font until it fits maxWidth. */
function fitText(ctx: Ctx, text: string, x: number, y: number, maxWidth: number, size: number, font: (s: number) => string) {
  let s = size
  ctx.font = font(s)
  while (s > 24 && ctx.measureText(text).width > maxWidth) {
    s -= 4
    ctx.font = font(s)
  }
  ctx.fillText(text, x, y)
}

function drawBackground(ctx: Ctx, W: number, H: number) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7)
  bg.addColorStop(0, '#262a32')
  bg.addColorStop(1, '#07080a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.lineWidth = 16
  ctx.strokeStyle = metal(ctx, 0, 0, W, H, 'gold')
  ctx.strokeRect(60, 60, W - 120, H - 120)
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.7
  ctx.strokeRect(100, 100, W - 200, H - 200)
  ctx.globalAlpha = 1

  ctx.fillStyle = metal(ctx, 0, 0, W, H, 'gold')
  for (const [x, y] of [
    [100, 100],
    [W - 100, 100],
    [100, H - 100],
    [W - 100, H - 100],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x, y - 26)
    ctx.lineTo(x + 26, y)
    ctx.lineTo(x, y + 26)
    ctx.lineTo(x - 26, y)
    ctx.closePath()
    ctx.fill()
  }
}

function drawBelt(ctx: Ctx, W: number, cy: number, entry: CertificateEntry) {
  const info = PLACE_INFO[entry.place]
  const m = info.metal
  const { ink, edge } = METALS[m]
  const strapH = 250
  const top = cy - strapH / 2

  // Leather strap
  const leather = ctx.createLinearGradient(0, top, 0, top + strapH)
  leather.addColorStop(0, '#4a0810')
  leather.addColorStop(0.35, '#b51c2e')
  leather.addColorStop(0.5, '#d7263d')
  leather.addColorStop(0.65, '#b51c2e')
  leather.addColorStop(1, '#4a0810')
  ctx.fillStyle = leather
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  roundRect(ctx, 170, top, W - 340, strapH, 48)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // Stitching
  ctx.save()
  ctx.setLineDash([22, 14])
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(246, 215, 122, 0.8)'
  for (const y of [top + 24, top + strapH - 24]) {
    ctx.beginPath()
    ctx.moveTo(220, y)
    ctx.lineTo(W - 220, y)
    ctx.stroke()
  }
  ctx.restore()

  // Studs and side plates
  for (const x of [320, W - 320]) {
    ctx.beginPath()
    ctx.arc(x, cy, 42, 0, Math.PI * 2)
    ctx.fillStyle = metal(ctx, x - 42, cy - 42, x + 42, cy + 42, m)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = edge
    ctx.stroke()
  }
  for (const x of [600, W - 600]) {
    const w = 270
    const h = 210
    roundRect(ctx, x - w / 2, cy - h / 2, w, h, 34)
    ctx.fillStyle = metal(ctx, x - w / 2, cy - h / 2, x + w / 2, cy + h / 2, m)
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = edge
    ctx.stroke()
    roundRect(ctx, x - w / 2 + 18, cy - h / 2 + 18, w - 36, h - 36, 22)
    ctx.lineWidth = 3
    ctx.stroke()
    star(ctx, x, cy, 46, 19)
    ctx.fillStyle = '#d7263d'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = ink
    ctx.stroke()
  }

  // Central plate with scalloped edge
  const cx = W / 2
  const rx = 380
  const ry = 300
  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 20
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const x = cx + rx * Math.cos(a)
    const y = cy + ry * Math.sin(a)
    ctx.beginPath()
    ctx.arc(x, y, 34, 0, Math.PI * 2)
    ctx.fillStyle = metal(ctx, x - 34, y - 34, x + 34, y + 34, m)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = metal(ctx, cx - rx, cy - ry, cx + rx, cy + ry, m)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 8
  ctx.strokeStyle = edge
  ctx.stroke()

  const shine = ctx.createRadialGradient(cx - 120, cy - 140, 20, cx, cy, rx)
  shine.addColorStop(0, 'rgba(255,255,255,0.45)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx - 60, ry - 55, 0, 0, Math.PI * 2)
  ctx.fillStyle = shine
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = edge
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  setSpacing(ctx, 10)
  ctx.font = `bold 46px ${SERIF}`
  ctx.fillText('MUAY THAI', cx, cy - 150)
  setSpacing(ctx, 0)

  star(ctx, cx, cy - 80, 50, 21)
  ctx.fillStyle = '#d7263d'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = ink
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.font = `bold 170px ${SERIF}`
  ctx.fillText(info.badge, cx, cy + 100)
  setSpacing(ctx, 6)
  ctx.font = `800 44px ${SANS}`
  ctx.fillText(info.plate, cx, cy + 190)
  setSpacing(ctx, 0)
}

/** Draws a championship-belt style certificate on a CERT_WIDTH × CERT_HEIGHT canvas. */
export function drawCertificate(ctx: Ctx, entry: CertificateEntry) {
  const W = CERT_WIDTH
  const H = CERT_HEIGHT
  const info = PLACE_INFO[entry.place]
  const gold = metal(ctx, W / 2 - 900, 0, W / 2 + 900, 0, 'gold')

  drawBackground(ctx, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = gold
  setSpacing(ctx, 8)
  fitText(ctx, 'CERTIFICATO DI VITTORIA', W / 2, 290, 2000, 108, (s) => `bold ${s}px ${SERIF}`)
  setSpacing(ctx, 0)

  ctx.fillStyle = '#e9ebef'
  fitText(ctx, entry.tournamentName, W / 2, 400, 1900, 66, (s) => `600 ${s}px ${SANS}`)

  drawBelt(ctx, W, 820, entry)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  fitText(ctx, entry.fighterName, W / 2, 1300, 2000, 150, (s) => `bold ${s}px ${SERIF}`)

  ctx.fillStyle = gold
  ctx.fillRect(W / 2 - 450, 1345, 900, 5)

  ctx.fillStyle = METALS[info.metal].light
  fitText(ctx, info.line, W / 2, 1440, 2000, 60, (s) => `600 ${s}px ${SANS}`)

  ctx.fillStyle = '#c4c8cf'
  ctx.font = `500 46px ${SANS}`
  ctx.fillText(formatCertificateDate(entry.date), W / 2, 1580)
}
