import { useRef, useEffect, useCallback } from 'react';
import { useGameStore, getBulletDamage, getBulletsPerShot, getFireInterval } from '@/lib/stores/useGameStore';
import { generateRoundCardQueue, getCardHp, getCardSpeed, getCardPoints, getSuitColor } from './cardData';
import type { EnemyCard, Bullet, Explosion, Star, Nebula, Saucer, FloatingText } from './types';

let CANVAS_W = 0;
let CANVAS_H = 0;
const TOTAL_CARDS = 75;
const SHIP_W = 60;
const CARD_W = 54;
const CARD_H = 76;
const BULLET_SPEED = 520;
const CARD_SPAWN_INTERVAL = 1.8;
const BOSS_SPAWN_DELAY = 3.0;
const SPIN_SPEED = Math.PI / 5;
const SAUCER_ORBIT_RADIUS = 55;
const SAUCER_SIZE = 10;
const SAUCER_ORBIT_SPEED = 1.4;

const JWST_IMAGES = [
  '/images/jwst/carina.jpg',
  '/images/jwst/deep_field.jpg',
  '/images/jwst/pillars.jpg',
  '/images/jwst/stephan.jpg',
  '/images/jwst/southern_ring.jpg',
];

let idCounter = 0;
function uid() { return `e${++idCounter}`; }

function getSaucerCount(rank: EnemyCard['def']['rank']): number {
  if (rank === 'joker') return 10;
  if (rank === 14) return 4;
  if (rank === 13) return 3;
  if (rank === 12) return 6;
  return 0;
}

function createSaucers(rank: EnemyCard['def']['rank']): Saucer[] {
  const count = getSaucerCount(rank);
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    id: uid(),
    orbitAngle: (i / count) * Math.PI * 2,
    orbitSpeed: SAUCER_ORBIT_SPEED * (Math.random() > 0.5 ? 1 : -1),
    destroyed: false,
    size: SAUCER_SIZE,
  }));
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() * 1.8 + 0.2,
      speed: Math.random() * 30 + 15,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
}

function generateNebulae(): Nebula[] {
  const colors = ['#3a0a6e', '#0a1a6e', '#6e0a3a'];
  const nebulae: Nebula[] = [];
  for (let i = 0; i < 3; i++) {
    nebulae.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      radius: Math.random() * 150 + 80,
      color: colors[i % colors.length],
      alpha: Math.random() * 0.12 + 0.04,
      speedY: Math.random() * 6 + 3,
    });
  }
  return nebulae;
}

interface GameState {
  shipX: number;
  shipVx: number;
  bullets: Bullet[];
  enemies: EnemyCard[];
  explosions: Explosion[];
  floatingTexts: FloatingText[];
  stars: Star[];
  nebulae: Nebula[];
  cardQueue: ReturnType<typeof generateRoundCardQueue>;
  cardQueueIndex: number;
  spawnTimer: number;
  autoFireTimer: number;
  aimX: number;
  aimY: number;
  touchActive: boolean;
  gameOver: boolean;
  allCardsSpawned: boolean;
  bossSpawned: boolean;
  bossDelay: number;
  bgImageIndex: number;
}

interface Props {
  onRoundEnd: () => void;
}

