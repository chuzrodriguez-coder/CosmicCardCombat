# Card Blaster — Sci-Fi Card Shooter

A sci-fi themed 2D shoot-em-up where you pilot a spaceship and destroy flying playing cards.

## Architecture

- **Frontend**: React + TypeScript, rendered on HTML5 Canvas (no Three.js/WebGL)
- **Backend**: Express.js server serving the Vite-built frontend
- **State**: Zustand stores

## Key Files

### Game Components (`client/src/components/game/`)
- `Game.tsx` — Phase orchestrator (menu / playing / roundSummary / shop)
- `GameCanvas.tsx` — Main game loop and canvas renderer
- `GameUI.tsx` — HUD overlay (round, points, destroyed count, gun power)
- `MenuScreen.tsx` — Animated start screen with star field
- `RoundSummary.tsx` — Post-round card collection display
- `ShopScreen.tsx` — Between-round upgrade shop
- `cardData.ts` — Card definitions, HP/speed scaling per round
- `types.ts` — Shared TypeScript interfaces

### Stores (`client/src/lib/stores/`)
- `useGameStore.tsx` — Main game state (round, points, cards, gun level, phase)
- `useAudio.tsx` — Sound management

## Game Mechanics

- **Cards**: Standard 52-card deck + Joker boss, 150 cards per round
- **Difficulty**: HP and speed scale by round × multiplier
- **Rank → HP**: Higher rank = more HP. Joker = boss with ~30+ HP
- **Points**: Each destroyed card grants its rank value in points
- **Win Condition**: Destroy ≥ 25 cards (increases by 1 per gun upgrade)
- **Joker**: Spawns after all other cards cleared, has delayed entry
- **Upgrades**: Gun Power (up to level 5): increases damage, bullets/shot, fire rate

## Controls

- **Mouse/Touch**: Click/hold anywhere to aim and fire
- **WASD / Arrow Keys**: Move ship left/right

## Sounds
- `background.mp3` — looping background music
- `hit.mp3` — bullet impact
- `success.mp3` — round complete
