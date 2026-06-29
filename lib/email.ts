// ponytail: no-op stubs — wire a real provider (Resend, Sendgrid, etc.) when email is needed

export async function sendGameCreatedEmail(
  _hostEmail: string,
  _gameCode: string,
  _playlistName: string,
): Promise<void> {}

export async function sendPlayerJoinedEmail(
  _hostEmail: string,
  _playerName: string,
  _gameCode: string,
  _playerCount: number,
): Promise<void> {}

export async function sendGameWinnerEmail(
  _hostEmail: string,
  _winnerName: string,
  _gameCode: string,
  _gameType: string,
): Promise<void> {}

export async function sendPlayerGameSummaryEmail(
  _playerEmail: string,
  _playerName: string,
  _gameCode: string,
  _result: string,
): Promise<void> {}
