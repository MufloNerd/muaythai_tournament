import {
  PARTICIPANT_LINE,
  PLACE_INFO,
  certificateTitle,
  formatCertificateDate,
  type CertificateEntry,
  type Metal,
  type WinnerEntry,
} from './content'
import {
  INK,
  cornerFlourish,
  drawErawan,
  drawMongkhon,
  drawTiger,
  drawUnalom,
  scriptArc,
  scriptLine,
  seededRng,
} from './sakyant'

export const CERT_WIDTH = 2480
export const CERT_HEIGHT = 1754

const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif"
const COND = "'Avenir Next Condensed', 'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif"

const PAPER = '#ead6a8'
const PANEL = '#e2c994'
const RED_INK = '#7a1e12'

const METALS: Record<Metal, { stops: string[]; ink: string; edge: string }> = {
  gold: { stops: ['#7a5a12', '#f6d77a', '#b8892a', '#fff3b8', '#a07a22', '#e9c35a'], ink: '#3d2a05', edge: '#5c420c' },
  silver: { stops: ['#5f656c', '#eef1f5', '#9aa2ab', '#ffffff', '#7d848c', '#d9dde2'], ink: '#24282d', edge: '#454a51' },
  bronze: { stops: ['#5e3416', '#e7a76c', '#97552a', '#f6cda3', '#7a4520', '#c98a4b'], ink: '#33190a', edge: '#4e2a12' },
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
function fitText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: (s: number) => string,
) {
  let s = size
  ctx.font = font(s)
  while (s > 24 && ctx.measureText(text).width > maxWidth) {
    s -= 4
    ctx.font = font(s)
  }
  ctx.fillText(text, x, y)
}

// ---------------------------------------------------------------------------------------------

function drawParchment(ctx: Ctx, W: number, H: number) {
  const base = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * 0.65)
  base.addColorStop(0, '#f3e4bf')
  base.addColorStop(0.7, PAPER)
  base.addColorStop(1, '#cfae72')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)

  const rng = seededRng(7)
  for (let i = 0; i < 70; i++) {
    const x = rng() * W
    const y = rng() * H
    const r = 60 + rng() * 260
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const a = 0.03 + rng() * 0.06
    g.addColorStop(0, `rgba(120, 80, 30, ${a})`)
    g.addColorStop(1, 'rgba(120, 80, 30, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  ctx.strokeStyle = 'rgba(90, 60, 25, 0.06)'
  ctx.lineWidth = 2
  for (let i = 0; i < 500; i++) {
    const x = rng() * W
    const y = rng() * H
    const l = 10 + rng() * 40
    const a = rng() * Math.PI
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + l * Math.cos(a), y + l * Math.sin(a))
    ctx.stroke()
  }
  const burn = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, W * 0.62)
  burn.addColorStop(0, 'rgba(90, 55, 20, 0)')
  burn.addColorStop(1, 'rgba(90, 55, 20, 0.45)')
  ctx.fillStyle = burn
  ctx.fillRect(0, 0, W, H)
}

function drawFrame(ctx: Ctx, W: number, H: number) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 12
  ctx.strokeRect(56, 56, W - 112, H - 112)
  ctx.lineWidth = 3
  ctx.strokeRect(84, 84, W - 168, H - 168)
  const s = 115
  cornerFlourish(ctx, 100, 100, s, 0)
  cornerFlourish(ctx, W - 100, 100, s, Math.PI / 2)
  cornerFlourish(ctx, W - 100, H - 100, s, Math.PI)
  cornerFlourish(ctx, 100, H - 100, s, -Math.PI / 2)
}

