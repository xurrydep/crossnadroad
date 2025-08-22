// Mock API endpoint for session token
// This is a client-side mock - in production, this should be a real backend API

if (typeof window !== 'undefined') {
  // Client-side mock response
  const mockResponse = {
    success: true,
    sessionToken: 'mock_session_token_' + Date.now(),
    expiresAt: Date.now() + 300000 // 5 minutes
  };
  
  // Return mock response
  console.log('Mock session token response:', mockResponse);
}