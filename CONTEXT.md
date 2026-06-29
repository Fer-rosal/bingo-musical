# Bingo Musical — Domain Context

## What this product is

A musical bingo game where an anfitrión draws songs from a Spotify playlist and jugadores mark their cartones. Supports two modes: local (single device) and online (jugadores on their own devices).

## Glossary

| Term | Definition | Avoid |
|---|---|---|
| **partida** | An active game instance — one play-through from start to finish | "session", "game" |
| **anfitrión** | The person who creates and runs the partida — picks the playlist, draws songs, verifies claims | "host" |
| **jugador / jugadores** | Non-host participants who play their cartones | "player", "participant" |
| **cartón** | The grid (4×4 or 5×5) that each jugador marks during a partida | "BingoCard", "card" |
| **comodín** | A cell that starts pre-marked at the beginning of a partida | "free space", "pre-marked cell" |
| **bolsa** | The pool of songs available to draw from during a partida (drawn from the playlist) | "queue", "shuffledQueue" |
| **playlist** | The Spotify playlist the anfitrión selects before the partida — populates the bolsa | — |
| **draw** | The act of revealing a song from the bolsa | "play", "call" |
| **marcar** | The act of tapping a cell on the cartón to mark it | "select", "check" |
| **línea** | A completed horizontal row on the cartón — the first winning claim (rows only, not columns or diagonals) | "line", "fila" |
| **bingo** | A fully marked cartón — the final winning claim | — |
| **sala** | The waiting phase in an online partida — jugadores have joined but play hasn't started | "lobby", "waiting room" |
| **código de sala** | The 6-character alphanumeric code jugadores use to join an online sala | "game code", "gameCode" |
| **local** | Co-located multiplayer mode — jugadores are physically present, each on their own device, no server session; anfitrión verifies línea and bingo by looking at the jugador's screen | "offline", "single-device" |
| **online** | Remote multiplayer mode — jugadores join from anywhere using the código de sala | — |

## Key rules

- **Línea = row only.** A línea claim means one completed horizontal row. Columns and diagonals do not count as línea.
- **Bingo = full cartón.** A bingo claim means every non-comodín cell is marked.
- **Cartón sizes are 4×4 or 5×5.** No other sizes exist.
- **The bolsa is seeded from the playlist.** The anfitrión picks a playlist; the bolsa is a shuffled subset of its tracks.
- **Comodines start marked.** They are never drawn from the bolsa.

## Game lifecycle

### Online
```
sala (waiting) → partida (playing) → finished
```
Jugadores join the sala using the código de sala. The anfitrión starts the partida. Songs are drawn from the bolsa one at a time.

### Local
```
partida (playing) → línea-check → bingo-check → finished
```
Co-located multiplayer. Jugadores are physically present, each on their own device. The anfitrión draws songs; when a jugador claims línea or bingo, the anfitrión verifies manually by looking at their screen. No server session — verification is human, not automated.
