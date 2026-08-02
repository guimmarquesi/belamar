import {
  ScrollText,
  VenetianMask,
  Store,
  Beer,
  Flag,
  Skull,
  Eye,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type MarkerType =
  | "quest"
  | "npc"
  | "shop"
  | "tavern"
  | "faction"
  | "danger"
  | "mystery"
  | "landmark";

export type MapMarker = {
  id: string;
  name: string;
  type: MarkerType;
  /** percentage position over the map image (0-100) */
  x: number;
  y: number;
  district?: string;
  summary?: string;
  services?: string[];
  events?: string[];
  linkedNpcs?: string[];
  linkedQuests?: string[];
};

export const MARKER_META: Record<MarkerType, { label: string; icon: LucideIcon; color: string }> = {
  quest: { label: "Quests", icon: ScrollText, color: "var(--color-cat-quests)" },
  npc: { label: "NPCs", icon: VenetianMask, color: "var(--color-cat-npcs)" },
  shop: { label: "Lojas", icon: Store, color: "var(--color-cat-shop)" },
  tavern: { label: "Tavernas", icon: Beer, color: "var(--color-cat-tavern)" },
  faction: { label: "Facções", icon: Flag, color: "var(--color-cat-factions)" },
  danger: { label: "Áreas perigosas", icon: Skull, color: "var(--color-cat-danger)" },
  mystery: { label: "Mistérios", icon: Eye, color: "var(--color-cat-mysteries)" },
  landmark: { label: "Locais", icon: Landmark, color: "var(--color-cat-timeline)" },
};

/** Distritos descritivos — usados como referência dentro do mapa. */
export const DISTRICT_NOTES: { name: string; description: string }[] = [
  { name: "Vila Clara", description: "Bairro nobre — muros altos, guardas 24h." },
  { name: "Valedouro", description: "Coração comercial. Sem álcool aqui." },
  { name: "Miravento", description: "Torres, observatórios, escola e tecnomagia." },
  { name: "Lago da Garoa", description: "Garoa eterna, templos e cemitério." },
  { name: "Colina da Aurora", description: "Mansões e Conselho da Maré." },
  { name: "Bairro das Escadas", description: "Ruas estreitas, fácil sumir." },
  { name: "Morro das Cordas", description: "Casas suspensas por cordas, porto pesado." },
  { name: "Âncora Baixa", description: "Jogos, apostas, Maré Negra." },
  { name: "Pedra Muda", description: "A prisão antiga. Ninguém fala dela." },
];

export const MAP_MARKERS: MapMarker[] = [];
