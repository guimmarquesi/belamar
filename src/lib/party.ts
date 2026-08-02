import { Crosshair, Sun, Wind, Music, Hammer, type LucideIcon } from "lucide-react";
import bandolimImg from "@/assets/party/bandolim.png";
import huangImg from "@/assets/party/huang.jpeg";
import dreadMooreImg from "@/assets/party/dread-moore.jpeg";
import enoqueImg from "@/assets/party/enoque.jpeg";
import rustImg from "@/assets/party/rust.jpeg";

export type DossierSection = {
  title: string;
  body?: string;
  bullets?: { label: string; text: string }[];
};

export type PartyMember = {
  id: string;
  name: string;
  epithet: string;
  classLine: string;
  icon: LucideIcon;
  isYou?: boolean;
  /** monogram drawn inside the medallion */
  sigil: string;
  /** subtle accent color */
  accent: string;
  /** optional portrait image */
  portrait?: string;
  /** quick stats panel (race, age, alignment, etc.) */
  stats?: { label: string; value: string }[];
  /** structured dossier sections rendered above the field notes */
  dossier?: DossierSection[];
};

/** Os jogadores da mesa — a Companhia. */
export const PARTY: PartyMember[] = [
  {
    id: "bandolim",
    name: "Bandolim",
    epithet: "o pistoleiro de mãos leves",
    classLine: "Ladino · Pistoleiro",
    icon: Crosshair,
    isYou: true,
    sigil: "B",
    accent: "oklch(0.7 0.13 65)",
    portrait: bandolimImg,
  },
  {
    id: "enoque",
    name: "Enoque",
    epithet: "voz que acalma a maré",
    classLine: "Clérigo",
    icon: Sun,
    sigil: "E",
    accent: "oklch(0.78 0.12 85)",
    portrait: enoqueImg,
  },
  {
    id: "huang",
    name: "Huang",
    epithet: "sombra entre os telhados",
    classLine: "Monge · Ninja",
    icon: Wind,
    sigil: "H",
    accent: "oklch(0.6 0.06 200)",
    portrait: huangImg,
  },
  {
    id: "dread-moore",
    name: "Dread Moore",
    epithet: "o trovador das marés negras",
    classLine: "Bardo",
    icon: Music,
    sigil: "D",
    accent: "oklch(0.55 0.13 320)",
    portrait: dreadMooreImg,
  },
  {
    id: "rust",
    name: "Rusty",
    epithet: "o estrategista implacável de Belamar",
    classLine: "Guerreiro · Mestre da Batalha",
    icon: Hammer,
    sigil: "R",
    accent: "oklch(0.55 0.1 40)",
    portrait: rustImg,
    stats: [
      { label: "Raça", value: "Meio-Elfo (Floresta)" },
      { label: "Classe", value: "Guerreiro Nv. 4 · Mestre da Batalha" },
      { label: "Idade", value: "47 anos" },
      { label: "Porte", value: "1,90 m · 105 kg" },
      { label: "Aparência", value: "Cabelos brancos · olhos azuis frios · pele pálida marcada" },
      { label: "Alinhamento", value: "Leal e Neutro" },
      { label: "Crença", value: "Foco no ouro" },
      { label: "Background", value: "Nobre" },
    ],
    dossier: [
      {
        title: "O passado — Nobre",
        body: "Antes do Morro das Cordas, Rusty era a bússola logística da alta cúpula de Vila Clara. Lidava diretamente com a nobreza, negociava contratos, desenhava rotas de contrabando e geria fortunas. Por isso conhece exatamente como a elite de Belamar pensa, fala e gasta seu ouro.",
      },
      {
        title: "A ruptura — O Limite Cruzado",
        body: "Mesmo no submundo existem regras. O ponto de virada foi um massacre ordenado pela família, que destruiu vidas inocentes fora do jogo — o velho cozinheiro e as crianças. Rusty saiu de lá caminhando por escolha própria, mas prometeu a si mesmo que os responsáveis vão pagar caro.",
      },
      {
        title: "Código de conduta",
        bullets: [
          {
            label: "A Lei do Acordo",
            text: "Belamar pode ser caos afogado em corrupção, mas um contrato firmado se honra até o fim — em ouro ou em sangue.",
          },
          {
            label: "Violência como transação",
            text: "Rápida, eficiente, sem desperdício de energia.",
          },
          {
            label: "Voz baixa",
            text: "Deixa que a tensão de sua presença faça o trabalho.",
          },
          {
            label: "Leitura constante",
            text: "No Morro das Cordas nada é acaso — tudo é negociação ou emboscada. Avalia cada um pelo seu preço, vício ou fraqueza.",
          },
        ],
      },
      {
        title: "Demônios internos",
        bullets: [
          {
            label: "Paranoia",
            text: "Sempre espera a traição. Lealdade, em Belamar, dura até alguém oferecer um preço maior.",
          },
          {
            label: "Frieza",
            text: "Vê utilidade antes de humanidade — tem dificuldade em demonstrar compaixão.",
          },
          {
            label: "Rancor",
            text: "O ódio contra a liderança da Salvette dita suas ações. A obsessão em destruí-la pode cegá-lo para riscos óbvios.",
          },
        ],
      },
    ],
  },
];
