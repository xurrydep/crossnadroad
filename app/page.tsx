'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export default function Home() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  useEffect(() => {
    if (scriptsLoaded && typeof window !== 'undefined') {
      // Initialize the game when scripts are loaded
      const initGame = () => {
        if (window.firstRun) {
          window.firstRun()
          setGameLoaded(true)
        }
      }

      // Small delay to ensure all scripts are properly loaded
      setTimeout(initGame, 100)
    }
  }, [scriptsLoaded])

  const handleScriptsLoad = () => {
    setScriptsLoaded(true)
  }

  const startGame = () => {
    if (window.init) {
      window.init()
    }
  }

  return (
    <>
      {/* Load Three.js and game dependencies */}
      <Script
        src="/lib/112.1/three.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/lib/112.1/GLTFLoader.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/lib/112.1/OrbitControls.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/lib/112.1/BufferGeometryUtils.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/lib/stats/stats.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/lib/sweetalert/sweetalert.min.js"
        strategy="beforeInteractive"
        onLoad={handleScriptsLoad}
      />
      
      {/* Load main game script */}
      {scriptsLoaded && (
        <Script
          src="/game.js"
          strategy="afterInteractive"
        />
      )}

      <main className="min-h-screen">
        <div id="score"></div>
        
        <div id="splash">
          <div id="title">
            CROSS NAD ROAD<br/>BY XURRYDEP
          </div>
          <div id="loading">
            <div className="main letter">LOADING</div>
            <div className="period1 letter">.</div>
            <div className="period2 letter">.</div>
            <div className="period3 letter">.</div>
          </div>
          <div id="instructions">
            Use the arrow keys to move<br/> around
          </div>
          <div id="play">
            PLAY
            <button id="pressPlay" disabled onClick={startGame}></button>
          </div>
        </div>
        
        <button id="restart" onClick={startGame} style={{visibility: 'hidden'}}>
          Play Again
        </button>
        
        <div ref={gameContainerRef} className="game-container" />
      </main>
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    firstRun: () => void
    init: () => void
    THREE: any
    Stats: any
    swal: any
  }
}