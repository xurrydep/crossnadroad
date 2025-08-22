import crypto from 'crypto';

// Remove the problematic client-side API secret
const SERVER_API_SECRET = process.env.REACT_APP_API_SECRET;

if (!SERVER_API_SECRET) {
  console.warn('REACT_APP_API_SECRET environment variable is not set');
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a session-based token that includes player address and timestamp
export function generateSessionToken(playerAddress: string, timestamp: number): string {
  if (!SERVER_API_SECRET) {
    throw new Error('API_SECRET environment variable is required');
  }
  const data = `${playerAddress}-${timestamp}-${SERVER_API_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Validate session token with player address verification
export function validateSessionToken(token: string, playerAddress: string, timestampWindow: number = 300000): boolean {
  if (!SERVER_API_SECRET) {
    return false;
  }
  
  const now = Date.now();
  
  // Check tokens within the timestamp window (default 5 minutes)
  for (let i = 0; i < timestampWindow; i += 30000) { // Check every 30 seconds
    const timestamp = now - i;
    const expectedToken = generateSessionToken(playerAddress, Math.floor(timestamp / 30000) * 30000);
    if (token === expectedToken) {
      return true;
    }
  }
  
  return false;
}

// Legacy API key validation for internal server use only
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || !SERVER_API_SECRET) {
    return false;
  }

  // Only accept server-side API key
  return apiKey === SERVER_API_SECRET;
}

export function validateOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    'https://your-domain.com'
  ];
  
  return allowedOrigins.includes(origin);
}

// Client-side safe token generation for API requests
export function generateClientToken(playerAddress: string): string {
  const timestamp = Math.floor(Date.now() / 30000) * 30000;
  return btoa(`${playerAddress}-${timestamp}`);
}