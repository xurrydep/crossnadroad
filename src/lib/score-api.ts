// Client-side API helpers for score submission

interface ScoreSubmissionResponse {
  success: boolean;
  transactionHash?: string;
  message?: string;
  error?: string;
}

interface QueuedTransaction {
  id: string;
  playerAddress: string;
  scoreAmount: number;
  transactionAmount: number;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  onSuccess?: (result: ScoreSubmissionResponse) => void;
  onFailure?: (error: string) => void;
  onRetry?: (attempt: number) => void;
}

interface PlayerDataResponse {
  success: boolean;
  playerAddress: string;
  totalScore: string;
  totalTransactions: string;
  error?: string;
}

interface PlayerDataPerGameResponse {
  success: boolean;
  playerAddress: string;
  gameAddress: string;
  score: string;
  transactions: string;
  error?: string;
}

// Get session token for authenticated requests from Monad Games ID
export async function getSessionToken(playerAddress: string, signMessage?: any): Promise<string | null> {
  try {
    const message = `Authenticate for Monad Games ID: ${playerAddress}`;
    let signedMessage = "";
    
    // Try to sign message with Privy if available
    if (signMessage && typeof signMessage === 'function') {
      try {
        signedMessage = await signMessage(message);
        console.log('Message signed successfully with wallet');
      } catch (signError) {
        console.warn('Failed to sign message with wallet:', signError);
        throw new Error('Wallet signature required for authentication');
      }
    } else {
      throw new Error('signMessage function not available');
    }
    
    // Get session token from Monad Games ID API
    const response = await fetch('https://monad-games-id-site.vercel.app/api/get-session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: playerAddress,
        message: message,
        signature: signedMessage
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.sessionToken) {
      console.log('Session token obtained successfully');
      return data.sessionToken;
    } else {
      throw new Error(data.message || 'Failed to get session token');
    }
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

// Submit player score and transaction data to Monad Games ID
export async function submitPlayerScore(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number = 1,
  sessionToken?: string,
  signMessage?: any
): Promise<ScoreSubmissionResponse> {
  try {
    // Get session token if not provided
    let validSessionToken: string = sessionToken || '';
    if (!validSessionToken) {
      const token = await getSessionToken(playerAddress, signMessage);
      if (!token) {
        return {
          success: false,
          error: 'Failed to authenticate. Please try again.',
        };
      }
      validSessionToken = token;
    }

    // Submit to Monad Games ID API
    const response = await fetch('https://monad-games-id-site.vercel.app/api/submit-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: 57, // Your game ID
        walletAddress: playerAddress,
        score: scoreAmount,
        transactions: transactionAmount,
        sessionToken: validSessionToken
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Score submitted successfully to Monad Games ID:', data);
      return {
        success: true,
        transactionHash: data.transactionHash,
        message: 'Score submitted successfully'
      };
    } else {
      throw new Error(data.message || 'Failed to submit score');
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get player's total data across all games
export async function getPlayerTotalData(playerAddress: string): Promise<PlayerDataResponse | null> {
  try {
    const response = await fetch(`/api/get-player-data?address=${encodeURIComponent(playerAddress)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting player data:', error);
    return null;
  }
}

// Get player's data for a specific game
export async function getPlayerGameData(
  playerAddress: string,
  gameAddress: string
): Promise<PlayerDataPerGameResponse | null> {
  try {
    const response = await fetch(
      `/api/get-player-data-per-game?playerAddress=${encodeURIComponent(playerAddress)}&gameAddress=${encodeURIComponent(gameAddress)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting player game data:', error);
    return null;
  }
}

// Helper to batch score submissions (avoid spamming the blockchain)
export class ScoreSubmissionManager {
  private playerAddress: string;
  private pendingScore: number = 0;
  private pendingTransactions: number = 0;
  private submitTimeout: NodeJS.Timeout | null = null;
  private readonly submitDelay = 5000; // 5 seconds delay before submission

  constructor(playerAddress: string) {
    this.playerAddress = playerAddress;
  }

  // Add score points (will be batched and submitted after delay)
  addScore(points: number) {
    this.pendingScore += points;
    this.scheduleSubmission();
  }

  // Add transaction count (will be batched and submitted after delay)
  addTransaction(count: number = 1) {
    this.pendingTransactions += count;
    this.scheduleSubmission();
  }

  // Submit immediately (bypasses batching)
  async submitImmediately(): Promise<ScoreSubmissionResponse> {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }

    const score = this.pendingScore;
    const transactions = this.pendingTransactions;

    // Reset pending amounts
    this.pendingScore = 0;
    this.pendingTransactions = 0;

    if (score === 0 && transactions === 0) {
      return { success: true, message: 'No pending data to submit' };
    }

    return submitPlayerScore(this.playerAddress, score, transactions);
  }

  // Schedule a delayed submission (batches multiple updates)
  private scheduleSubmission() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
    }

    this.submitTimeout = setTimeout(async () => {
      if (this.pendingScore > 0 || this.pendingTransactions > 0) {
        const result = await this.submitImmediately();
        if (!result.success) {
          console.error('Failed to submit score:', result.error);
        } else {
          console.log('Score submitted successfully:', result.transactionHash);
        }
      }
    }, this.submitDelay);
  }

  // Get current pending amounts
  getPendingData() {
    return {
      score: this.pendingScore,
      transactions: this.pendingTransactions,
    };
  }

  // Clean up timeouts
  destroy() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }
}

// Simple score manager for React environment
export class SimpleScoreManager {
  private playerAddress: string;
  private totalScore: number = 0;
  private totalTransactions: number = 0;

  constructor(playerAddress: string) {
    this.playerAddress = playerAddress;
  }

  // Add score points
  addScore(points: number) {
    this.totalScore += points;
    console.log(`Score added: ${points}, Total: ${this.totalScore}`);
  }

  // Add transaction count
  addTransaction(count: number = 1) {
    this.totalTransactions += count;
    console.log(`Transaction added: ${count}, Total: ${this.totalTransactions}`);
  }

  // Get current totals
  getTotals() {
    return {
      score: this.totalScore,
      transactions: this.totalTransactions,
    };
  }

  // Submit current totals (for manual submission)
  async submitTotals(signMessage?: any): Promise<ScoreSubmissionResponse> {
    if (this.totalScore === 0 && this.totalTransactions === 0) {
      return { success: true, message: 'No data to submit' };
    }

    const result = await submitPlayerScore(
      this.playerAddress,
      this.totalScore,
      this.totalTransactions,
      undefined,
      signMessage
    );

    if (result.success) {
      // Reset totals after successful submission
      this.totalScore = 0;
      this.totalTransactions = 0;
    }

    return result;
  }

  // Reset totals
  reset() {
    this.totalScore = 0;
    this.totalTransactions = 0;
  }
}