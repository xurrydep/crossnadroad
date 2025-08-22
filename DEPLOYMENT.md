# Deployment Guide

## Project Information
- **App ID**: cmejvndcq00aojo0bokftrvxb
- **Monad Games ID**: cmd8euall0037le0my79qpz42
- **Project Name**: Mission7 Crossy Road Game

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

## Local Development Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd yedek1
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Monad Games Configuration
NEXT_PUBLIC_APP_ID=cmejvndcq00aojo0bokftrvxb
NEXT_PUBLIC_MONAD_GAMES_ID=cmd8euall0037le0my79qpz42

# Privy Configuration (if needed)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Development
NODE_ENV=development
```

### 3. Run Development Server
```bash
npm run dev
```
Access the game at `http://localhost:3000`

## Production Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy to Vercel**
```bash
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
- Go to your project settings in Vercel
- Add the environment variables from `.env.local`

### Alternative: Manual Build

1. **Build the Project**
```bash
npm run build
```

2. **Start Production Server**
```bash
npm start
```

## File Structure for Deployment

### Critical Files
- `app/` - Next.js App Router pages and components
- `public/` - Static assets (game.js, assets/, lib/)
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration (if exists)
- `tsconfig.json` - TypeScript configuration

### Assets Organization
- `public/game.js` - Main game logic
- `public/assets/` - Game assets (audio, fonts, images)
- `public/lib/` - External libraries (THREE.js, stats, etc.)

## Performance Optimization

### 1. Asset Optimization
- Compress audio files in `public/assets/audio/`
- Optimize images in `public/assets/images/`
- Minify JavaScript libraries if not already minified

### 2. Next.js Optimizations
- Enable static generation where possible
- Use Next.js Image component for images
- Implement proper caching headers

### 3. THREE.js Optimizations
- Use compressed texture formats
- Implement LOD (Level of Detail) for 3D models
- Optimize geometry and materials

## Monitoring and Analytics

### Performance Monitoring
- stats.js is included for FPS monitoring
- Consider adding Web Vitals tracking
- Monitor bundle size with Next.js analyzer

### Error Tracking
- Implement error boundaries in React components
- Add logging for game events
- Monitor API calls to Monad Games

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Validate all user inputs

### Content Security Policy
- Configure CSP headers for THREE.js and external scripts
- Whitelist necessary domains for assets

## Troubleshooting

### Common Issues

1. **THREE.js Loading Issues**
   - Ensure all library files are in `public/lib/`
   - Check script loading order in `app/page.tsx`

2. **Asset Loading Problems**
   - Verify asset paths are relative to `public/`
   - Check file permissions and accessibility

3. **Build Failures**
   - Clear `.next` directory and rebuild
   - Check TypeScript errors
   - Verify all dependencies are installed

### Debug Commands
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Analyze bundle size
npm run build && npx @next/bundle-analyzer
```

## Deployment Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Assets properly organized in `public/`
- [ ] Game loads and runs correctly
- [ ] Leaderboard integration working
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Monitoring configured

## Support

For deployment issues:
1. Check the console for JavaScript errors
2. Verify all assets are loading correctly
3. Test game functionality thoroughly
4. Monitor performance metrics

## Version History

- **v1.0.0** - Initial deployment with Next.js integration
- Game files migrated from standalone HTML to Next.js App Router
- THREE.js libraries organized in public directory
- Monad Games integration configured