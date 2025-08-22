import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Game from './Game.jsx';
import PrivyProvider from './components/PrivyProvider.tsx';
import AuthComponent from './components/AuthComponent.tsx';
import { useMonadGamesUser } from './hooks/useMonadGamesUser';
import { SimpleScoreManager } from './lib/score-api';
import './App.css';
import './Game.css';

function GameWithAuth() {
  const { authenticated, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState('');
  const [scoreManager, setScoreManager] = useState(null);
  const { user: monadUser, hasUsername, isLoading } = useMonadGamesUser(accountAddress);

  useEffect(() => {
    if (accountAddress) {
      // Make wallet address available globally for Game.js
      window.getWalletAddress = () => accountAddress;
      
      // Initialize score manager
      const manager = new SimpleScoreManager(accountAddress);
      setScoreManager(manager);
      window.scoreManager = manager;
      
      return () => {
        // Cleanup
        if (window.scoreManager) {
          delete window.scoreManager;
        }
      };
    }
  }, [accountAddress]);

  const handleAddressChange = (address) => {
    setAccountAddress(address);
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

  if (!hasUsername && accountAddress && !isLoading) {
    return (
      <div className="username-screen">
        <div className="username-container">
          <h1>Username Required</h1>
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
            className="logout-button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <AuthComponent onAddressChange={handleAddressChange} />
      </div>
      <Game />
    </div>
  );
}

function App() {
  return (
    <PrivyProvider>
      <GameWithAuth />
    </PrivyProvider>
  );
}

export default App;
