export type QuestKind = "principal" | "secundaria";
export type QuestStatus = "ativa" | "concluida" | "falhada";

export type Quest = {
  id: string;
  title: string;
  kind: QuestKind;
  status: QuestStatus;
  summary?: string;
  notes?: string;
  linkedMarkerIds: string[];
  createdAt: number;
};

export const QUESTS_KEY = "belamar.quests";

export function loadQuests(): Quest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUESTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveQuests(quests: Quest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
}

export function newQuestId() {
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
