import { test, expect, type Page } from '@playwright/test'

const GAME_ID = 'test-game-id-abc123'
const GAME_CODE = 'ABC123'
const PLAYLIST_ID = 'playlist-test-456'

const mockPlaylists = [
  {
    id: PLAYLIST_ID,
    name: 'Fiesta Playlist',
    images: [],
    tracks: { total: 30 },
  },
]

const mockGame = {
  id: GAME_ID,
  hostSpotifyId: 'host-spotify-id',
  gameCode: GAME_CODE,
  playlistName: 'Fiesta Playlist',
  playlistId: PLAYLIST_ID,
  gridSize: 5,
  preMarkedCount: 0,
  status: 'waiting',
  playerCount: 0,
}

// 30 tracks with valid 22-char Spotify IDs
const mockTracks = Array.from({ length: 30 }, (_, i) => ({
  id: `Track${String(i).padStart(17, '0')}`,
  name: `Song ${i}`,
  artists: [{ name: `Artist ${i}` }],
  album: { name: `Album ${i}`, images: [] },
  duration_ms: 180000,
  explicit: false,
  external_urls: { spotify: '' },
  href: '',
  type: 'track',
  uri: '',
  popularity: 70,
}))

// Shared "server" state — mirrors the games/drawn_songs tables so the host
// and player mock contexts observe the same draw progression.
interface GameServerState {
  status: 'waiting' | 'playing' | 'finished'
  drawnSongIds: string[]
  playerCount: number
  players: Array<{ index: number; name: string }>
}

async function mockCommonApis(page: Page, state: GameServerState) {
  await page.route(`/api/games/${GAME_ID}`, route => route.fulfill({ json: mockGame }))
  await page.route(`/api/games/${GAME_ID}/tracks`, route =>
    route.fulfill({ json: { tracks: mockTracks } })
  )
  await page.route(`/api/games/${GAME_ID}/state`, route =>
    route.fulfill({
      json: {
        status: state.status,
        drawnSongIds: state.drawnSongIds,
        playerCount: state.playerCount,
        players: state.players,
      },
    })
  )
}

async function mockHostApis(page: Page, state: GameServerState) {
  await page.route('/api/playlists', route => route.fulfill({ json: { playlists: mockPlaylists } }))
  await page.route('/api/games/create', route => route.fulfill({ status: 200, json: mockGame }))
  await page.route('/api/auth/token', route => route.fulfill({ json: { token: 'mock-access-token' } }))
  await page.route(`/api/games/${GAME_ID}/draw-song`, async route => {
    const { songId } = route.request().postDataJSON()
    if (!state.drawnSongIds.includes(songId)) state.drawnSongIds.push(songId)
    state.status = 'playing'
    await route.fulfill({ json: { success: true } })
  })
  await page.route(`/api/games/${GAME_ID}/confirm-bingo`, async route => {
    state.status = 'finished'
    await route.fulfill({ json: { success: true } })
  })
  await mockCommonApis(page, state)
}

async function mockPlayerApis(page: Page, state: GameServerState) {
  await page.route(`/api/games/${GAME_ID}/join`, route =>
    route.fulfill({
      json: {
        playerIndex: 0,
        gameCode: GAME_CODE,
        playlistId: PLAYLIST_ID,
        gridSize: 5,
        preMarkedCount: 0,
      },
    })
  )
  await mockCommonApis(page, state)
}

test.describe('Online Game Happy Path', () => {
  test('host creates game, player joins, host reveals a song, player sees it', async ({ browser }) => {
    const state: GameServerState = { status: 'waiting', drawnSongIds: [], playerCount: 0, players: [] }

    // ── HOST: select playlist, create game ──────────────────────────────────
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    await mockHostApis(hostPage, state)

    await hostPage.goto('/online/create')

    await expect(hostPage.getByText('Fiesta Playlist')).toBeVisible()
    await hostPage.getByText('Fiesta Playlist').click()

    await expect(hostPage.getByRole('button', { name: /Crear juego/i })).toBeVisible()
    await hostPage.getByRole('button', { name: /Crear juego/i }).click()

    await expect(hostPage.locator('svg').first()).toBeVisible()
    await expect(hostPage.getByText(GAME_CODE)).toBeVisible()
    await expect(hostPage.getByRole('link', { name: /sala del host/i })).toBeVisible()

    // ── PLAYER: join game on a new browser context ──────────────────────────
    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    state.playerCount = 1
    state.players = [{ index: 0, name: 'TestPlayer' }]
    await mockPlayerApis(playerPage, state)

    await playerPage.goto(`/online/join/${GAME_ID}`)

    await expect(playerPage.getByText('Fiesta Playlist')).toBeVisible()
    await expect(playerPage.getByText(GAME_CODE)).toBeVisible()

    await playerPage.getByPlaceholder(/María/i).fill('TestPlayer')
    await playerPage.getByRole('button', { name: /Unirme al juego/i }).click()

    await expect(playerPage).toHaveURL(`/online/${GAME_ID}/player`)
    await expect(playerPage.getByText('TestPlayer')).toBeVisible()

    // Cartón grid is visible (5×5 = 25 cells rendered as buttons)
    const cells = playerPage.locator('button').filter({ hasText: /Song \d+/i })
    await expect(cells.first()).toBeVisible()
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThanOrEqual(5)

    // Cross 3 songs — click and verify they turn green (bg-[#1DB954] via class)
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).click()
      await expect(cells.nth(i)).toHaveClass(/bg-\[#1DB954\]/)
    }

    // ── HOST: go to the host room and reveal the first song ─────────────────
    await hostPage.goto(`/online/${GAME_ID}/host`)
    await expect(hostPage.getByText('Pulsa el botón para revelar la primera canción')).toBeVisible()
    await expect(hostPage.getByText('0 / 30')).toBeVisible()

    const revealBtn = hostPage.getByTestId('host-reveal-song-btn')
    await expect(revealBtn).toHaveText(/Iniciar partida/i)
    await revealBtn.click()

    // Draw-song POST landed and state advanced — progress + current track update
    await expect(hostPage.getByText('1 / 30')).toBeVisible()
    await expect(hostPage.getByText(/Song \d+/).first()).toBeVisible()

    // ── PLAYER: sees the revealed song show up after its next poll ──────────
    await expect(playerPage.getByText('1 canciones')).toBeVisible({ timeout: 5000 })

    // ── HOST: BINGO requires a second confirmation before the game ends ─────
    await hostPage.getByRole('button', { name: 'BINGO' }).click()
    await expect(hostPage.getByRole('button', { name: /Confirmar BINGO y finalizar/i })).toBeVisible()
    // Game must still be running — no "finished" banner yet
    await expect(hostPage.getByText('¡Bingo confirmado!')).not.toBeVisible()

    await hostPage.getByRole('button', { name: /Confirmar BINGO y finalizar/i }).click()
    await expect(hostPage.getByText('¡Bingo confirmado! El juego ha terminado.')).toBeVisible()

    await hostCtx.close()
    await playerCtx.close()
  })
})
