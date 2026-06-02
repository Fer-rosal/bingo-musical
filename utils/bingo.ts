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

export function generateCard(cardId: number, tracks: SpotifyTrack[], config: GameConfig): BingoCard {
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

function buildCardHTML(card: BingoCard, config: GameConfig): string {
  const { gridSize, playlistName } = config
  const cellSize = gridSize === 4 ? 110 : 90
  const fontSize = gridSize === 4 ? 11 : 10
  const gridPx = cellSize * gridSize

  const cells = card.grid.flat().map(track => {
    if (track === null) {
      return `
        <div style="
          width:${cellSize}px; height:${cellSize}px;
          background:#1DB954;
          display:flex; align-items:center; justify-content:center;
          border:1px solid #2a2a2a;
          box-sizing:border-box;
        ">
          <span style="font-size:26px; font-weight:900; color:#000;">✕</span>
        </div>`
    }

    const artist = track.artists.map(a => a.name).join(', ')
    return `
      <div style="
        width:${cellSize}px; height:${cellSize}px;
        background:#141414;
        border:1px solid #2a2a2a;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        padding:6px; box-sizing:border-box; overflow:hidden; text-align:center;
      ">
        <span style="
          font-size:${fontSize}px; font-weight:700; color:#ffffff; line-height:1.3;
          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
        ">${escapeHtml(track.name)}</span>
        <span style="
          font-size:${fontSize - 1}px; color:#a3a3a3; margin-top:3px; line-height:1.2;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        ">${escapeHtml(artist)}</span>
      </div>`
  }).join('')

  return `
    <div style="
      width:${gridPx}px;
      background:#0a0a0a;
      border-radius:12px;
      overflow:hidden;
      font-family: system-ui, -apple-system, 'Helvetica Neue', sans-serif;
      border:1px solid #2a2a2a;
    ">
      <div style="
        background:#0a0a0a;
        padding:12px 16px;
        display:flex; align-items:center; justify-content:space-between;
        border-bottom:1px solid #2a2a2a;
      ">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="
            width:24px; height:24px; background:#1DB954; border-radius:50%;
            display:flex; align-items:center; justify-content:center; font-size:13px;
          ">♫</div>
          <span style="color:#ffffff; font-weight:700; font-size:13px;">
            ${escapeHtml(playlistName)}
          </span>
        </div>
        <span style="
          color:#000; background:#1DB954; font-weight:800; font-size:12px;
          padding:2px 10px; border-radius:99px;
        ">#${card.id}</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(${gridSize}, ${cellSize}px);">
        ${cells}
      </div>
    </div>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function generatePDF(cards: BingoCard[], config: GameConfig): Promise<void> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then(m => m.default),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any
  const pageW = doc.getPageWidth()
  const pageH = doc.getPageHeight()
  const marginMm = 8
  const usableW = pageW - marginMm * 2
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed; left:-9999px; top:0; background:#0a0a0a;'
  document.body.appendChild(container)

  try {
    for (let i = 0; i < cards.length; i++) {
      const isSecond = i % 2 === 1

      if (i > 0 && i % 2 === 0) doc.addPage()

      const wrapper = document.createElement('div')
      wrapper.innerHTML = buildCardHTML(cards[i], config)
      container.appendChild(wrapper)

      const el = wrapper.firstElementChild as HTMLElement
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const canvasW = canvas.width / 2
      const canvasH = canvas.height / 2

      const mmW = usableW
      const mmH = (canvasH / canvasW) * mmW
      const yPos = isSecond ? pageH / 2 + marginMm : marginMm

      doc.addImage(imgData, 'PNG', marginMm, yPos, mmW, mmH)

      if (!isSecond) {
        doc.setDrawColor(42, 42, 42)
        doc.setLineWidth(0.3)
        doc.line(marginMm, pageH / 2, pageW - marginMm, pageH / 2)
      }

      container.removeChild(wrapper)
    }
  } finally {
    document.body.removeChild(container)
  }

  doc.save('bingo-musical-cartones.pdf')
}
