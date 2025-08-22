import { createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { GAME_CONTRACT_ABI } from './contract-abi';

// Contract configuration
export const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4' as const;

// Export the ABI for use in other files
export const CONTRACT_ABI = GAME_CONTRACT_ABI;

// Create public client for reading contract data
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http()
});

// Helper function to validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to get player data from contract (global totals)
export async function getPlayerData(playerAddress: string) {
  if (!isValidAddress(playerAddress)) {
    throw new Error('Invalid player address');
  }

  try {
    const [totalScore, totalTransactions] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalScoreOfPlayer',
        args: [playerAddress as `0x${string}`]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalTransactionsOfPlayer',
        args: [playerAddress as `0x${string}`]
      })
    ]);

    return {
      totalScore,
      totalTransactions
    };
  } catch (error) {
    console.error('Error reading player data:', error);
    throw new Error('Failed to read player data from contract');
  }
}

// Helper function to get game data from contract
export async function getGameData(gameAddress: string) {
  if (!isValidAddress(gameAddress)) {
    throw new Error('Invalid game address');
  }

  try {
    const gameData = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'games',
      args: [gameAddress as `0x${string}`]
    });

    return gameData;
  } catch (error) {
    console.error('Error reading game data:', error);
    throw new Error('Failed to read game data from contract');
  }
}

// Helper function to check if a game is registered
export async function isGameRegistered(gameAddress: string): Promise<boolean> {
  try {
    const gameData = await getGameData(gameAddress);
    return gameData !== null && gameData !== undefined;
  } catch {
    return false;
  }
}