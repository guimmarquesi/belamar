// Lightweight read access to the NPCs created in the NPCs panel.
// Keep the storage key in sync with src/components/NpcsPanel.tsx
export const NPCS_STORAGE_KEY = "belamar.custom-npcs";

export type StoredNpc = {
  id: string;
  name: string;
  relation?: string;
  faction?: string;
  portrait?: string;
  summary?: string;
  accent?: string;
  sigil?: string;
};

export function loadStoredNpcs(): StoredNpc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NPCS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as StoredNpc[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
