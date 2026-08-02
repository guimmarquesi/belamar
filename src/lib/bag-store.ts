export type BagItem = {
  id: string;
  name: string;
  description: string;
  count: number;
};

export type Coins = { gold: number; silver: number; bronze: number };

const KEY = "belamar.bag";
const COINS_KEY = "belamar.bag.coins";

export function loadBag(): BagItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BagItem[]) : [];
  } catch {
    return [];
  }
}

export function saveBag(list: BagItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function loadCoins(): Coins {
  if (typeof window === "undefined") return { gold: 0, silver: 0, bronze: 0 };
  try {
    const raw = localStorage.getItem(COINS_KEY);
    if (!raw) return { gold: 0, silver: 0, bronze: 0 };
    const parsed = JSON.parse(raw) as Partial<Coins>;
    return {
      gold: parsed.gold ?? 0,
      silver: parsed.silver ?? 0,
      bronze: parsed.bronze ?? 0,
    };
  } catch {
    return { gold: 0, silver: 0, bronze: 0 };
  }
}

export function saveCoins(c: Coins) {
  localStorage.setItem(COINS_KEY, JSON.stringify(c));
}
