export type NpcRelation = "aliado" | "inimigo" | "neutro" | "desconhecido";

export type Npc = {
  id: string;
  name: string;
  relation: NpcRelation;
  faction?: string;
  lastSeen?: string;
  bond?: string;
  quests?: string[];
  summary?: string;
  sigil?: string;
  accent?: string;
};

export const NPCS: Npc[] = [
  // Aliados — antigos do menu Grupo
  {
    id: "zyon",
    name: "Zyon",
    relation: "aliado",
    faction: "—",
    lastSeen: "Belamar",
    bond: "Caminha com a companhia.",
    summary: "Aliado próximo, lutador silencioso.",
    sigil: "Z",
    accent: "oklch(0.55 0.08 145)",
  },
  {
    id: "helena",
    name: "Helena",
    relation: "aliado",
    faction: "—",
    lastSeen: "Belamar",
    bond: "Caminha com a companhia.",
    summary: "Aliada de confiança.",
    sigil: "H",
    accent: "oklch(0.65 0.1 25)",
  },
  {
    id: "thomas",
    name: "Thomas",
    relation: "aliado",
    faction: "—",
    lastSeen: "Belamar",
    bond: "Caminha com a companhia.",
    summary: "Aliado e companheiro de jornada.",
    sigil: "T",
    accent: "oklch(0.55 0.06 230)",
  },
];

export const RELATION_LABEL: Record<NpcRelation, string> = {
  aliado: "Aliados",
  inimigo: "Inimigos",
  neutro: "Neutros",
  desconhecido: "Desconhecidos",
};

export const RELATION_ORDER: NpcRelation[] = ["aliado", "inimigo", "neutro", "desconhecido"];