function drawYantPanel(ctx: Ctx, x: number, y: number, w: number, h: number, kind: 'tiger' | 'erawan') {
  const rng = seededRng(kind === 'tiger' ? 11 : 23)
  const cx = x + w / 2

  roundRect(ctx, x, y, w, h, 28)
  ctx.fillStyle = PANEL
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.stroke()
  roundRect(ctx, x + 16, y + 16, w - 32, h - 32, 18)
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.fillStyle = INK
  for (let px = x + 44; px <= x + w - 44; px += 22) {
    for (const py of [y + 34, y + h - 34]) {
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawUnalom(ctx, cx, y + 330, 230)
  const figY = y + 640
  scriptArc(ctx, cx, figY, 262, Math.PI * 1.24, Math.PI * 1.76, 34, rng)
  if (kind === 'tiger') drawTiger(ctx, cx, figY + 6, w * 0.84)
  else drawErawan(ctx, cx, figY - 6, w * 0.88, PANEL)

  const rowsTop = figY + 270
  for (let i = 0; i < 8; i++) {
    const rowY = rowsTop + i * 60
    if (rowY > y + h - 70) break
    const inset = 50 + (i % 2) * 18
    scriptLine(ctx, x + inset, rowY, w - inset * 2, 34, rng)
  }
}

function drawRibbon(ctx: Ctx, cx: number, cy: number, half: number, height: number, text: string) {
  const h2 = height / 2
  const tail = 120
  ctx.lineJoin = 'round'
  for (const side of [-1, 1]) {
    const xi = cx + side * (half - 50)
    const xo = cx + side * (half + tail)
    ctx.beginPath()
    ctx.moveTo(xi, cy - h2 + 34)
    ctx.lineTo(xo, cy - h2 + 34)
    ctx.lineTo(xo - side * 46, cy + 34)
    ctx.lineTo(xo, cy + h2 + 34)
    ctx.lineTo(xi, cy + h2 + 34)
    ctx.closePath()
    ctx.fillStyle = '#c9a466'
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + side * half, cy + h2)
    ctx.lineTo(cx + side * (half - 50), cy + h2 + 34)
    ctx.lineTo(cx + side * (half - 50), cy + h2)
    ctx.closePath()
    ctx.fillStyle = '#8c6a35'
    ctx.fill()
    ctx.stroke()
  }
  const g = ctx.createLinearGradient(0, cy - h2, 0, cy + h2)
  g.addColorStop(0, '#f6e6bd')
  g.addColorStop(1, '#dcbd80')
  ctx.beginPath()
  ctx.moveTo(cx - half, cy - h2)
  ctx.quadraticCurveTo(cx, cy - h2 - 26, cx + half, cy - h2)
  ctx.lineTo(cx + half, cy + h2)
  ctx.quadraticCurveTo(cx, cy + h2 - 26, cx - half, cy + h2)
  ctx.closePath()
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = INK
  ctx.stroke()

  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  setSpacing(ctx, 4)
  fitText(ctx, text, cx, cy - 6, half * 2 - 90, 92, (s) => `800 ${s}px ${COND}`)
  setSpacing(ctx, 0)
  ctx.textBaseline = 'alphabetic'
}

function drawBelt(ctx: Ctx, cx: number, cy: number, half: number, entry: WinnerEntry) {
  const info = PLACE_INFO[entry.place]
  const m = info.metal
  const { ink, edge } = METALS[m]
  const strapH = 190
  const top = cy - strapH / 2

  const leather = ctx.createLinearGradient(0, top, 0, top + strapH)
  leather.addColorStop(0, '#4a0810')
  leather.addColorStop(0.35, '#a81b2b')
  leather.addColorStop(0.5, '#c42236')
  leather.addColorStop(0.65, '#a81b2b')
  leather.addColorStop(1, '#4a0810')
  ctx.fillStyle = leather
  ctx.shadowColor = 'rgba(60,35,10,0.45)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  roundRect(ctx, cx - half, top, half * 2, strapH, 40)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()

  ctx.save()
  ctx.setLineDash([18, 12])
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(246, 215, 122, 0.85)'
  for (const y of [top + 20, top + strapH - 20]) {
    ctx.beginPath()
    ctx.moveTo(cx - half + 36, y)
    ctx.lineTo(cx + half - 36, y)
    ctx.stroke()
  }
  ctx.restore()

  for (const x of [cx - half + 80, cx + half - 80]) {
    ctx.beginPath()
    ctx.arc(x, cy, 32, 0, Math.PI * 2)
    ctx.fillStyle = metal(ctx, x - 32, cy - 32, x + 32, cy + 32, m)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = edge
    ctx.stroke()
  }
  for (const x of [cx - half + 230, cx + half - 230]) {
    const w = 200
    const h = 156
    roundRect(ctx, x - w / 2, cy - h / 2, w, h, 26)
    ctx.fillStyle = metal(ctx, x - w / 2, cy - h / 2, x + w / 2, cy + h / 2, m)
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = edge
    ctx.stroke()
    roundRect(ctx, x - w / 2 + 14, cy - h / 2 + 14, w - 28, h - 28, 16)
    ctx.lineWidth = 3
    ctx.stroke()
    star(ctx, x, cy, 36, 15)
    ctx.fillStyle = '#c42236'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = ink
    ctx.stroke()
  }

  const rx = 300
  const ry = 236
  ctx.shadowColor = 'rgba(60,35,10,0.5)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const x = cx + rx * Math.cos(a)
    const y = cy + ry * Math.sin(a)
    ctx.beginPath()
    ctx.arc(x, y, 27, 0, Math.PI * 2)
    ctx.fillStyle = metal(ctx, x - 27, y - 27, x + 27, y + 27, m)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = metal(ctx, cx - rx, cy - ry, cx + rx, cy + ry, m)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 7
  ctx.strokeStyle = edge
  ctx.stroke()

  const shine = ctx.createRadialGradient(cx - 100, cy - 110, 16, cx, cy, rx)
  shine.addColorStop(0, 'rgba(255,255,255,0.45)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx - 48, ry - 44, 0, 0, Math.PI * 2)
  ctx.fillStyle = shine
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = edge
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  setSpacing(ctx, 8)
  ctx.font = `bold 38px ${SERIF}`
  ctx.fillText('MUAY THAI', cx, cy - 118)
  setSpacing(ctx, 0)
  star(ctx, cx, cy - 64, 40, 17)
  ctx.fillStyle = '#c42236'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = ink
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.font = `bold 136px ${SERIF}`
  ctx.fillText(info.badge, cx, cy + 78)
  setSpacing(ctx, 5)
  ctx.font = `800 36px ${COND}`
  ctx.fillText(info.plate, cx, cy + 150)
  setSpacing(ctx, 0)
}

function drawParticipantEmblem(ctx: Ctx, cx: number, cy: number) {
  drawMongkhon(ctx, cx, cy - 10, 200)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 84px Thonburi, 'Noto Sans Thai', 'Leelawadee UI', Tahoma, sans-serif`
  ctx.fillText('มวยไทย', cx, cy - 20)
  ctx.textBaseline = 'alphabetic'
  // small ribbon across the ring
  const half = 230
  const h = 74
  const y = cy + 190
  ctx.beginPath()
  ctx.moveTo(cx - half, y - h / 2)
  ctx.lineTo(cx + half, y - h / 2)
  ctx.lineTo(cx + half - 26, y)
  ctx.lineTo(cx + half, y + h / 2)
  ctx.lineTo(cx - half, y + h / 2)
  ctx.lineTo(cx - half + 26, y)
  ctx.closePath()
  ctx.fillStyle = '#f2e0b4'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = RED_INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  setSpacing(ctx, 6)
  ctx.font = `800 44px ${COND}`
  ctx.fillText('PARTECIPANTE', cx, y + 2)
  setSpacing(ctx, 0)
  ctx.textBaseline = 'alphabetic'
}

/** Parts shared by every certificate (parchment, frame, Sak Yant panels): render once and reuse. */
export function drawCertificateBackground(ctx: Ctx) {
  const W = CERT_WIDTH
  const H = CERT_HEIGHT
  drawParchment(ctx, W, H)
  drawFrame(ctx, W, H)
  const panelW = 450
  const panelX = 190
  const panelY = 250
  const panelH = H - 500
  drawYantPanel(ctx, panelX, panelY, panelW, panelH, 'tiger')
  drawYantPanel(ctx, W - panelX - panelW, panelY, panelW, panelH, 'erawan')
}

/** Per-athlete content drawn on top of the background. */
export function drawCertificateContent(ctx: Ctx, entry: CertificateEntry) {
  const cx = CERT_WIDTH / 2

  drawRibbon(ctx, cx, 250, 470, 128, certificateTitle(entry))

  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  fitText(ctx, entry.tournamentName, cx, 430, 1050, 60, (s) => `700 ${s}px ${COND}`)

  if (entry.kind === 'winner') drawBelt(ctx, cx, 790, 560, entry)
  else drawParticipantEmblem(ctx, cx, 770)

  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  fitText(ctx, entry.fighterName, cx, 1240, 1080, 132, (s) => `bold ${s}px ${SERIF}`)

  ctx.fillStyle = INK
  ctx.fillRect(cx - 420, 1282, 840, 4)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(cx + side * 440, 1284, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = RED_INK
  const line = entry.kind === 'winner' ? PLACE_INFO[entry.place].line : PARTICIPANT_LINE
  fitText(ctx, line, cx, 1370, 1080, 54, (s) => `700 ${s}px ${COND}`)

  ctx.fillStyle = INK
  ctx.font = `600 46px ${COND}`
  ctx.fillText(formatCertificateDate(entry.date), cx, 1520)
}

/** Draws a parchment, Sak Yant style certificate on a CERT_WIDTH × CERT_HEIGHT canvas. */
export function drawCertificate(ctx: Ctx, entry: CertificateEntry) {
  drawCertificateBackground(ctx)
  drawCertificateContent(ctx, entry)
}
