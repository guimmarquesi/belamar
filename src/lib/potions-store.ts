export type PotionRarity = "sem" | "comum" | "incomum" | "raro" | "super_raro";

export type Potion = {
  id: string;
  name: string;
  effect: string;
  rarity: PotionRarity;
  count: number;
};

const KEY = "belamar.potions";
const SEEDED_KEY = "belamar.potions.seeded.v1";

export const SEED_POTIONS: Omit<Potion, "id">[] = [
  { name: "Poção da Maré Serena", effect: "Remove um nível de exaustão", rarity: "sem", count: 2 },
  {
    name: "Poção da Precisão",
    effect: "Próxima jogada de ataque tem vantagem",
    rarity: "sem",
    count: 3,
  },
  {
    name: "Poção do Explorador",
    effect: "+10 pés de deslocamento por 8 horas",
    rarity: "sem",
    count: 5,
  },
  { name: "Poção da Coragem", effect: "Imunidade a medo por 1 hora", rarity: "sem", count: 1 },
  {
    name: "Poção da Vigília",
    effect: "Não precisa dormir na próxima noite",
    rarity: "sem",
    count: 1,
  },
  {
    name: "Poção da Sorte",
    effect: "Pode refazer 1 teste d20 nas próximas 24 horas",
    rarity: "sem",
    count: 1,
  },
  { name: "Poção da Visão Noturna", effect: "Darkvision 18m por 8 horas", rarity: "sem", count: 2 },
  {
    name: "Poção do Caçador",
    effect: "+1d4 em testes de Sobrevivência por 8 horas",
    rarity: "sem",
    count: 3,
  },
  {
    name: "Poção da Língua Prateada",
    effect: "+1d4 em Persuasão por 1 hora",
    rarity: "sem",
    count: 2,
  },
  {
    name: "Poção da Névoa",
    effect: "Cria uma área de névoa de 6m ao ser arremessada",
    rarity: "sem",
    count: 1,
  },
  { name: "Poção de Cura", effect: "Recupera 2d4+2 PV", rarity: "comum", count: 9 },
  { name: "Poção de Cura Maior", effect: "Recupera 4d4+4 PV", rarity: "incomum", count: 4 },
  { name: "Poção de Cura Superior", effect: "Recupera 8d4+8 PV", rarity: "raro", count: 2 },
  {
    name: "Poção de Resistência ao Fogo",
    effect: "Resistência a dano de fogo por 1 hora",
    rarity: "incomum",
    count: 4,
  },
  {
    name: "Poção de Resistência ao Frio",
    effect: "Resistência a dano de frio por 1 hora",
    rarity: "incomum",
    count: 4,
  },
  {
    name: "Poção de Resistência ao Relâmpago",
    effect: "Resistência a dano elétrico por 1 hora",
    rarity: "incomum",
    count: 4,
  },
  {
    name: "Poção de Resistência ao Veneno",
    effect: "Resistência a veneno por 1 hora",
    rarity: "incomum",
    count: 4,
  },
];

export function loadPotions(): Potion[] {
  if (typeof window === "undefined") return [];
  try {
    const seeded = localStorage.getItem(SEEDED_KEY);
    const raw = localStorage.getItem(KEY);
    if (!seeded && !raw) {
      const list: Potion[] = SEED_POTIONS.map((p, i) => ({
        ...p,
        id: `seed-${i}-${Math.random().toString(36).slice(2, 7)}`,
      }));
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem(SEEDED_KEY, "1");
      return list;
    }
    return raw ? (JSON.parse(raw) as Potion[]) : [];
  } catch {
    return [];
  }
}

export function savePotions(list: Potion[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
