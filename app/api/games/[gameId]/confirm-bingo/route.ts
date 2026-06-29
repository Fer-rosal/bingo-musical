import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionById, confirmWinner } from '@/lib/db/gameSession';
import { sendGameWinnerEmail, sendPlayerGameSummaryEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const [{ playerIndex }, { gameId }] = await Promise.all([request.json(), params]);

    const game = await getGameSessionById(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status === 'finished') {
      return NextResponse.json(
        { error: 'Game is already finished' },
        { status: 400 }
      );
    }

    const winnerIndex = playerIndex ?? -1;
    await confirmWinner(gameId, winnerIndex);

    // Send completion emails
    try {
      const winner = game.players[winnerIndex];
      if (game.hostEmail) {
        await sendGameWinnerEmail(game.hostEmail, winner?.name ?? 'Ganador', game.gameCode, 'bingo');
      }
      if (winner?.email) {
        await sendPlayerGameSummaryEmail(winner.email, winner.name, game.gameCode, 'winner');
      }
      for (const player of game.players) {
        if (player.index !== winnerIndex && player.email) {
          await sendPlayerGameSummaryEmail(player.email, player.name, game.gameCode, 'participant');
        }
      }
    } catch (emailError) {
      console.error('Error sending completion emails:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming bingo:', error);
    return NextResponse.json(
      { error: 'Failed to confirm bingo' },
      { status: 500 }
    );
  }
}
