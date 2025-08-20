import React, { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import * as THREE from 'three';
import './Game.css';

const Game = () => {
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const { user, logout } = usePrivy();
  
  // Get user info
  const getUsername = () => {
    if (user && user.linkedAccounts.length > 0) {
      const crossAppAccount = user.linkedAccounts.filter(
        account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42"
      )[0];
      return crossAppAccount ? crossAppAccount.username || 'Player' : 'Player';
    }
    return 'Player';
  };
  
  const getWalletAddress = () => {
    if (user && user.linkedAccounts.length > 0) {
      const crossAppAccount = user.linkedAccounts.filter(
        account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42"
      )[0];
      if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
        return crossAppAccount.embeddedWallets[0].address;
      }
    }
    return null;
  };

  useEffect(() => {
    // Initialize the game when component mounts
    if (gameContainerRef.current && !gameInstanceRef.current) {
      initializeGame();
    }

    // Cleanup when component unmounts
    return () => {
      if (gameInstanceRef.current) {
        // Clean up Three.js resources
        if (window.scene) {
          window.scene.clear();
        }
        if (window.renderer) {
          window.renderer.dispose();
        }
        gameInstanceRef.current = null;
      }
    };
  }, []);

  const initializeGame = () => {
    // Set up the game container
    const container = gameContainerRef.current;
    
    // Create score div
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    container.appendChild(scoreDiv);

    // Create splash screen
    const splashDiv = document.createElement('div');
    splashDiv.id = 'splash';
    splashDiv.innerHTML = `
      <div id="title">
        CROSS NAD ROAD<br/>BY XURRYDEP
      </div>
      <div id="loading">
        <div class="main letter">LOADING</div>
        <div class="period1 letter">.</div>
        <div class="period2 letter">.</div>
        <div class="period3 letter">.</div>
      </div>
      <div id="instructions">Use the arrow keys to move<br> around</div>
      <div id="play">
        PLAY
        <button id="pressPlay" disabled onclick="init()"></button>
      </div>
    `;
    container.appendChild(splashDiv);

    // Create restart button
    const restartButton = document.createElement('button');
    restartButton.id = 'restart';
    restartButton.textContent = 'Play Again';
    restartButton.onclick = () => window.init && window.init();
    container.appendChild(restartButton);

    // Load and execute the game script
    loadGameScript();
    
    gameInstanceRef.current = true;
  };

  const loadGameScript = () => {
    // Import the game logic from Game.js
    import('./Game.js').then(() => {
      // Initialize the game after script loads with a small delay to ensure DOM is ready
      setTimeout(() => {
        if (window.firstRun) {
          window.firstRun();
        }
      }, 100);
    }).catch(error => {
      console.error('Error loading game script:', error);
    });
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="game-wrapper"
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* User Info Panel */}
      <div className="user-info-panel">
        <div className="user-details">
          <span className="username">👤 {getUsername()}</span>
          <span className="wallet">💳 {getWalletAddress() ? `${getWalletAddress().slice(0, 6)}...${getWalletAddress().slice(-4)}` : 'No wallet'}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Çıkış Yap">
          🚪
        </button>
      </div>
     </div>
   );
};

export default Game;