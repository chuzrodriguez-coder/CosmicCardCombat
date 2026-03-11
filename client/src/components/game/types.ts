export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 'joker';

export interface CardDef {
  rank: Rank;
  suit: Suit | null;
  label: string;
  pointValue: number;
  baseHp: number;
}

export interface Saucer {
  id: string;
  orbitAngle: number;
  orbitSpeed: number;
  destroyed: boolean;
  size: number;
}

export interface EnemyCard {
  id: string;
  def: CardDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  angle: number;
  wobble: number;
  wobbleSpeed: number;
  width: number;
  height: number;
  destroyed: boolean;
  escaped: boolean;
  flashTimer: number;
  isBoss: boolean;
  scale: number;
  spinAngle: number;
  spinSpeed: number;
  spinTimer: number;
  isSpinning: boolean;
  spinDir: 1 | -1;
  saucers: Saucer[];
  spawnIndex: number;
}

export interface FloatingText {
  id: string;
  x: number;
  startY: number;
  floatDistance: number;
  text: string;
  timer: number;
  maxTimer: number;
  color: string;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  active: boolean;
  radius: number;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  speedY: number;
}

export interface PowerUp {
  id: 'gunPower';
  label: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
}

export type GamePhase = 'menu' | 'playing' | 'roundSummary' | 'shop' | 'gameOver';
