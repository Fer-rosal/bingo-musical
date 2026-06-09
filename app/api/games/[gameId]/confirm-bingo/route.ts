import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionById, confirmWinner } from '@/lib/db/gameSession';
import { sendGameWinnerEmail, sendPlayerGameSummaryEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { playerIndex, gameType } = await request.json();
    const gameId = params.gameId;

    if (playerIndex === undefined || !gameType) {
      return NextResponse.json(
        { error: 'Player index and game type are required' },
        { status: 400 }
      );
    }

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

    const winner = game.players[playerIndex];
    if (!winner) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    await confirmWinner(gameId, playerIndex);

    // Send confirmation emails
    try {
      if (game.hostEmail) {
        await sendGameWinnerEmail(game.hostEmail, winner.name, game.gameCode, gameType);
      }

      if (winner.email) {
        await sendPlayerGameSummaryEmail(winner.email, winner.name, game.gameCode, 'winner');
      }

      // Send emails to other players if they provided emails
      for (const player of game.players) {
        if (player.index !== playerIndex && player.email) {
          await sendPlayerGameSummaryEmail(
            player.email,
            player.name,
            game.gameCode,
            'participant'
          );
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
