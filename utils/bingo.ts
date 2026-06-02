import type { SpotifyTrack, BingoCard, GameConfig } from '../types/bingo'

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getPreMarkedIndices(gridSize: 4 | 5, count: number): number[] {
  const total = gridSize * gridSize
  const center = Math.floor(total / 2)

  if (count <= 1) return [center]

  const pool = Array.from({ length: total }, (_, i) => i).filter(i => i !== center)
  const extras = shuffle(pool).slice(0, count - 1)
  return [center, ...extras]
}

export function generateCard(
  cardId: number,
  tracks: SpotifyTrack[],
  config: GameConfig
): BingoCard {
  const { gridSize, preMarkedCount } = config
  const size = gridSize * gridSize
  const freeIndices = new Set(getPreMarkedIndices(gridSize, preMarkedCount))
  const slotCount = size - freeIndices.size
  const pool = shuffle(tracks).slice(0, slotCount)

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

export function generateAllCards(tracks: SpotifyTrack[], config: GameConfig): BingoCard[] {
  return Array.from({ length: config.playerCount }, (_, i) =>
    generateCard(i + 1, tracks, config)
  )
}

export async function generatePDF(cards: BingoCard[], config: GameConfig): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { gridSize } = config

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any
  const pageW = doc.getPageWidth()
  const pageH = doc.getPageHeight()

  const cartonH = pageH / 2
  const cartonW = pageW

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    const isSecond = i % 2 === 1
    const yOffset = isSecond ? cartonH : 0

    if (i > 0 && i % 2 === 0) {
      doc.addPage()
    }

    const cellW = cartonW / gridSize
    const cellH = cartonH / (gridSize + 1)
    const headerH = cellH

    doc.setFillColor(34, 197, 94)
    doc.rect(0, yOffset, cartonW, headerH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(
      `CARTÓN #${card.id} — ${config.playlistName}`,
      cartonW / 2,
      yOffset + headerH / 2 + 2,
      { align: 'center' }
    )

    doc.setTextColor(0, 0, 0)
    card.grid.forEach((row, r) => {
      row.forEach((track, c) => {
        const x = c * cellW
        const y = yOffset + headerH + r * cellH

        doc.setDrawColor(100, 100, 100)
        doc.setLineWidth(0.3)
        doc.rect(x, y, cellW, cellH)

        if (track === null) {
          doc.setFillColor(254, 240, 138)
          doc.rect(x, y, cellW, cellH, 'F')
          doc.setFontSize(20)
          doc.text('★', x + cellW / 2, y + cellH / 2 + 4, { align: 'center' })
        } else {
          const padding = 2
          const availW = cellW - padding * 2
          let fontSize = 10
          let lines: string[] = []

          while (fontSize >= 5) {
            doc.setFontSize(fontSize)
            lines = doc.splitTextToSize(track.name, availW)
            if (lines.length <= 3) break
            fontSize -= 0.5
          }

          const lineHeight = fontSize * 0.4
          const totalTextH = lines.length * lineHeight
          const startY = y + (cellH - totalTextH) / 2 + lineHeight
          doc.setFontSize(fontSize)
          doc.text(lines, x + cellW / 2, startY, { align: 'center' })
        }
      })
    })

    if (!isSecond) {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(0, cartonH, pageW, cartonH)
    }
  }

  doc.save('bingo-musical-cartones.pdf')
}
