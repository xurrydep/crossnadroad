# Claude AI Assistant Integration

## Project Overview
This is a Crossy Road-style 3D game built with Next.js, React, and THREE.js, integrated with Monad Games platform.

## App Information
- **App ID**: cmejvndcq00aojo0bokftrvxb
- **Monad Games ID**: cmd8euall0037le0my79qpz42

## Project Structure
```
yedek1/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main game page
│   ├── globals.css        # Global styles
│   ├── Leaderboard/       # Leaderboard component
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
│   ├── game.js           # Main game logic
│   ├── assets/           # Game assets (audio, fonts, images)
│   └── lib/              # External libraries (THREE.js, etc.)
├── cross-nad-road-react/ # Legacy React app
└── assets/               # Original game assets
```

## Key Features
- 3D Crossy Road-style gameplay
- Leaderboard integration with Monad Games
- Audio effects and background music
- Responsive design with Tailwind CSS
- TypeScript support

## Technologies Used
- **Frontend**: Next.js 15, React 19, TypeScript
- **3D Graphics**: THREE.js
- **Styling**: Tailwind CSS
- **Authentication**: Privy
- **Blockchain**: Viem (Ethereum interactions)

## Development Notes
- Game logic is contained in `public/game.js`
- External libraries are stored in `public/lib/`
- Assets are organized in `public/assets/`
- The app uses Next.js App Router for routing
- Integration with Monad Games platform for leaderboards

## File Integration
- Original game files from root directory have been integrated into Next.js structure
- Library files moved from `cross-nad-road-react/src/lib/external/` to `public/lib/`
- Assets copied to `public/assets/` for web accessibility
- Game initialization handled in `app/page.tsx` with proper script loading

## Dependencies
- three: 3D graphics library
- @types/three: TypeScript definitions for THREE.js
- sweetalert: Alert dialogs
- stats.js: Performance monitoring
- @privy-io/react-auth: Authentication
- viem: Ethereum library

## Running the Project
```bash
npm install
npm run dev
```

The game will be available at `http://localhost:3000`