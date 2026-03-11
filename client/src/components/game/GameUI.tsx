import { useGameStore, MAX_GUN_LEVEL } from '@/lib/stores/useGameStore';
import { useAudio } from '@/lib/stores/useAudio';

export default function GameUI() {
  const {
    round,
    totalPoints,
    roundPoints,
    destroyedCount,
    minCardsRequired,
    gunPowerLevel,
    gamertag,
    restartGame,
  } = useGameStore();
  const { isMuted, toggleMute } = useAudio();

  const progress = Math.min(1, destroyedCount / minCardsRequired);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        pointerEvents: 'none',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,30,0.85), transparent)',
      }}>
        <div style={{ color: '#00FFFF', fontFamily: 'monospace', fontSize: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', textShadow: '0 0 8px #00FFFF' }}>
            ROUND {round}
          </div>
          <div style={{ color: '#AAFFFF', marginTop: 2 }}>
            Points: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{roundPoints}</span>
          </div>
          <div style={{ color: '#AAFFFF' }}>
            Bank: <span style={{ color: '#FFD700' }}>{totalPoints}</span>
          </div>
          {gamertag && (
            <div style={{ color: '#44FF88', fontSize: 11, marginTop: 2 }}>
              [{gamertag}]
            </div>
          )}
          <button
            onClick={() => restartGame()}
            style={{
              pointerEvents: 'auto',
              marginTop: 8,
              background: 'rgba(30,0,0,0.85)',
              border: '1px solid #FF444466',
              color: '#FF8888',
              fontFamily: 'monospace',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              letterSpacing: 1,
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#FF4444')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#FF444466')}
          >
            ⌂ HOME
          </button>
        </div>

        <div style={{ textAlign: 'center', color: '#00FFFF', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ marginBottom: 4, color: '#AAFFFF' }}>
            Cards Destroyed: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{destroyedCount}</span>
            <span style={{ color: '#888' }}> / {minCardsRequired} req</span>
          </div>
          <div style={{
            width: 180,
            height: 10,
            background: '#111',
            borderRadius: 5,
            border: '1px solid #00FFFF44',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: progress >= 1
                ? 'linear-gradient(to right, #44FF44, #00FF88)'
                : 'linear-gradient(to right, #00AAFF, #00FFFF)',
              borderRadius: 5,
              transition: 'width 0.3s',
              boxShadow: '0 0 6px #00FFFF',
            }} />
          </div>
        </div>

        <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ color: '#FFAA00', marginBottom: 4 }}>
            GUN PWR: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
              Lv.{gunPowerLevel}/{MAX_GUN_LEVEL}
            </span>
          </div>
          <button
            onClick={toggleMute}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(0,30,60,0.8)',
              border: '1px solid #00FFFF44',
              color: '#00FFFF',
              fontFamily: 'monospace',
              fontSize: 12,
              padding: '3px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇 MUTED' : '🔊 SOUND'}
          </button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(0,255,255,0.45)',
        fontFamily: 'monospace',
        fontSize: 11,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        TAP/HOLD to aim & shoot · WASD/Arrows to move
      </div>
    </div>
  );
}
