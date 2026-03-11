import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/stores/useGameStore';
import { useAudio } from '@/lib/stores/useAudio';

const GAMERTAG_RE = /^[A-Za-z0-9_-]{3,20}$/;

export default function MenuScreen() {
  const {
    startGame, resumeGame, loadPlayer, setGamertag,
    gamertag, totalPoints, round, gunPowerLevel,
  } = useGameStore();
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute, isMuted } = useAudio();
  const bgRef = useRef<HTMLAudioElement | null>(null);

  const [tagInput, setTagInput] = useState(gamertag || '');
  const [tagStatus, setTagStatus] = useState<'idle' | 'loading' | 'found' | 'new' | 'invalid'>('idle');
  const [savedData, setSavedData] = useState<{ totalPoints: number; round: number; gunPowerLevel: number } | null>(null);

  useEffect(() => {
    const bg = new Audio('/sounds/background.mp3');
    bg.loop = true;
    bg.volume = 0.4;
    bgRef.current = bg;
    setBackgroundMusic(bg);

    const hit = new Audio('/sounds/hit.mp3');
    hit.volume = 0.3;
    setHitSound(hit);

    const success = new Audio('/sounds/success.mp3');
    success.volume = 0.6;
    setSuccessSound(success);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  const handleLookup = async () => {
    const tag = tagInput.trim();
    if (!GAMERTAG_RE.test(tag)) {
      setTagStatus('invalid');
      return;
    }
    setTagStatus('loading');
    const found = await loadPlayer(tag);
    if (found) {
      const state = useGameStore.getState();
      setSavedData({ totalPoints: state.totalPoints, round: state.round, gunPowerLevel: state.gunPowerLevel });
      setTagStatus('found');
    } else {
      setGamertag(tag.toLowerCase());
      setSavedData(null);
      setTagStatus('new');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleStart = () => {
    if (!isMuted && bgRef.current) bgRef.current.play().catch(() => {});
    if (tagStatus === 'found') {
      resumeGame();
    } else {
      startGame();
    }
  };

  const handleToggleSound = () => {
    toggleMute();
    const { isMuted: nowMuted } = useAudio.getState();
    if (!nowMuted && bgRef.current) {
      bgRef.current.play().catch(() => {});
    } else if (bgRef.current) {
      bgRef.current.pause();
    }
  };

  const tagValid = GAMERTAG_RE.test(tagInput.trim());
  const canLaunch = tagStatus !== 'loading';
  const isReturning = tagStatus === 'found' && savedData;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #050025 0%, #000008 100%)',
      fontFamily: 'monospace',
      color: '#00FFFF',
      userSelect: 'none',
      overflow: 'hidden',
    }}>
      <StarField />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px', maxWidth: 480, width: '100%' }}>
        <div style={{
          fontSize: 'clamp(28px, 6vw, 56px)',
          fontWeight: 'bold',
          textShadow: '0 0 20px #00FFFF, 0 0 40px #0088FF',
          letterSpacing: 4,
          marginBottom: 8,
          animation: 'pulse 2s ease-in-out infinite alternate',
        }}>
          CARD BLASTER
        </div>
        <div style={{
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          color: '#AAFFFF',
          letterSpacing: 2,
          marginBottom: 28,
          textShadow: '0 0 10px #00FFFF',
        }}>
          SCI-FI CARD SHOOTER
        </div>

        <div style={{
          background: 'rgba(0,10,40,0.9)',
          border: '1px solid #00FFFF44',
          borderRadius: 12,
          padding: '18px 24px',
          marginBottom: 20,
        }}>
          <div style={{ color: '#AAFFFF', fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>
            ENTER GAMERTAG TO SAVE YOUR PROGRESS
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={tagInput}
              onChange={e => { setTagInput(e.target.value); setTagStatus('idle'); setSavedData(null); }}
              onKeyDown={handleTagKeyDown}
              placeholder="e.g. StarPilot99"
              maxLength={20}
              style={{
                flex: 1,
                background: 'rgba(0,20,60,0.9)',
                border: `1px solid ${tagStatus === 'invalid' ? '#FF4444' : tagStatus === 'found' ? '#44FF88' : '#00FFFF55'}`,
                borderRadius: 6,
                color: '#00FFFF',
                fontFamily: 'monospace',
                fontSize: 15,
                padding: '8px 12px',
                outline: 'none',
                letterSpacing: 1,
              }}
            />
            <button
              onClick={handleLookup}
              disabled={!tagValid || tagStatus === 'loading'}
              style={{
                background: tagValid ? 'rgba(0,50,100,0.9)' : 'rgba(0,20,40,0.5)',
                border: `1px solid ${tagValid ? '#00FFFF88' : '#00FFFF22'}`,
                borderRadius: 6,
                color: tagValid ? '#00FFFF' : '#00FFFF44',
                fontFamily: 'monospace',
                fontSize: 13,
                padding: '8px 16px',
                cursor: tagValid ? 'pointer' : 'default',
                letterSpacing: 1,
              }}
            >
              {tagStatus === 'loading' ? '...' : 'FIND'}
            </button>
          </div>

          {tagStatus === 'found' && savedData && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(0,60,30,0.6)',
              border: '1px solid #44FF8866',
              borderRadius: 8,
              fontSize: 13,
              color: '#AAFFFF',
              textAlign: 'left',
            }}>
              <div style={{ color: '#44FF88', fontWeight: 'bold', marginBottom: 6 }}>
                ✓ PILOT FOUND — RESUMING PROGRESS
              </div>
              <div>Round: <span style={{ color: '#FFD700' }}>{savedData.round}</span></div>
              <div>Banked Points: <span style={{ color: '#FFD700' }}>{savedData.totalPoints}</span></div>
              <div>Gun Level: <span style={{ color: '#FFD700' }}>Lv.{savedData.gunPowerLevel}</span></div>
            </div>
          )}

          {tagStatus === 'new' && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              background: 'rgba(0,30,60,0.6)',
              border: '1px solid #00FFFF33',
              borderRadius: 8,
              fontSize: 13,
              color: '#AAFFFF',
            }}>
              New pilot — your progress will be saved under <span style={{ color: '#FFD700' }}>"{tagInput.trim().toLowerCase()}"</span>
            </div>
          )}

          {tagStatus === 'invalid' && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#FF8888' }}>
              Gamertag must be 3–20 characters (letters, numbers, _ or -)
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(0,20,50,0.8)',
          border: '1px solid #00FFFF44',
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 24,
          textAlign: 'left',
          fontSize: 12,
          lineHeight: 1.7,
          color: '#AAFFFF',
        }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold', marginBottom: 8, fontSize: 14 }}>HOW TO PLAY</div>
          <div>🚀 Your ship sits at the bottom</div>
          <div>🎯 Tap/hold to aim & shoot cards</div>
          <div>🃏 Destroy cards to collect them</div>
          <div>📈 Higher rank = harder to destroy = more points</div>
          <div>👹 <span style={{ color: '#FFD700' }}>JOKER</span> is the boss — appears last!</div>
          <div>✅ Destroy at least <span style={{ color: '#44FF44' }}>25 cards</span> to advance</div>
          <div>💰 Spend points on <span style={{ color: '#FFAA00' }}>gun upgrades</span></div>
          <div>⬅️➡️ Arrow/WASD to move ship</div>
        </div>

        <button
          onClick={handleStart}
          disabled={!canLaunch}
          style={{
            fontSize: 'clamp(16px, 3vw, 22px)',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            padding: '14px 48px',
            background: isReturning
              ? 'linear-gradient(135deg, #003322, #006644)'
              : 'linear-gradient(135deg, #003366, #006699)',
            border: `2px solid ${isReturning ? '#44FF88' : '#00FFFF'}`,
            borderRadius: 8,
            color: isReturning ? '#44FF88' : '#00FFFF',
            cursor: 'pointer',
            letterSpacing: 3,
            textShadow: `0 0 10px ${isReturning ? '#44FF88' : '#00FFFF'}`,
            boxShadow: `0 0 20px ${isReturning ? '#44FF8844' : '#00FFFF44'}`,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.boxShadow = `0 0 35px ${isReturning ? '#44FF8888' : '#00FFFF88'}`)}
          onMouseOut={e => (e.currentTarget.style.boxShadow = `0 0 20px ${isReturning ? '#44FF8844' : '#00FFFF44'}`)}
        >
          {isReturning ? '▶ CONTINUE' : '▶ LAUNCH'}
        </button>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleToggleSound}
            style={{
              background: 'transparent',
              border: '1px solid #00FFFF33',
              borderRadius: 6,
              color: '#00FFFF88',
              fontFamily: 'monospace',
              fontSize: 13,
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          from { text-shadow: 0 0 20px #00FFFF, 0 0 40px #0088FF; }
          to { text-shadow: 0 0 30px #00FFFF, 0 0 60px #0088FF, 0 0 80px #0044AA; }
        }
        input::placeholder { color: #00FFFF44; }
        input:focus { border-color: #00FFFF88 !important; }
      `}</style>
    </div>
  );
}

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 30 + 10,
      b: Math.random() * 0.7 + 0.3,
    }));

    let animId = 0;
    let last = performance.now();

    function draw(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > canvas!.height) { s.y = 0; s.x = Math.random() * canvas!.width; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.b})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  );
}
