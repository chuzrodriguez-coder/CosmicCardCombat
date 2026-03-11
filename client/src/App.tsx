import Game from './components/game/Game';
import '@fontsource/inter';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Game />
    </div>
  );
}