export default function GameCanvas({ onRoundEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const jwstImagesRef = useRef<HTMLImageElement[]>([]);

  const {
    round,
    gunPowerLevel,
    collectCard,
    addRoundPoints,
    incrementDestroyed,
    incrementEscaped,
    incrementTotal,
    finishRound,
    setLastRoundMaxPoints,
  } = useGameStore();

  useEffect(() => {
    JWST_IMAGES.forEach((src, i) => {
      const img = new Image();
      img.onload = () => { jwstImagesRef.current[i] = img; };
      img.onerror = () => console.warn('JWST image failed to load:', src);
      img.src = src;
    });
  }, []);

  const initState = useCallback((): GameState => {
    const queue = generateRoundCardQueue(round, TOTAL_CARDS);
    const maxPts = queue.reduce((sum, c) => sum + c.pointValue, 0);
    setLastRoundMaxPoints(maxPts);

    return {
      shipX: CANVAS_W / 2,
      shipVx: 0,
      bullets: [],
      enemies: [],
      explosions: [],
      floatingTexts: [],
      stars: generateStars(),
      nebulae: generateNebulae(),
      cardQueue: queue,
      cardQueueIndex: 0,
      spawnTimer: 0,
      autoFireTimer: 0,
      aimX: CANVAS_W / 2,
      aimY: CANVAS_H / 2,
      touchActive: false,
      gameOver: false,
      allCardsSpawned: false,
      bossSpawned: false,
      bossDelay: 0,
      bgImageIndex: (round - 1) % JWST_IMAGES.length,
    };
  }, [round, setLastRoundMaxPoints]);

  const spawnCard = useCallback((state: GameState) => {
    const { cardQueue, cardQueueIndex, bossSpawned } = state;
    if (cardQueueIndex >= cardQueue.length) return;

    const def = cardQueue[cardQueueIndex];
    if (def.rank === 'joker') {
      if (bossSpawned) return;
      state.bossSpawned = true;
    }

    const hp = getCardHp(def, round, cardQueueIndex);
    const speed = getCardSpeed(def, round);
    const isBoss = def.rank === 'joker';
    const scale = isBoss ? 1.8 : 1.0;
    const w = CARD_W * scale;
    const h = CARD_H * scale;

    const spinDir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const initialSpinTimer = 1.5 + Math.random() * 3.5;

    const card: EnemyCard = {
      id: uid(),
      def,
      x: w / 2 + Math.random() * (CANVAS_W - w),
      y: -h,
      hp,
      maxHp: hp,
      speed,
      angle: 0,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: (Math.random() - 0.5) * 1.5,
      width: w,
      height: h,
      destroyed: false,
      escaped: false,
      flashTimer: 0,
      isBoss,
      scale,
      spinAngle: 0,
      spinSpeed: SPIN_SPEED,
      spinTimer: initialSpinTimer,
      isSpinning: false,
      spinDir,
      saucers: createSaucers(def.rank),
      spawnIndex: cardQueueIndex,
    };

    state.enemies.push(card);
    state.cardQueueIndex++;
    incrementTotal();
  }, [round, incrementTotal]);

  const fireBullets = useCallback((state: GameState) => {
    const shipY = CANVAS_H - 60;
    const dx = state.aimX - state.shipX;
    const dy = state.aimY - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const count = getBulletsPerShot(gunPowerLevel);
    const damage = getBulletDamage(gunPowerLevel);

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.12;
      const cos = Math.cos(spread);
      const sin = Math.sin(spread);
      const vx = nx * cos - ny * sin;
      const vy = nx * sin + ny * cos;

      state.bullets.push({
        id: uid(),
        x: state.shipX,
        y: shipY,
        vx: vx * BULLET_SPEED,
        vy: vy * BULLET_SPEED,
        damage,
        active: true,
        radius: 5,
      });
    }
  }, [gunPowerLevel]);

  const update = useCallback((state: GameState, dt: number) => {
    const { stars, nebulae, enemies, bullets, explosions } = state;

    const SHIP_SPEED = 320;
    const keys = keysRef.current;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) state.shipVx = -SHIP_SPEED;
    else if (keys.has('ArrowRight') || keys.has('KeyD')) state.shipVx = SHIP_SPEED;
    else state.shipVx *= 0.75;

    state.shipX += state.shipVx * dt;
    state.shipX = Math.max(SHIP_W / 2, Math.min(CANVAS_W - SHIP_W / 2, state.shipX));

    for (const star of stars) {
      star.y += star.speed * dt;
      if (star.y > CANVAS_H) { star.y = 0; star.x = Math.random() * CANVAS_W; }
    }
    for (const neb of nebulae) {
      neb.y += neb.speedY * dt;
      if (neb.y - neb.radius > CANVAS_H) { neb.y = -neb.radius; neb.x = Math.random() * CANVAS_W; }
    }

    const nonBossRemaining = state.cardQueue.slice(state.cardQueueIndex).filter(c => c.rank !== 'joker').length;
    const allNonBossSpawned = nonBossRemaining === 0 || state.cardQueueIndex >= state.cardQueue.length - 1;

    if (!state.allCardsSpawned && !allNonBossSpawned) {
      state.spawnTimer += dt;
      if (state.spawnTimer >= CARD_SPAWN_INTERVAL) {
        state.spawnTimer = 0;
        spawnCard(state);
      }
    }

    if (allNonBossSpawned && !state.bossSpawned && !state.allCardsSpawned) {
      state.allCardsSpawned = true;
    }

    if (state.allCardsSpawned && !state.bossSpawned) {
      const activeEnemies = enemies.filter(e => !e.destroyed && !e.escaped);
      if (activeEnemies.length === 0) {
        state.bossDelay += dt;
        if (state.bossDelay >= BOSS_SPAWN_DELAY) {
          spawnCard(state);
        }
      }
    }

    for (const card of enemies) {
      if (card.destroyed || card.escaped) continue;

      card.wobble += card.wobbleSpeed * dt;
      const wobbleX = Math.sin(card.wobble) * 25;
      card.x += wobbleX * dt;
      card.x = Math.max(card.width / 2, Math.min(CANVAS_W - card.width / 2, card.x));
      card.y += card.speed * dt;
      if (card.flashTimer > 0) card.flashTimer -= dt;

      if (card.y - card.height / 2 > CANVAS_H) {
        card.escaped = true;
        incrementEscaped();
        continue;
      }

      card.spinTimer -= dt;
      if (card.spinTimer <= 0) {
        card.isSpinning = !card.isSpinning;
        if (card.isSpinning) {
          card.spinDir = Math.random() > 0.5 ? 1 : -1;
          card.spinTimer = 5.0;
        } else {
          card.spinTimer = 1.0 + Math.random() * 3.0;
        }
      }
      if (card.isSpinning) {
        card.spinAngle += card.spinDir * card.spinSpeed * dt;
      }

      for (const s of card.saucers) {
        if (s.destroyed) continue;
        const orbitR = (card.width * 0.6) + SAUCER_ORBIT_RADIUS * 0.4;
        s.orbitAngle += s.orbitSpeed * dt;
      }
    }

    for (const bullet of bullets) {
      if (!bullet.active) continue;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.x < 0 || bullet.x > CANVAS_W || bullet.y < -50 || bullet.y > CANVAS_H + 50) {
        bullet.active = false;
      }
    }

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      for (const card of enemies) {
        if (card.destroyed || card.escaped) continue;

        const orbitR = card.width * 0.5 + SAUCER_ORBIT_RADIUS * 0.4;
        for (const s of card.saucers) {
          if (s.destroyed) continue;
          const sx = card.x + Math.cos(s.orbitAngle) * orbitR;
          const sy = card.y + Math.sin(s.orbitAngle) * orbitR;
          const sdx = bullet.x - sx;
          const sdy = bullet.y - sy;
          const dist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (dist < s.size + bullet.radius) {
            s.destroyed = true;
            bullet.active = false;
            explosions.push({
              id: uid(),
              x: sx,
              y: sy,
              radius: 3,
              maxRadius: 22,
              alpha: 1,
              color: '#44FF88',
            });
            break;
          }
        }
        if (!bullet.active) break;

        const dx = bullet.x - card.x;
        const dy = bullet.y - card.y;
        const hw = card.width / 2 + bullet.radius;
        const hh = card.height / 2 + bullet.radius;
        if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
          bullet.active = false;
          card.hp -= bullet.damage;
          card.flashTimer = 0.12;
          if (card.hp <= 0) {
            card.destroyed = true;
            incrementDestroyed();
            const pts = getCardPoints(card.def, round, card.spawnIndex);
            addRoundPoints(pts);
            collectCard(card.def);
            const color = card.isBoss ? '#FFD700' : (card.def.suit === 'hearts' || card.def.suit === 'diamonds' ? '#FF4444' : '#4488FF');
            explosions.push({
              id: uid(),
              x: card.x,
              y: card.y,
              radius: 5,
              maxRadius: card.isBoss ? 120 : 55,
              alpha: 1,
              color,
            });
            state.floatingTexts.push({
              id: uid(),
              x: card.x,
              startY: card.y,
              floatDistance: card.height / 2,
              text: `+${pts}`,
              timer: 0,
              maxTimer: 5,
              color,
            });
          }
          break;
        }
      }
    }

    for (const exp of explosions) {
      exp.radius += (exp.maxRadius * 3) * dt;
      exp.alpha -= 2.5 * dt;
    }

    for (const ft of state.floatingTexts) {
      ft.timer += dt;
    }

    if (state.touchActive) {
      state.autoFireTimer += dt;
      const fireInterval = getFireInterval(gunPowerLevel);
      if (state.autoFireTimer >= fireInterval) {
        state.autoFireTimer = 0;
        fireBullets(state);
      }
    }

    const activeEnemies = enemies.filter(e => !e.destroyed && !e.escaped);
    const allQueued = state.cardQueueIndex >= state.cardQueue.length;
    if (allQueued && activeEnemies.length === 0 && state.bossSpawned) {
      state.gameOver = true;
    }
  }, [spawnCard, fireBullets, incrementDestroyed, incrementEscaped, addRoundPoints, collectCard, gunPowerLevel]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const bgImg = jwstImagesRef.current[state.bgImageIndex];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasAspect = CANVAS_W / CANVAS_H;
      let sx = 0, sy = 0, sw = bgImg.naturalWidth, sh = bgImg.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = bgImg.naturalHeight * canvasAspect;
        sx = (bgImg.naturalWidth - sw) / 2;
      } else {
        sh = bgImg.naturalWidth / canvasAspect;
        sy = (bgImg.naturalHeight - sh) / 2;
      }
      ctx.globalAlpha = 0.2;
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,10,0.45)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const neb of state.nebulae) {
      const g = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
      g.addColorStop(0, neb.color + '88');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const star of state.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
      ctx.fill();
    }

    for (const card of state.enemies) {
      if (card.destroyed || card.escaped) continue;
      const { x, y, width: w, height: h, def, hp, maxHp, flashTimer, isBoss, spinAngle, saucers } = card;

      const orbitR = w * 0.5 + SAUCER_ORBIT_RADIUS * 0.4;
      for (const s of saucers) {
        if (s.destroyed) continue;
        const sx = x + Math.cos(s.orbitAngle) * orbitR;
        const sy = y + Math.sin(s.orbitAngle) * orbitR;
        drawSaucer(ctx, sx, sy, s.size);
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spinAngle);

      const cx = -w / 2;
      const cy = -h / 2;
      const suitColor = getSuitColor(def.suit);

      if (isBoss) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#FFD700';
      }

      ctx.fillStyle = flashTimer > 0 ? '#FFFFFF' : '#F5F0E8';
      roundRect(ctx, cx, cy, w, h, 5 * card.scale);
      ctx.fill();

      ctx.strokeStyle = isBoss ? '#FFD700' : suitColor;
      ctx.lineWidth = isBoss ? 3 : 1.5;
      roundRect(ctx, cx, cy, w, h, 5 * card.scale);
      ctx.stroke();

      ctx.shadowBlur = 0;

      const fontSize = Math.round(13 * card.scale);
      ctx.fillStyle = suitColor;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(def.label, cx + 4 * card.scale, cy + fontSize + 2 * card.scale);
      ctx.textAlign = 'right';
      ctx.fillText(def.label, cx + w - 4 * card.scale, cy + h - 3 * card.scale);

      if (isBoss) {
        ctx.font = `bold ${Math.round(22 * card.scale)}px monospace`;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('JOKER', 0, -5 * card.scale);
        ctx.font = `${Math.round(26 * card.scale)}px serif`;
        ctx.fillText('★', 0, 16 * card.scale);
      } else {
        const suitSymbol = def.label[def.label.length - 1];
        ctx.font = `${Math.round(22 * card.scale)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = suitColor;
        ctx.fillText(suitSymbol, 0, 8 * card.scale);
      }

      ctx.restore();

      const barW = w;
      const barH = 6 * card.scale;
      const barX = x - w / 2;
      const barY = y - h / 2 - barH - 3;
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barW, barH);
      const pct = Math.max(0, hp / maxHp);
      const hpColor = isBoss ? '#FFD700' : (pct > 0.5 ? '#44FF44' : pct > 0.25 ? '#FFAA00' : '#FF4444');
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);

      const activeSaucers = saucers.filter(s => !s.destroyed).length;
      if (activeSaucers > 0) {
        ctx.fillStyle = '#44FF88';
        ctx.font = `bold 9px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`🛸×${activeSaucers}`, x, y - h / 2 - barH - 10);
      }
    }

    for (const exp of state.explosions) {
      if (exp.alpha <= 0) continue;
      ctx.save();
      const g = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      g.addColorStop(0, exp.color + 'FF');
      g.addColorStop(0.4, exp.color + '88');
      g.addColorStop(1, exp.color + '00');
      ctx.globalAlpha = Math.max(0, exp.alpha);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const b of state.bullets) {
      if (!b.active) continue;
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00FFFF';
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.4, '#00FFFF');
      g.addColorStop(1, '#0066AA00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of state.floatingTexts) {
      if (ft.timer >= ft.maxTimer) continue;
      const progress = ft.timer / ft.maxTimer;
      const alpha = 1 - progress;
      const y = ft.startY - progress * ft.floatDistance;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = ft.color;
      ctx.strokeText(ft.text, ft.x, y);
      ctx.fillText(ft.text, ft.x, y);
      ctx.restore();
    }

    drawShip(ctx, state.shipX, CANVAS_H - 60, gunPowerLevel);

    if (state.touchActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.shipX, CANVAS_H - 60);
      ctx.lineTo(state.aimX, state.aimY);
      ctx.stroke();
      ctx.restore();
    }
  }, [gunPowerLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    CANVAS_W = canvas.clientWidth || window.innerWidth;
    CANVAS_H = canvas.clientHeight || window.innerHeight;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    stateRef.current = initState();
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      const state = stateRef.current!;

      update(state, dt);

      state.bullets = state.bullets.filter(b => b.active);
      state.enemies = state.enemies.filter(e => !e.destroyed);
      state.explosions = state.explosions.filter(e => e.alpha > 0);
      state.floatingTexts = state.floatingTexts.filter(ft => ft.timer < ft.maxTimer);

      draw(ctx, state);

      if (state.gameOver) {
        finishRound();
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initState, update, draw, finishRound]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if (stateRef.current) {
      stateRef.current.aimX = (e.clientX - rect.left) * scaleX;
      stateRef.current.aimY = (e.clientY - rect.top) * scaleY;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if (stateRef.current) {
      stateRef.current.aimX = (e.clientX - rect.left) * scaleX;
      stateRef.current.aimY = (e.clientY - rect.top) * scaleY;
      stateRef.current.touchActive = true;
      stateRef.current.autoFireTimer = 999;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (stateRef.current) stateRef.current.touchActive = false;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

function drawSaucer(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#44FF88';

  ctx.fillStyle = '#223322';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.1, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#44FF88';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#88FFAA';
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.1, r * 0.55, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00FFAA';
  for (let i = 0; i < 3; i++) {
    const lx = x - r * 0.5 + i * r * 0.5;
    ctx.beginPath();
    ctx.arc(lx, y + r * 0.25, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, powerLevel: number) {
  ctx.save();
  const colorIdx = Math.min(Math.floor(powerLevel * 4 / 14), 4);
  const engineColor = ['#00FFFF', '#00CCFF', '#44FFAA', '#FFAA00', '#FF6600'][colorIdx];

  ctx.shadowBlur = 20;
  ctx.shadowColor = engineColor;
  ctx.fillStyle = engineColor;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x - 8, y - 8);
  ctx.lineTo(x - 28, y + 8);
  ctx.lineTo(x - 20, y + 14);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x + 20, y + 14);
  ctx.lineTo(x + 28, y + 8);
  ctx.lineTo(x + 8, y - 8);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 8;
  ctx.fillStyle = '#001133';
  ctx.beginPath();
  ctx.arc(x, y - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = engineColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const flickerSize = 6 + Math.sin(Date.now() / 80) * 2;
  ctx.shadowBlur = 14;
  ctx.shadowColor = engineColor;
  ctx.fillStyle = engineColor + 'CC';
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 14);
  ctx.lineTo(x, y + 14 + flickerSize);
  ctx.lineTo(x + 10, y + 14);
  ctx.fill();

  if (powerLevel >= 6) {
    ctx.fillStyle = engineColor + '88';
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 10);
    ctx.lineTo(x - 16, y + 10 + flickerSize * 0.6);
    ctx.lineTo(x - 10, y + 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 10);
    ctx.lineTo(x + 16, y + 10 + flickerSize * 0.6);
    ctx.lineTo(x + 22, y + 10);
    ctx.fill();
  }

  ctx.restore();
}
