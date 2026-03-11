import { useGameStore } from '@/lib/stores/useGameStore';
import MenuScreen from './MenuScreen';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import RoundSummary from './RoundSummary';
import ShopScreen from './ShopScreen';

export default function Game() {
  const phase = useGameStore(s => s.phase);
  const finishRound = useGameStore(s => s.finishRound);

  if (phase === 'menu') {
    return <MenuScreen />;
  }

  if (phase === 'roundSummary') {
    return <RoundSummary />;
  }

  if (phase === 'shop') {
    return <ShopScreen />;
  }

  if (phase === 'playing') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <GameCanvas onRoundEnd={finishRound} />
        <GameUI />
      </div>
    );
  }

  return null;
}
