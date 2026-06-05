import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface EmailPayload {
  to: string;
  subject: string;
  templateName: string;
  data: Record<string, any>;
}

/**
 * Send email via Firebase Cloud Function
 * Cloud Function must be deployed at: sendEmail
 */
async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    const sendEmailFunc = httpsCallable(functions, 'sendEmail');
    await sendEmailFunc(payload);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendGameCreatedEmail(
  hostEmail: string,
  gameCode: string,
  playlistName: string
): Promise<void> {
  await sendEmail({
    to: hostEmail,
    subject: 'Your Bingo Musical Game Has Been Created',
    templateName: 'game_created',
    data: {
      gameCode,
      playlistName,
      joinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join`,
    },
  });
}

export async function sendPlayerJoinedEmail(
  hostEmail: string,
  playerName: string,
  gameCode: string,
  playerCount: number
): Promise<void> {
  await sendEmail({
    to: hostEmail,
    subject: `${playerName} joined your Bingo Musical game`,
    templateName: 'player_joined',
    data: {
      playerName,
      gameCode,
      playerCount,
    },
  });
}

export async function sendGameWinnerEmail(
  hostEmail: string,
  winnerName: string,
  gameCode: string,
  gameType: 'line' | 'bingo'
): Promise<void> {
  await sendEmail({
    to: hostEmail,
    subject: `${winnerName} got ${gameType}! Bingo Musical game summary`,
    templateName: 'game_winner',
    data: {
      winnerName,
      gameCode,
      gameType,
    },
  });
}

export async function sendPlayerGameSummaryEmail(
  playerEmail: string,
  playerName: string,
  gameCode: string,
  result: 'winner' | 'line' | 'participant'
): Promise<void> {
  await sendEmail({
    to: playerEmail,
    subject: 'Your Bingo Musical game summary',
    templateName: 'player_game_summary',
    data: {
      playerName,
      gameCode,
      result,
    },
  });
}
