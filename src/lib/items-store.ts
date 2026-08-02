import type { Item, ItemRarity } from "./items";

const CUSTOM_KEY = "belamar.custom-items";
const OWNERS_KEY = "belamar.item-owners";
const HIDDEN_KEY = "belamar.hidden-items";

export type CustomItem = Item & { id: string; rarity: ItemRarity };

export function loadHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHidden(keys: string[]) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(keys));
}

export function loadCustomItems(): CustomItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveCustomItems(items: CustomItem[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
}

export function loadOwners(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OWNERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveOwners(owners: Record<string, string>) {
  localStorage.setItem(OWNERS_KEY, JSON.stringify(owners));
}
