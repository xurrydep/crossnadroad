// Client-side API functions for React app
// These replace the Next.js API routes from the örnek folder

import { generateSessionToken, validateSessionToken } from './auth';
import { getPlayerData, isValidAddress } from './blockchain';

// Types
interface SessionTokenResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: number;
  error?: string;
}

interface PlayerDataResponse {
  success: boolean;
  playerAddress?: string;
  totalScore?: string;
  totalTransactions?: string;
  error?: string;
}

interface UpdatePlayerDataResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Session token management
export async function getSessionToken(
  playerAddress: string,
  signedMessage: string,
  message: string
): Promise<SessionTokenResponse> {
  try {
    if (!playerAddress || !signedMessage || !message) {
      return {
        success: false,
        error: 'Missing required fields: playerAddress, signedMessage, message'
      };
    }

    // Verify that the message contains the player address
    if (!message.includes(playerAddress)) {
      return {
        success: false,
        error: 'Invalid message format'
      };
    }

    // Generate session token
    const timestamp = Math.floor(Date.now() / 30000) * 30000; // Round to 30-second intervals
    const sessionToken = generateSessionToken(playerAddress, timestamp);

    return {
      success: true,
      sessionToken,
      expiresAt: timestamp + 300000, // 5 minutes from token timestamp
    };
  } catch (error) {
    console.error('Error generating session token:', error);
    return {
      success: false,
      error: 'Failed to generate session token'
    };
  }
}

// Get player data from blockchain
export async function getPlayerDataFromBlockchain(
  playerAddress: string
): Promise<PlayerDataResponse> {
  try {
    if (!playerAddress) {
      return {
        success: false,
        error: 'Player address is required'
      };
    }

    if (!isValidAddress(playerAddress)) {
      return {
        success: false,
        error: 'Invalid player address format'
      };
    }

    const playerData = await getPlayerData(playerAddress);

    return {
      success: true,
      playerAddress,
      totalScore: playerData.totalScore.toString(),
      totalTransactions: playerData.totalTransactions.toString()
    };
  } catch (error) {
    console.error('Error getting player data:', error);
    return {
      success: false,
      error: 'Failed to get player data'
    };
  }
}

// Update player data (client-side validation only)
// Note: In a production environment, this would need a backend API
export async function updatePlayerData(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number,
  sessionToken: string
): Promise<UpdatePlayerDataResponse> {
  try {
    // Session token validation
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return {
        success: false,
        error: 'Unauthorized: Invalid or expired session token'
      };
    }

    // Validate input
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return {
        success: false,
        error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount'
      };
    }

    // Validate player address format
    if (!isValidAddress(playerAddress)) {
      return {
        success: false,
        error: 'Invalid player address format'
      };
    }

    // Validate that scoreAmount and transactionAmount are positive numbers
    if (scoreAmount < 0 || transactionAmount < 0) {
      return {
        success: false,
        error: 'Score and transaction amounts must be non-negative'
      };
    }

    // Maximum limits to prevent abuse
    const MAX_SCORE_PER_REQUEST = 1000;
    const MAX_TRANSACTIONS_PER_REQUEST = 10;
    const MIN_SCORE_PER_REQUEST = 1;
    const MAX_SCORE_PER_TRANSACTION = 100;

    if (scoreAmount > MAX_SCORE_PER_REQUEST || transactionAmount > MAX_TRANSACTIONS_PER_REQUEST) {
      return {
        success: false,
        error: `Amounts too large. Max score: ${MAX_SCORE_PER_REQUEST}, Max transactions: ${MAX_TRANSACTIONS_PER_REQUEST}`
      };
    }

    if (scoreAmount < MIN_SCORE_PER_REQUEST && scoreAmount !== 0) {
      return {
        success: false,
        error: `Score amount too small. Minimum: ${MIN_SCORE_PER_REQUEST}`
      };
    }

    // Validate score-to-transaction ratio
    if (transactionAmount > 0 && (scoreAmount / transactionAmount) > MAX_SCORE_PER_TRANSACTION) {
      return {
        success: false,
        error: `Score per transaction too high. Maximum: ${MAX_SCORE_PER_TRANSACTION} points per transaction`
      };
    }

    // In a real implementation, this would make a blockchain transaction
    // For now, we'll simulate success
    console.log('Simulating player data update:', {
      playerAddress,
      scoreAmount,
      transactionAmount
    });

    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64) // Simulated hash
    };
  } catch (error) {
    console.error('Error updating player data:', error);
    return {
      success: false,
      error: 'Failed to update player data'
    };
  }
}

// Rate limiting helper (client-side)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}