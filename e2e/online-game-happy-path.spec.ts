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

async function mockHostApis(page: Page) {
  await page.route('/api/playlists', route =>
    route.fulfill({ json: { playlists: mockPlaylists } })
  )
  await page.route('/api/auth/profile', route =>
    route.fulfill({ json: { id: 'host-spotify-id', email: 'host@test.com' } })
  )
  await page.route('/api/games/create', route =>
    route.fulfill({ status: 200, json: mockGame })
  )
}

async function mockPlayerApis(page: Page) {
  await page.route(`/api/games/${GAME_ID}`, route =>
    route.fulfill({ json: mockGame })
  )
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
  await page.route(`/api/playlists/${PLAYLIST_ID}/tracks`, route =>
    route.fulfill({ json: { tracks: mockTracks } })
  )
  await page.route(`/api/games/${GAME_ID}/state`, route =>
    route.fulfill({
      json: { status: 'waiting', drawnSongIds: [], playerCount: 1, players: [] },
    })
  )
}

test.describe('Online Game Happy Path', () => {
  test('host creates game and player joins, crosses songs', async ({ browser }) => {
    // ── HOST: select playlist, create game ──────────────────────────────────
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    await mockHostApis(hostPage)

    await hostPage.goto('/online/create')

    // Playlist picker loads
    await expect(hostPage.getByText('Fiesta Playlist')).toBeVisible()
    await hostPage.getByText('Fiesta Playlist').click()

    // Config step — click "Crear juego"
    await expect(hostPage.getByRole('button', { name: /Crear juego/i })).toBeVisible()
    await hostPage.getByRole('button', { name: /Crear juego/i }).click()

    // Created screen: QR code (SVG) + game code visible
    await expect(hostPage.locator('svg').first()).toBeVisible()
    await expect(hostPage.getByText(GAME_CODE)).toBeVisible()

    // Join link / "Ir a la sala del host" button visible
    await expect(
      hostPage.getByRole('link', { name: /sala del host/i })
    ).toBeVisible()

    // ── PLAYER: join game on a new browser context ──────────────────────────
    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await mockPlayerApis(playerPage)

    await playerPage.goto(`/online/join/${GAME_ID}`)

    // Join page shows playlist name + game code
    await expect(playerPage.getByText('Fiesta Playlist')).toBeVisible()
    await expect(playerPage.getByText(GAME_CODE)).toBeVisible()

    // Enter player name and submit
    await playerPage.getByPlaceholder(/María/i).fill('TestPlayer')
    await playerPage.getByRole('button', { name: /Unirme al juego/i }).click()

    // Redirected to player page — cartón loads
    await expect(playerPage).toHaveURL(`/online/${GAME_ID}/player`)
    await expect(playerPage.getByText('Hola, TestPlayer')).toBeVisible()

    // Cartón grid is visible (5×5 = 25 cells rendered as buttons)
    const cells = playerPage.locator('button').filter({ hasText: /Song \d+/i })
    await expect(cells.first()).toBeVisible()
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThanOrEqual(5) // at least some song cells

    // Cross 3 songs — click and verify they turn green (bg-[#1DB954] via class)
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).click()
      await expect(cells.nth(i)).toHaveClass(/bg-\[#1DB954\]/)
    }

    await hostCtx.close()
    await playerCtx.close()
  })
})
