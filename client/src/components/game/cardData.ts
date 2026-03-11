import type { CardDef, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANK_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
};

export function buildDeck(): CardDef[] {
  const cards: CardDef[] = [];
  for (const suit of SUITS) {
    for (let r = 2; r <= 14; r++) {
      const rank = r as Rank;
      cards.push({
        rank,
        suit,
        label: `${RANK_LABELS[r]}${SUIT_SYMBOLS[suit]}`,
        pointValue: r,
        baseHp: r - 1,
      });
    }
  }
  return cards;
}

export const JOKER_CARD: CardDef = {
  rank: 'joker',
  suit: null,
  label: 'JOKER',
  pointValue: 20,
  baseHp: 30,
};

export function getSuitColor(suit: Suit | null): string {
  if (!suit) return '#FFD700';
  return suit === 'hearts' || suit === 'diamonds' ? '#CC2222' : '#111111';
}

export function getSuitSymbol(suit: Suit | null): string {
  if (!suit) return '★';
  return SUIT_SYMBOLS[suit];
}

export function generateRoundCardQueue(round: number, totalCards: number): CardDef[] {
  const deck = buildDeck();
  const queue: CardDef[] = [];

  for (let i = 0; i < totalCards - 1; i++) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    queue.push({ ...card });
  }

  queue.push({ ...JOKER_CARD });

  return queue;
}

export function getCardHp(card: CardDef, round: number, spawnIndex: number = 0): number {
  const roundBase = 1 + (round - 1) * 0.05;
  const spawnBonus = spawnIndex * 0.02;
  const multiplier = roundBase + spawnBonus;

  if (card.rank === 'joker') {
    return Math.max(1, Math.floor(card.baseHp * multiplier));
  }
  const rankVal = card.rank as number;
  return Math.max(1, Math.floor((rankVal - 1) * multiplier));
}

export function getCardPoints(card: CardDef, round: number, spawnIndex: number = 0): number {
  const roundBase = 1 + (round - 1) * 0.05;
  const spawnBonus = spawnIndex * 0.02;
  const multiplier = roundBase + spawnBonus;
  return Math.max(1, Math.floor(card.pointValue * multiplier));
}

export function getCardSpeed(card: CardDef, round: number): number {
  const base = card.rank === 'joker' ? 30 : 20 + (card.rank as number);
  return base * (1 + (round - 1) * 0.15);
}
