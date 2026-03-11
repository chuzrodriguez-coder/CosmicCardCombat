import { useGameStore } from '@/lib/stores/useGameStore';
import { useAudio } from '@/lib/stores/useAudio';
import { useEffect } from 'react';
import type { CollectedCard } from '@/lib/stores/useGameStore';

export default function RoundSummary() {
  const {
    round,
    roundPoints,
    totalPoints,
    collectedCards,
    destroyedCount,
    minCardsRequired,
    nextRound,
    repeatRound,
  } = useGameStore();
  const { playSuccess } = useAudio();

  const passed = destroyedCount >= minCardsRequired;

  useEffect(() => {
    if (passed) playSuccess();
  }, [passed, playSuccess]);

  const sorted = [...collectedCards].sort((a, b) => {
    const aVal = a.rank === 'joker' ? 100 : (a.rank as number);
    const bVal = b.rank === 'joker' ? 100 : (b.rank as number);
    return bVal - aVal;
  });

  const getSuitColor = (card: CollectedCard) => {
    if (!card.suit) return '#FFD700';
    return card.suit === 'hearts' || card.suit === 'diamonds' ? '#FF5555' : '#CCCCFF';
  };

  const totalCardPoints = sorted.reduce((sum, c) => sum + c.pointValue * c.count, 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,20,0.96)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '20px 16px',
      fontFamily: 'monospace',
      color: '#00FFFF',
      overflowY: 'auto',
      zIndex: 100,
    }}>
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <div style={{
          fontSize: 'clamp(20px, 4vw, 32px)',
          fontWeight: 'bold',
          textShadow: passed ? '0 0 20px #44FF44' : '0 0 20px #FF4444',
          color: passed ? '#44FF44' : '#FF6644',
          marginBottom: 6,
          letterSpacing: 3,
        }}>
          {passed ? '✓ ROUND COMPLETE' : '✗ ROUND FAILED'}
        </div>

        <div style={{ color: '#AAFFFF', fontSize: 13, marginBottom: 20 }}>
          Round {round} · Destroyed: <strong style={{ color: '#FFF' }}>{destroyedCount}</strong>
          {' '}/ Required: <strong style={{ color: destroyedCount >= minCardsRequired ? '#44FF44' : '#FF6644' }}>{minCardsRequired}</strong>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 20,
        }}>
          <StatBox label="Cards Collected" value={destroyedCount.toString()} color="#00FFFF" />
          <StatBox label="Round Points" value={`+${roundPoints}`} color="#FFD700" />
          <StatBox label="Total Bank" value={totalPoints.toString()} color="#FFAA00" />
          <StatBox label="Unique Cards" value={sorted.length.toString()} color="#AA88FF" />
        </div>

        {sorted.length > 0 && (
          <div style={{
            background: 'rgba(0,15,40,0.8)',
            border: '1px solid #00FFFF22',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
            textAlign: 'left',
          }}>
            <div style={{ color: '#AAFFFF', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>
              CARDS OBTAINED (by rank)
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 6,
            }}>
              {sorted.map((card, i) => (
                <CardChip key={i} card={card} color={getSuitColor(card)} />
              ))}
            </div>
            <div style={{
              marginTop: 12,
              textAlign: 'right',
              color: '#FFD700',
              fontSize: 13,
            }}>
              Total card points: <strong>{totalCardPoints}</strong>
            </div>
          </div>
        )}

        {!passed && (
          <div style={{
            background: 'rgba(50,10,10,0.6)',
            border: '1px solid #FF444433',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            color: '#FF9988',
            fontSize: 13,
          }}>
            You needed to destroy {minCardsRequired} cards but only got {destroyedCount}.
            Replay the round to advance!
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {passed ? (
            <ActionButton
              onClick={nextRound}
              color="#00FFFF"
              bg="linear-gradient(135deg, #003366, #006699)"
            >
              NEXT ROUND →
            </ActionButton>
          ) : null}
          <ActionButton
            onClick={repeatRound}
            color={passed ? '#FFAA00' : '#00FFFF'}
            bg={passed
              ? 'linear-gradient(135deg, #332200, #664400)'
              : 'linear-gradient(135deg, #003366, #006699)'
            }
          >
            {passed ? 'REPLAY ROUND' : 'TRY AGAIN'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(0,20,50,0.6)',
      border: `1px solid ${color}33`,
      borderRadius: 8,
      padding: '10px 12px',
      textAlign: 'center',
    }}>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 'bold', textShadow: `0 0 10px ${color}` }}>
        {value}
      </div>
    </div>
  );
}

function CardChip({ card, color }: { card: CollectedCard; color: string }) {
  return (
    <div style={{
      background: '#F5F0E8',
      border: `2px solid ${color}`,
      borderRadius: 5,
      padding: '4px 5px',
      textAlign: 'center',
      color,
      fontSize: 13,
      fontWeight: 'bold',
      position: 'relative',
    }}>
      <div>{card.label}</div>
      <div style={{ fontSize: 10, color: '#999999', fontWeight: 'normal' }}>{card.pointValue}pt</div>
      {card.count > 1 && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          background: '#FFD700',
          color: '#000',
          borderRadius: '50%',
          width: 16,
          height: 16,
          fontSize: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}>
          {card.count}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick, color, bg, children
}: {
  onClick: () => void;
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        padding: '12px 32px',
        background: bg,
        border: `2px solid ${color}`,
        borderRadius: 8,
        color,
        cursor: 'pointer',
        letterSpacing: 2,
        textShadow: `0 0 8px ${color}`,
        boxShadow: `0 0 16px ${color}44`,
      }}
      onMouseOver={e => (e.currentTarget.style.boxShadow = `0 0 28px ${color}88`)}
      onMouseOut={e => (e.currentTarget.style.boxShadow = `0 0 16px ${color}44`)}
    >
      {children}
    </button>
  );
}
