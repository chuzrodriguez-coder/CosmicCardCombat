import { useGameStore, getGunPowerCost, getBulletDamage, getBulletsPerShot, getFireInterval, MAX_GUN_LEVEL } from '@/lib/stores/useGameStore';

export default function ShopScreen() {
  const {
    round,
    totalPoints,
    gunPowerLevel,
    minCardsRequired,
    purchaseGunPower,
    lastRoundMaxPoints,
  } = useGameStore();

  const gunCost = getGunPowerCost(lastRoundMaxPoints, round);
  const canAfford = totalPoints >= gunCost;
  const maxedOut = gunPowerLevel >= MAX_GUN_LEVEL;

  const nextDamage = getBulletDamage(gunPowerLevel + 1);
  const nextBullets = getBulletsPerShot(gunPowerLevel + 1);
  const currentDamage = getBulletDamage(gunPowerLevel);
  const currentBullets = getBulletsPerShot(gunPowerLevel);

  const currentFireRate = (1 / getFireInterval(gunPowerLevel)).toFixed(1);
  const nextFireRate = (1 / getFireInterval(gunPowerLevel + 1)).toFixed(1);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,25,0.97)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: 'monospace',
      color: '#00FFFF',
      zIndex: 100,
    }}>
      <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
        <div style={{
          fontSize: 'clamp(20px, 4vw, 30px)',
          fontWeight: 'bold',
          letterSpacing: 4,
          textShadow: '0 0 20px #FFAA00',
          color: '#FFAA00',
          marginBottom: 4,
        }}>
          ⚙ UPGRADE SHOP
        </div>
        <div style={{ color: '#AAFFFF', fontSize: 13, marginBottom: 24 }}>
          Round {round} — Before the battle begins
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: 'rgba(0,20,50,0.6)',
          border: '1px solid #00FFFF22',
          borderRadius: 8,
          padding: '12px 20px',
          marginBottom: 16,
          fontSize: 15,
        }}>
          <span style={{ color: '#AAFFFF' }}>Available Points:</span>
          <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 20 }}>{totalPoints}</span>
        </div>

        <div style={{
          background: 'rgba(0,20,50,0.4)',
          border: '1px solid #FFAA0033',
          borderRadius: 6,
          padding: '8px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#FFCC88',
          textAlign: 'left',
        }}>
          Upgrade cost = max possible pts (prior round) × round number
          {' '}→ <strong style={{ color: '#FFD700' }}>{gunCost} pts</strong>
          {' '}<span style={{ color: '#888' }}>({lastRoundMaxPoints} × {round})</span>
        </div>

        <div style={{
          background: 'rgba(0,15,40,0.8)',
          border: `2px solid ${maxedOut ? '#44FF44' : canAfford ? '#FFAA00' : '#333'}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: '#FFAA00', fontWeight: 'bold', fontSize: 16 }}>⚡ GUN POWER</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Increases damage & fire rate</div>
            </div>
            <div style={{
              color: '#FFD700',
              fontSize: 20,
              fontWeight: 'bold',
              textShadow: '0 0 10px #FFD700',
            }}>
              Lv.{gunPowerLevel}/{MAX_GUN_LEVEL}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 13 }}>
            <StatRow label="Damage" current={`${currentDamage}`} next={maxedOut ? undefined : `${nextDamage}`} />
            <StatRow label="Bullets/Shot" current={`${currentBullets}`} next={maxedOut ? undefined : `${nextBullets}`} />
            <StatRow label="Fire Rate" current={`${currentFireRate}/s`} next={maxedOut ? undefined : `${nextFireRate}/s`} />
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ color: '#888', fontSize: 11 }}>Progress ({MAX_GUN_LEVEL} max)</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                {Array.from({ length: MAX_GUN_LEVEL }, (_, i) => (
                  <div key={i} style={{
                    flex: '0 0 auto',
                    width: `calc((100% - ${(MAX_GUN_LEVEL - 1) * 2}px) / ${MAX_GUN_LEVEL})`,
                    height: 7,
                    borderRadius: 2,
                    background: i < gunPowerLevel ? '#FFAA00' : '#333',
                    boxShadow: i < gunPowerLevel ? '0 0 3px #FFAA00' : 'none',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {!maxedOut && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255,100,0,0.1)', borderRadius: 6, fontSize: 12, color: '#FFAA88' }}>
              ⚠️ Upgrading raises the card target by 1 (currently {minCardsRequired} → {minCardsRequired + 1})
            </div>
          )}

          {maxedOut ? (
            <div style={{
              textAlign: 'center',
              color: '#44FF44',
              fontWeight: 'bold',
              fontSize: 15,
              padding: '12px',
              background: 'rgba(0,80,0,0.2)',
              borderRadius: 8,
            }}>
              ★ MAX LEVEL REACHED ★
            </div>
          ) : (
            <button
              onClick={purchaseGunPower}
              disabled={!canAfford}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 15,
                fontWeight: 'bold',
                fontFamily: 'monospace',
                background: canAfford
                  ? 'linear-gradient(135deg, #553300, #AA6600)'
                  : 'rgba(30,30,30,0.5)',
                border: `2px solid ${canAfford ? '#FFAA00' : '#444'}`,
                borderRadius: 8,
                color: canAfford ? '#FFD700' : '#555',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                letterSpacing: 2,
                textShadow: canAfford ? '0 0 8px #FFD700' : 'none',
                boxShadow: canAfford ? '0 0 16px #FFAA0044' : 'none',
              }}
            >
              UPGRADE — {gunCost} pts
            </button>
          )}
        </div>

        <button
          onClick={() => {
            useGameStore.getState().startRound();
          }}
          style={{
            fontSize: 17,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            padding: '13px 44px',
            background: 'linear-gradient(135deg, #003366, #006699)',
            border: '2px solid #00FFFF',
            borderRadius: 8,
            color: '#00FFFF',
            cursor: 'pointer',
            letterSpacing: 3,
            textShadow: '0 0 10px #00FFFF',
            boxShadow: '0 0 20px #00FFFF44',
          }}
          onMouseOver={e => (e.currentTarget.style.boxShadow = '0 0 35px #00FFFF88')}
          onMouseOut={e => (e.currentTarget.style.boxShadow = '0 0 20px #00FFFF44')}
        >
          ▶ START ROUND {round}
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, current, next }: { label: string; current: string; next?: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ color: '#888', fontSize: 11 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{current}</span>
        {next && (
          <>
            <span style={{ color: '#555', fontSize: 10 }}>→</span>
            <span style={{ color: '#44FF44', fontWeight: 'bold' }}>{next}</span>
          </>
        )}
      </div>
    </div>
  );
}
