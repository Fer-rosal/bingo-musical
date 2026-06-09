import type { SpotifyTrack, BingoCard, GameConfig } from '../types/bingo'

// Seeded random number generator (for deterministic cartón generation)
class SeededRNG {
  private seed: number;

  constructor(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    this.seed = Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export function shuffle<T>(arr: T[], seed?: string): T[] {
  const a = [...arr]
  const rng = seed ? new SeededRNG(seed) : null;

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng.next() : Math.random()) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getPreMarkedIndices(gridSize: 4 | 5, count: number, seed?: string): number[] {
  const total = gridSize * gridSize
  const center = Math.floor(total / 2)
  if (count <= 1) return [center]
  const pool = Array.from({ length: total }, (_, i) => i).filter(i => i !== center)
  const extras = shuffle(pool, seed ? `${seed}_premarked` : undefined).slice(0, count - 1)
  return [center, ...extras]
}

export function generateCard(cardId: number, tracks: SpotifyTrack[], config: GameConfig, seed?: string): BingoCard {
  const { gridSize, preMarkedCount } = config
  const size = gridSize * gridSize
  const freeIndices = new Set(getPreMarkedIndices(gridSize, preMarkedCount, seed))
  const slotCount = size - freeIndices.size
  const pool = shuffle(tracks, seed ? `${seed}_tracks` : undefined).slice(0, slotCount)

  let trackIdx = 0
  const flat: (SpotifyTrack | null)[] = Array.from({ length: size }, (_, i) =>
    freeIndices.has(i) ? null : pool[trackIdx++]
  )

  const grid: (SpotifyTrack | null)[][] = []
  for (let r = 0; r < gridSize; r++) {
    grid.push(flat.slice(r * gridSize, (r + 1) * gridSize))
  }

  return { id: cardId, grid }
}

export function generateAllCards(tracks: SpotifyTrack[], config: GameConfig, seed?: string): BingoCard[] {
  return Array.from({ length: config.playerCount }, (_, i) =>
    generateCard(i + 1, tracks, config, seed ? `${seed}_player${i}` : undefined)
  )
}

export function generateOnlineCard(playerIndex: number, tracks: SpotifyTrack[], gridSize: 4 | 5, preMarkedCount: number, gameId: string): BingoCard {
  const seed = `${gameId}_player${playerIndex}`;
  const config = { playlistId: '', gridSize, preMarkedCount, playerCount: 1, playlistName: '' };
  return generateCard(playerIndex, tracks, config, seed);
}

// pt to mm: 1pt = 0.352778mm; line height ~1.25x
const PT_TO_MM = 0.352778
const LINE_LEADING = 1.25

function fitText(doc: any, text: string, maxW: number, maxH: number, startSize: number, minSize: number): { lines: string[]; fontSize: number } {
  let fontSize = startSize
  while (fontSize >= minSize) {
    doc.setFontSize(fontSize)
    const lines: string[] = doc.splitTextToSize(text, maxW)
    const totalH = lines.length * fontSize * PT_TO_MM * LINE_LEADING
    if (totalH <= maxH) return { lines, fontSize }
    fontSize -= 0.5
  }
  doc.setFontSize(minSize)
  return { lines: doc.splitTextToSize(text, maxW), fontSize: minSize }
}

export async function generatePDF(cards: BingoCard[], config: GameConfig): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { gridSize, playlistName } = config

  // 2 cards per A4, stacked vertically, no margins
  const pageW = 210
  const pageH = 297
  const slotH = pageH / 2          // each card gets exactly half the page
  const headerH = 7
  const gridH = slotH - headerH
  const cellW = pageW / gridSize
  const cellH = gridH / gridSize
  const pad = 2 // cell inner padding mm

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    const isSecond = i % 2 === 1
    const slotY = isSecond ? slotH : 0

    if (i > 0 && !isSecond) doc.addPage()

    // ── Cut line between the two cards ───────────────────────────
    if (isSecond) {
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.setLineDash([2, 2])
      doc.line(0, slotH, pageW, slotH)
      doc.setLineDash([])
    }

    // ── Header strip ──────────────────────────────────────────────
    doc.setFillColor(0, 0, 0)
    doc.rect(0, slotY, pageW, headerH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `#${card.id}  ${playlistName.toUpperCase()}`,
      pageW / 2,
      slotY + headerH / 2 + 1,
      { align: 'center' }
    )

    // ── Grid cells ────────────────────────────────────────────────
    card.grid.forEach((row, r) => {
      row.forEach((track, c) => {
        const x = c * cellW
        const y = slotY + headerH + r * cellH

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.15)
        doc.rect(x, y, cellW, cellH)

        if (track === null) {
          // Free cell: light fill, bold X
          doc.setFillColor(230, 230, 230)
          doc.rect(x, y, cellW, cellH, 'F')
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.15)
          doc.rect(x, y, cellW, cellH)
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(22)
          doc.setFont('helvetica', 'bold')
          doc.text('X', x + cellW / 2, y + cellH / 2 + 4, { align: 'center' })
        } else {
          const availW = cellW - pad * 2
          const availH = cellH - pad * 2

          // Song name — maximize font, use up to 70% of cell height
          const nameMaxH = availH * 0.68
          doc.setFont('helvetica', 'bold')
          const { lines: nameLines, fontSize: nameFSize } = fitText(
            doc, track.name, availW, nameMaxH, 14, 6
          )

          // Artist — remaining space
          const nameBlockH = nameLines.length * nameFSize * PT_TO_MM * LINE_LEADING
          const artistMaxH = availH - nameBlockH - 1
          const artistText = track.artists.map(a => a.name).join(', ')
          doc.setFont('helvetica', 'normal')
          const { lines: artistLines, fontSize: artistFSize } = fitText(
            doc, artistText, availW, artistMaxH, nameFSize * 0.72, 5
          )

          // Vertical centering
          const artistBlockH = artistLines.length * artistFSize * PT_TO_MM * LINE_LEADING
          const totalBlockH = nameBlockH + artistBlockH + (artistLines.length ? 1 : 0)
          let curY = y + (cellH - totalBlockH) / 2 + nameFSize * PT_TO_MM

          // Draw song name
          doc.setFontSize(nameFSize)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          nameLines.forEach((line: string) => {
            doc.text(line, x + cellW / 2, curY, { align: 'center' })
            curY += nameFSize * PT_TO_MM * LINE_LEADING
          })

          // Draw artist name
          if (artistLines.length) {
            curY += 0.5
            doc.setFontSize(artistFSize)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(80, 80, 80)
            artistLines.forEach((line: string) => {
              doc.text(line, x + cellW / 2, curY, { align: 'center' })
              curY += artistFSize * PT_TO_MM * LINE_LEADING
            })
          }
        }
      })
    })
  }

  doc.save('bingo-musical-cartones.pdf')
}
