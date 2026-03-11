import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CardDef, GamePhase } from '@/components/game/types';

export interface CollectedCard extends CardDef {
  count: number;
}

interface GameStore {
  phase: GamePhase;
  round: number;
  totalPoints: number;
  roundPoints: number;
  collectedCards: CollectedCard[];
  escapedCards: number;
  destroyedCount: number;
  totalCardsThisRound: number;
  gunPowerLevel: number;
  minCardsRequired: number;
  playerHp: number;
  maxPlayerHp: number;
  lastRoundMaxPoints: number;
  gamertag: string;
  isSaving: boolean;

  setPhase: (phase: GamePhase) => void;
  startGame: () => void;
  resumeGame: () => void;
  startRound: () => void;
  collectCard: (card: CardDef) => void;
  addRoundPoints: (pts: number) => void;
  incrementDestroyed: () => void;
  incrementEscaped: () => void;
  incrementTotal: () => void;
  finishRound: () => void;
  nextRound: () => void;
  repeatRound: () => void;
  purchaseGunPower: () => void;
  setPlayerHp: (hp: number) => void;
  restartGame: () => void;
  setLastRoundMaxPoints: (pts: number) => void;
  setGamertag: (tag: string) => void;
  loadPlayer: (tag: string) => Promise<boolean>;
  saveProgress: () => Promise<void>;
}

const BASE_MIN_CARDS = 25;
export const MAX_GUN_LEVEL = 15;

const FRESH_STATE = {
  round: 1,
  totalPoints: 0,
  roundPoints: 0,
  collectedCards: [] as CollectedCard[],
  escapedCards: 0,
  destroyedCount: 0,
  totalCardsThisRound: 0,
  gunPowerLevel: 0,
  minCardsRequired: BASE_MIN_CARDS,
  playerHp: 3,
  maxPlayerHp: 3,
  lastRoundMaxPoints: 0,
};

async function fetchSaveProgress(gamertag: string, data: object) {
  if (!gamertag) return;
  try {
    await fetch(`/api/player/${encodeURIComponent(gamertag)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    phase: 'menu',
    ...FRESH_STATE,
    gamertag: '',
    isSaving: false,

    setPhase: (phase) => set({ phase }),

    startGame: () => set({
      phase: 'playing',
      ...FRESH_STATE,
    }),

    resumeGame: () => set({ phase: 'playing' }),

    startRound: () => set({
      phase: 'playing',
      roundPoints: 0,
      collectedCards: [],
      escapedCards: 0,
      destroyedCount: 0,
      totalCardsThisRound: 0,
    }),

    collectCard: (card) => set((state) => {
      const existing = state.collectedCards.find(
        c => c.rank === card.rank && c.suit === card.suit
      );
      if (existing) {
        return {
          collectedCards: state.collectedCards.map(c =>
            c.rank === card.rank && c.suit === card.suit
              ? { ...c, count: c.count + 1 }
              : c
          )
        };
      }
      return {
        collectedCards: [...state.collectedCards, { ...card, count: 1 }]
      };
    }),

    addRoundPoints: (pts) => set((state) => ({
      roundPoints: state.roundPoints + pts,
    })),

    incrementDestroyed: () => set((state) => ({
      destroyedCount: state.destroyedCount + 1,
    })),

    incrementEscaped: () => set((state) => ({
      escapedCards: state.escapedCards + 1,
    })),

    incrementTotal: () => set((state) => ({
      totalCardsThisRound: state.totalCardsThisRound + 1,
    })),

    finishRound: () => {
      set((state) => ({
        phase: 'roundSummary',
        totalPoints: state.totalPoints + state.roundPoints,
      }));
      setTimeout(() => get().saveProgress(), 0);
    },

    nextRound: () => {
      set((state) => ({
        phase: 'shop',
        round: state.round + 1,
        minCardsRequired: BASE_MIN_CARDS + state.gunPowerLevel,
      }));
      setTimeout(() => get().saveProgress(), 0);
    },

    repeatRound: () => set(() => ({
      phase: 'shop',
    })),

    purchaseGunPower: () => set((state) => {
      if (state.gunPowerLevel >= MAX_GUN_LEVEL) return {};
      const cost = getGunPowerCost(state.lastRoundMaxPoints, state.round);
      if (state.totalPoints < cost) return {};
      return {
        gunPowerLevel: state.gunPowerLevel + 1,
        totalPoints: state.totalPoints - cost,
        minCardsRequired: BASE_MIN_CARDS + state.gunPowerLevel + 1,
      };
    }),

    setPlayerHp: (hp) => set({ playerHp: hp }),

    setLastRoundMaxPoints: (pts) => set({ lastRoundMaxPoints: pts }),

    restartGame: async () => {
      await get().saveProgress();
      set({ phase: 'menu' });
    },

    setGamertag: (tag) => set({ gamertag: tag }),

    loadPlayer: async (tag: string) => {
      const normalized = tag.toLowerCase();
      try {
        const res = await fetch(`/api/player/${encodeURIComponent(normalized)}`);
        if (!res.ok) return false;
        const data = await res.json();
        set({
          gamertag: normalized,
          totalPoints: data.totalPoints ?? 0,
          round: data.round ?? 1,
          gunPowerLevel: data.gunPowerLevel ?? 0,
          minCardsRequired: data.minCardsRequired ?? BASE_MIN_CARDS,
          lastRoundMaxPoints: data.lastRoundMaxPoints ?? 0,
          roundPoints: 0,
          collectedCards: [],
          escapedCards: 0,
          destroyedCount: 0,
          totalCardsThisRound: 0,
        });
        return true;
      } catch {
        return false;
      }
    },

    saveProgress: async () => {
      const state = get();
      if (!state.gamertag) return;
      const totalPoints = state.totalPoints + (state.phase === 'roundSummary' ? 0 : 0);
      await fetchSaveProgress(state.gamertag, {
        totalPoints: state.totalPoints,
        round: state.round,
        gunPowerLevel: state.gunPowerLevel,
        minCardsRequired: state.minCardsRequired,
        lastRoundMaxPoints: state.lastRoundMaxPoints,
      });
    },
  }))
);

export function getGunPowerCost(lastRoundMaxPoints: number, roundNumber: number): number {
  return lastRoundMaxPoints * roundNumber;
}

export function getBulletDamage(gunPowerLevel: number): number {
  return 1 + Math.floor(gunPowerLevel / 3);
}

export function getBulletsPerShot(gunPowerLevel: number): number {
  if (gunPowerLevel >= 10) return 3;
  if (gunPowerLevel >= 5) return 2;
  return 1;
}

export function getFireInterval(gunPowerLevel: number): number {
  return Math.max(0.10, 0.18 - gunPowerLevel * 0.005);
}
