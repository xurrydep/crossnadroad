import React, { useState, useEffect } from 'react';
import { PrivyProvider, usePrivy, CrossAppAccountWithMetadata } from '@privy-io/react-auth';
import Game from './Game.jsx';
import './App.css';
import './Game.css';

function GameWithAuth() {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState('');
  const [username, setUsername] = useState('');
  const [hasUsername, setHasUsername] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID
        const crossAppAccount = user.linkedAccounts.filter(
          account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42"
        )[0];

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
          const walletAddress = crossAppAccount.embeddedWallets[0].address;
          setAccountAddress(walletAddress);
          
          // Make wallet address available globally for Game.js
          window.getWalletAddress = () => walletAddress;
          
          // Check username
          checkUsername(walletAddress);
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    }
  }, [authenticated, user, ready]);

  const checkUsername = async (walletAddress) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.hasUsername) {
        setHasUsername(true);
        setUsername(data.user.username);
        setMessage(`Welcome back, ${data.user.username}!`);
      } else {
        setHasUsername(false);
        setMessage("You haven't reserved a username yet.");
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setMessage('Error checking username. Please try again.');
    }
    setIsLoading(false);
  };

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="home-screen">
        <div className="home-container">
          <div className="title-section">
            <h1 className="game-title">CROSS NAD ROAD</h1>
            <h2 className="game-subtitle">BY XURRYDEP</h2>
            <img 
              src="/assets/images/character-icon.svg" 
              alt="Character Icon" 
              className="character-icon"
            />
          </div>
          
          <div className="instructions-section">
            <div className="game-instructions">
              <p>Use the arrow keys to move around.</p>
              <p>Cross as many roads as possible.</p>
              <p>because Monad has 10,000 TPS.</p>
            </div>
            
            <div className="login-section">
              <button className="auth-button" onClick={login}>
                Sign in with Monad Games ID
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasUsername && accountAddress) {
    return (
      <div className="username-screen">
        <div className="username-container">
          <h1>Username Required</h1>
          <p>{message}</p>
          <p>Please register a username to continue playing.</p>
          <a 
            href="https://monad-games-id-site.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="username-button"
          >
            Register Username
          </a>
          <button 
            className="refresh-button"
            onClick={() => checkUsername(accountAddress)}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Refresh'}
          </button>
          <button 
            className="logout-button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="home-screen">
        <div className="home-container">
          <button 
            className="play-button"
            onClick={() => setGameStarted(true)}
          >
            PLAY
          </button>
          
          <div className="user-info">
            <span>Welcome, {username}!</span>
            <span>Wallet: {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}</span>
            <button className="logout-button" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <Game />
    </div>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID || ""}
      config={{
        loginMethodsAndOrder: {
          primary: ['privy:cmd8euall0037le0my79qpz42'],
        },
        appearance: {
          theme: 'dark',
          accentColor: '#8a2be2',
        },
      }}
    >
      <GameWithAuth />
    </PrivyProvider>
  );
}

export default App;
