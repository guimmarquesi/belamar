import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  Users,
  VenetianMask,
  FlaskRound,
  ScrollText,
  Gem,
  Backpack,
  Compass,
  Search,
  X,
  Newspaper,
  BookOpen,
  Feather,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import tableBg from "@/assets/scene/table-bg.jpg";
import mapImg from "@/assets/belamar-map.jpg";
import engNpcs from "@/assets/engravings/npcs.png";
import engGrupo from "@/assets/engravings/grupo.png";
import engItens from "@/assets/engravings/itens.png";
import engQuests from "@/assets/engravings/quests.png";
import engMisterios from "@/assets/engravings/bolsa.png";
import engFaccoes from "@/assets/engravings/pocoes.png";
import parchmentImg from "@/assets/parchment.jpg";
import { PartyPanel } from "@/components/PartyPanel";
import { NpcsPanel } from "@/components/NpcsPanel";
import { QuestsPanel } from "@/components/QuestsPanel";
import { MapDrawer } from "@/components/MapDrawer";
import { LoreBlock } from "@/components/LoreBlock";
import { ItemsList } from "@/components/ItemsList";
import { PotionsList } from "@/components/PotionsList";
import { BagList } from "@/components/BagList";
import { WeatherOverlay, useWeather } from "@/components/WeatherControl";
import { TopWorldBar } from "@/components/TopWorldBar";
import { RegionHotspots } from "@/components/RegionHotspots";
import { BelamarGate } from "@/components/BelamarGate";
import { PARTY } from "@/lib/party";
import { CITY_OVERVIEW, ERAS, FIGURES, FIGURES_INTRO } from "@/lib/lore";

const PAGE_TITLE = "Belamar — Mapa e Crônica Viva da Cidade Portuária";
const PAGE_DESC =
  "Mesa compartilhada da campanha de Belamar: mapa, guilda, NPCs, quests, itens, poções e bolsa em tempo real.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BelamarPage,
});

function BelamarPage() {
  return (
    <BelamarGate>
      <BelamarBoard />
    </BelamarGate>
  );
}

type CategoryId = "grupo" | "npcs" | "pocoes" | "quests" | "itens" | "bolsa" | "mapa";

type Category = {
  id: CategoryId;
  name: string;
  subtitle: string;
  description: string;
  icon: typeof Users;
  engraving?: string;
  x: number;
  y: number;
  color: string;
};

// Layout: map dominates the center. Medallions sit on the far left/right
// columns at three stacked elevations so they frame the map without crowding it.
const CATEGORIES: Category[] = [
  // LEFT column
  {
    id: "npcs",
    name: "NPCs",
    subtitle: "rostos na névoa",
    description:
      "Aliados, inimigos, neutros e desconhecidos. Quem sussurra nos becos do porto e quem janta nos salões nobres.",
    icon: VenetianMask,
    engraving: engNpcs,
    x: 8,
    y: 30,
    color: "var(--color-cat-npcs)",
  },
  {
    id: "grupo",
    name: "Guilda",
    subtitle: "os que caminham juntos",
    description:
      "Personagens dos jogadores, relações, objetivos do grupo, status atuais e anotações da party.",
    icon: Users,
    engraving: engGrupo,
    x: 7,
    y: 55,
    color: "var(--color-cat-group)",
  },
  {
    id: "itens",
    name: "Itens",
    subtitle: "relíquias & pistas",
    description: "Itens mágicos, documentos, pistas físicas e artefatos recolhidos pela companhia.",
    icon: Gem,
    engraving: engItens,
    x: 8,
    y: 80,
    color: "var(--color-cat-items)",
  },
  // RIGHT column
  {
    id: "quests",
    name: "Quests",
    subtitle: "contratos abertos",
    description:
      "Missões ativas, concluídas, falhadas e contratos esquecidos numa gaveta empoeirada.",
    icon: ScrollText,
    engraving: engQuests,
    x: 92,
    y: 30,
    color: "var(--color-cat-quests)",
  },
  {
    id: "bolsa",
    name: "Bolsa",
    subtitle: "itens diversos",
    description:
      "A bolsa da companhia — cordas, tochas, rações, ferramentas e tudo mais que se leva pelo caminho.",
    icon: Backpack,
    engraving: engMisterios,
    x: 93,
    y: 55,
    color: "var(--color-cat-mysteries)",
  },
  {
    id: "pocoes",
    name: "Poções",
    subtitle: "frascos & elixires",
    description:
      "Inventário de poções do grupo — tinturas comuns, elixires raros e essências guardadas para a hora certa.",
    icon: FlaskRound,
    engraving: engFaccoes,
    x: 92,
    y: 80,
    color: "var(--color-cat-factions)",
  },
  // Map cartouche — meta entry, rendered as the central inline stage
  {
    id: "mapa",
    name: "Mapa",
    subtitle: "rotas & marcos",
    description:
      "Mapa interativo de Belamar, com bairros, lojas, tavernas e marcadores ligados a NPCs e quests.",
    icon: Compass,
    x: 50,
    y: 52,
    color: "var(--color-cat-map)",
  },
];

function BelamarBoard() {
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusMarker, setFocusMarker] = useState<string | null>(null);
  const [weather, setWeather] = useWeather();

  const onSelectCategory = (c: Category) => {
    if (c.id === "mapa") {
      setMapOpen(true);
      return;
    }
    setSelected(c);
  };

  const focusMarkerOnMap = (markerId: string) => {
    setSelected(null);
    setFocusMarker(markerId);
    setMapOpen(true);
  };

  const medallions = CATEGORIES.filter((c) => c.id !== "mapa");

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: `url(${tableBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "oklch(0.12 0.02 30)",
      }}
    >
      {/* heavy edge vignette for cinematic depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 35%, oklch(0.06 0.02 30 / 0.55) 80%, oklch(0.04 0.01 25 / 0.85) 100%)",
        }}
      />

      {/* warm candle glow (matches the candle baked into the bg, top-center) */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[680px] -translate-x-1/2 flicker"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.85 0.18 75 / 0.32) 0%, transparent 65%)",
        }}
      />

      {/* dust particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-[oklch(0.92_0.05_75)]/40 dust-mote"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 7.3) % 100}%`,
              top: `${(i * 11.7) % 100}%`,
              animationDelay: `${i * 1.1}s`,
              animationDuration: `${14 + (i % 5) * 3}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      {/* TOP: slim world bar (date, clima, lua, evento) */}
      <TopWorldBar setWeather={setWeather} />

      {/* CENTER: prominent inline Mapa de Belamar — heart of the interface */}
      <MapStage onOpen={() => setMapOpen(true)} />

      {/* Medallions (engraved seals) framing the map */}
      {medallions.map((c) => (
        <CategoryNode
          key={c.id}
          category={c}
          isHovered={hovered === c.id}
          onHover={setHovered}
          onSelect={() => onSelectCategory(c)}
        />
      ))}

      {/* Decorative bottom bar */}
      <DecorBar onOpenNotes={() => setNotesOpen(true)} />

      <SidePanel
        category={selected}
        onClose={() => setSelected(null)}
        onFocusMarker={focusMarkerOnMap}
      />
      <MapDrawer
        open={mapOpen}
        onClose={() => {
          setMapOpen(false);
          setFocusMarker(null);
        }}
        focusMarkerId={focusMarker}
      />
      <NotesDrawer open={notesOpen} onClose={() => setNotesOpen(false)} />
      <WeatherOverlay weather={weather} />
    </div>
  );
}

function CategoryNode({
  category,
  isHovered,
  onHover,
  onSelect,
}: {
  category: Category;
  isHovered: boolean;
  onHover: (id: CategoryId | null) => void;
  onSelect: () => void;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${category.x}%`, top: `${category.y}%` }}
      onMouseEnter={() => onHover(category.id)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        onClick={onSelect}
        aria-label={category.name}
        className="group relative flex h-[124px] w-[124px] items-center justify-center outline-none"
      >
        {/* Warm halo on hover (no neon, just candle glow) */}
        <span
          className="pointer-events-none absolute inset-[-18px] rounded-full transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle, oklch(0.85 0.18 75 / 0.45) 0%, transparent 65%)",
            opacity: isHovered ? 1 : 0,
            filter: "blur(8px)",
          }}
        />

        {/* Outer brass rim */}
        <span
          className="absolute inset-0 rounded-full transition-transform duration-500"
          style={{
            background:
              "conic-gradient(from 210deg, oklch(0.55 0.08 65), oklch(0.32 0.04 50), oklch(0.62 0.1 75), oklch(0.28 0.03 45), oklch(0.55 0.08 65))",
            boxShadow: isHovered
              ? "0 0 24px oklch(0.78 0.15 70 / 0.55), 0 10px 22px oklch(0 0 0 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.2)"
              : "0 8px 18px oklch(0 0 0 / 0.65), inset 0 1px 0 oklch(1 0 0 / 0.15)",
            transform: isHovered ? "scale(1.04)" : "scale(1)",
          }}
        />

        {/* Inner ornamental ring */}
        <span
          className="absolute inset-[6px] rounded-full"
          style={{
            border: "1px solid oklch(0.72 0.13 75 / 0.6)",
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.88 0.06 78) 0%, oklch(0.7 0.07 70) 65%, oklch(0.45 0.05 55) 100%)",
            boxShadow: "inset 0 2px 6px oklch(0 0 0 / 0.25)",
          }}
        />

        {/* Decorative diamond marks at NSEW (engraved look) */}
        {[0, 90, 180, 270].map((deg) => (
          <span
            key={deg}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rotate-45 bg-[oklch(0.35_0.05_45)]/70"
            style={{
              transform: `translate(-50%, -50%) rotate(45deg) translateY(-55px) rotate(${deg}deg)`,
            }}
          />
        ))}

        {/* Engraving */}
        {category.engraving && (
          <img
            src={category.engraving}
            alt=""
            aria-hidden
            className="relative z-10 h-[88px] w-[88px] select-none object-contain transition-transform duration-500 group-hover:scale-105"
            style={
              {
                filter: isHovered
                  ? "sepia(0.6) saturate(1.1) drop-shadow(0 2px 3px oklch(0 0 0 / 0.4))"
                  : "sepia(0.5) saturate(0.95) drop-shadow(0 1px 2px oklch(0 0 0 / 0.35))",
                WebkitUserDrag: "none",
              } as React.CSSProperties
            }
          />
        )}
      </button>

      {/* Label */}
      <div
        className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-center transition-all duration-300"
        style={{
          opacity: isHovered ? 1 : 0.95,
        }}
      >
        <div
          className="font-[family-name:var(--font-display)] text-[15px] tracking-[0.32em]"
          style={{
            color: "oklch(0.88 0.05 75)",
            textShadow: "0 1px 0 oklch(0 0 0 / 0.9), 0 0 12px oklch(0 0 0 / 0.7)",
          }}
        >
          {category.name}
        </div>
        <div
          className="mx-auto mt-1 h-px transition-all duration-300"
          style={{
            width: isHovered ? 64 : 32,
            background:
              "linear-gradient(to right, transparent, oklch(0.72 0.13 75 / 0.85), transparent)",
          }}
        />
        <div
          className="mt-1 font-[family-name:var(--font-script)] text-[11px] italic transition-opacity duration-300"
          style={{
            color: "oklch(0.85 0.05 75)",
            opacity: isHovered ? 0.85 : 0,
          }}
        >
          {category.subtitle}
        </div>
      </div>
    </div>
  );
}

function MapStage({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "min(64vw, 880px)",
      }}
    >
      <div
        className="pointer-events-auto relative w-full overflow-hidden rounded-md"
        style={{
          aspectRatio: "16 / 11",
          border: "1px solid oklch(0.55 0.08 65 / 0.6)",
          boxShadow:
            "0 30px 80px oklch(0 0 0 / 0.7), 0 0 0 6px oklch(0.16 0.02 30 / 0.85), 0 0 0 7px oklch(0.55 0.08 65 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.08)",
          background: "oklch(0.1 0.02 30)",
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label="Abrir mapa de Belamar"
          className="group absolute inset-0 z-0 block w-full outline-none"
        >
          {/* map image */}
          <img
            src={mapImg}
            alt="Mapa de Belamar"
            className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            style={
              {
                filter: "sepia(0.18) saturate(0.95) brightness(0.92)",
                WebkitUserDrag: "none",
              } as React.CSSProperties
            }
          />
          {/* cinematic vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, transparent 45%, oklch(0.06 0.02 30 / 0.55) 90%), linear-gradient(180deg, oklch(0.08 0.02 30 / 0.25) 0%, transparent 30%, transparent 65%, oklch(0.06 0.02 30 / 0.6) 100%)",
            }}
          />
          {/* warm corner glow on hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, oklch(0.85 0.18 75 / 0.18) 0%, transparent 60%)",
            }}
          />

          {/* corner ornaments */}
          {[
            ["left-2 top-2", "rotate-0"],
            ["right-2 top-2", "rotate-90"],
            ["right-2 bottom-2", "rotate-180"],
            ["left-2 bottom-2", "-rotate-90"],
          ].map(([pos, rot]) => (
            <span
              key={pos}
              className={`pointer-events-none absolute ${pos} h-6 w-6 ${rot}`}
              style={{
                borderTop: "1px solid oklch(0.72 0.13 75 / 0.7)",
                borderLeft: "1px solid oklch(0.72 0.13 75 / 0.7)",
              }}
            />
          ))}

          {/* bottom caption */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-3 pt-10">
            <div>
              <div className="flex items-center gap-2 text-[oklch(0.88_0.05_75)]">
                <Compass size={16} strokeWidth={1.3} className="ring-spin" />
                <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[0.32em]">
                  MAPA DE BELAMAR
                </h2>
              </div>
              <p className="mt-0.5 font-[family-name:var(--font-script)] text-[12px] italic text-[oklch(0.85_0.05_75)]/80">
                Passe o mouse sobre as regiões — clique para abrir o mapa.
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.28em] transition-colors"
              style={{
                borderColor: "oklch(0.72 0.13 75 / 0.6)",
                color: "oklch(0.9 0.06 75)",
                background: "oklch(0.12 0.02 30 / 0.55)",
              }}
            >
              <Search size={12} /> abrir mapa
            </span>
          </div>
        </button>

        {/* Interactive region hotspots overlay */}
        <RegionHotspots onOpen={onOpen} />
      </div>
    </div>
  );
}

function DecorBar({ onOpenNotes }: { onOpenNotes: () => void }) {
  const items = [
    { icon: Newspaper, label: "Notícias" },
    { icon: BookOpen, label: "Diário" },
    { icon: Feather, label: "Anotações", onClick: onOpenNotes },
    { icon: ImageIcon, label: "Galeria" },
    { icon: FileText, label: "Relatórios" },
  ];
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
      <div
        className="flex items-center gap-2 rounded-sm px-3 py-2"
        style={{
          background: "linear-gradient(180deg, oklch(0.18 0.025 30) 0%, oklch(0.1 0.015 25) 100%)",
          border: "1px solid oklch(0.45 0.05 55 / 0.6)",
          borderTopColor: "oklch(0.62 0.1 70 / 0.7)",
          boxShadow:
            "0 10px 26px oklch(0 0 0 / 0.7), inset 0 1px 0 oklch(0.78 0.15 70 / 0.18), inset 0 -1px 0 oklch(0 0 0 / 0.4)",
        }}
      >
        {items.map(({ icon: I, label, onClick }, idx) => (
          <Fragment key={label}>
            {idx > 0 && (
              <span
                className="h-9 w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, oklch(0.55 0.08 65 / 0.4), transparent)",
                }}
              />
            )}
            <button
              type="button"
              onClick={onClick}
              disabled={!onClick}
              className="group flex flex-col items-center gap-1 rounded-sm px-4 py-1 transition-all duration-300 enabled:hover:bg-[oklch(0.78_0.15_70_/_0.08)] disabled:cursor-default"
            >
              <I
                size={16}
                strokeWidth={1.4}
                className="text-[oklch(0.78_0.13_72)]/80 transition-all group-enabled:group-hover:text-[oklch(0.85_0.16_75)] group-enabled:group-hover:[filter:drop-shadow(0_0_6px_oklch(0.78_0.15_70/0.6))]"
              />
              <span className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.28em] text-[oklch(0.78_0.13_72)]/70 group-enabled:group-hover:text-[oklch(0.88_0.08_75)]">
                {label}
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const SESSION_NOTES_KEY = "belamar.session-notes";

type SessionNote = {
  id: string;
  memberId: string;
  memberName: string;
  body: string;
};

function loadSessionNotes(): SessionNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_NOTES_KEY);
    return raw ? (JSON.parse(raw) as SessionNote[]) : [];
  } catch {
    return [];
  }
}

function saveSessionNotes(notes: SessionNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(notes));
}

function NotesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [memberId, setMemberId] = useState(PARTY[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNotes(loadSessionNotes());
    setMemberId((current) => current || PARTY[0]?.id || "");
  }, [open]);

  const resetForm = () => {
    setBody("");
    setEditingId(null);
    setMemberId(PARTY[0]?.id ?? "");
  };

  const persist = (next: SessionNote[]) => {
    setNotes(next);
    saveSessionNotes(next);
  };

  const saveNote = () => {
    const trimmed = body.trim();
    const member = PARTY.find((partyMember) => partyMember.id === memberId) ?? PARTY[0];
    if (!trimmed || !member) return;

    if (editingId) {
      persist(
        notes.map((note) =>
          note.id === editingId
            ? { ...note, memberId: member.id, memberName: member.name, body: trimmed }
            : note,
        ),
      );
    } else {
      persist([
        {
          id: `note-${Date.now()}`,
          memberId: member.id,
          memberName: member.name,
          body: trimmed,
        },
        ...notes,
      ]);
    }

    resetForm();
  };

  const editNote = (note: SessionNote) => {
    setEditingId(note.id);
    setMemberId(note.memberId);
    setBody(note.body);
  };

  const removeNote = (id: string) => {
    persist(notes.filter((note) => note.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/50 transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`belamar-drawer-header fixed right-0 top-0 z-[90] h-full w-full max-w-[440px] transform transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundImage: `url(${parchmentImg})`,
          backgroundSize: "cover",
          boxShadow: "-20px 0 60px oklch(0 0 0 / 0.7)",
        }}
      >
        <div className="absolute inset-0 bg-[oklch(0.92_0.05_80)]/40" />
        <div className="relative flex h-full flex-col p-10">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-[var(--color-ink)] transition-colors hover:bg-[oklch(0.25_0.04_35)]/10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                border: "1px solid var(--color-ember)",
                background: "oklch(0.96 0.04 80 / 0.6)",
              }}
            >
              <Feather size={24} strokeWidth={1.4} style={{ color: "var(--color-ember)" }} />
            </div>
            <div>
              <h2 className="ink-text text-2xl">Anotações</h2>
              <p className="font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/70">
                comentários por personagem
              </p>
            </div>
          </div>

          <div
            className="my-8 h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.25 0.04 35 / 0.4), transparent)",
            }}
          />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            <div className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
                  {editingId ? "Editar comentário" : "Nova anotação"}
                </p>
                <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/45">
                  salvo localmente
                </span>
              </div>

              <select
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className="mb-3 w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/60 p-2.5 font-[family-name:var(--font-body)] text-[14.5px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]/50"
              >
                {PARTY.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Escreva uma anotação, suspeita ou comentário..."
                className="min-h-[150px] w-full resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-3 font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
              />

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-sm border border-[var(--color-ink)]/25 px-3 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--color-ink)]/10"
                >
                  limpar
                </button>
                <button
                  type="button"
                  onClick={saveNote}
                  className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-ember)]/70 bg-[oklch(0.96_0.04_80)]/60 px-3 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink)] transition-colors hover:bg-[oklch(0.96_0.04_80)]/85 disabled:opacity-35"
                  disabled={!body.trim()}
                >
                  <Feather size={12} /> salvar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-[var(--color-ink)]/15 pb-1">
                <h3 className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.32em] text-[var(--color-ink)]/75">
                  Salvas
                </h3>
                <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/50">
                  {notes.length} comentários
                </span>
              </div>

              {notes.length === 0 ? (
                <p className="rounded border border-dashed border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/30 p-6 text-center font-[family-name:var(--font-script)] italic text-[var(--color-ink)]/55">
                  Nenhuma anotação salva ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/35 p-4"
                    >
                      <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.26em] text-[var(--color-ink)]/60">
                        {note.memberName}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-body)] text-[14.5px] leading-relaxed text-[var(--color-ink)]/85">
                        {note.body}
                      </p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editNote(note)}
                          className="rounded-sm border border-[var(--color-ink)]/25 px-2 py-1 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--color-ink)]/10"
                        >
                          editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNote(note.id)}
                          className="rounded-sm border border-[var(--color-cat-danger)]/50 px-2 py-1 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-cat-danger)] transition-colors hover:bg-[var(--color-cat-danger)]/10"
                        >
                          remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidePanel({
  category,
  onClose,
  onFocusMarker,
}: {
  category: Category | null;
  onClose: () => void;
  onFocusMarker?: (markerId: string) => void;
}) {
  const open = !!category;
  const Icon = category?.icon;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/50 transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`belamar-drawer-header fixed right-0 top-0 z-[90] h-full w-full max-w-[440px] transform transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundImage: `url(${parchmentImg})`,
          backgroundSize: "cover",
          boxShadow: "-20px 0 60px oklch(0 0 0 / 0.7)",
        }}
      >
        <div className="absolute inset-0 bg-[oklch(0.92_0.05_80)]/40" />
        <div className="relative flex h-full flex-col p-10">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-[var(--color-ink)] transition-colors hover:bg-[oklch(0.25_0.04_35)]/10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          {category && Icon && (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    border: `1px solid ${category.color}`,
                    background: "oklch(0.96 0.04 80 / 0.6)",
                  }}
                >
                  <Icon size={24} strokeWidth={1.4} style={{ color: category.color }} />
                </div>
                <div>
                  <h2 className="ink-text text-2xl">{category.name}</h2>
                  <p className="font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/70">
                    {category.subtitle}
                  </p>
                </div>
              </div>

              <div
                className="my-8 h-px w-full"
                style={{
                  background:
                    "linear-gradient(to right, transparent, oklch(0.25 0.04 35 / 0.4), transparent)",
                }}
              />

              <div className="flex-1 overflow-y-auto pr-1">
                {category.id === "grupo" ? (
                  <PartyPanel />
                ) : category.id === "npcs" ? (
                  <NpcsPanel />
                ) : category.id === "quests" ? (
                  <QuestsPanel onFocusMarker={onFocusMarker} />
                ) : (
                  <CategoryPlaceholder category={category} />
                )}
              </div>

              <div className="pt-6">
                <p className="text-center font-[family-name:var(--font-script)] text-xs italic text-[var(--color-ink)]/50">
                  — assinatura do cronista —
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

const NOTES_KEY = "belamar.category-notes";

function CategoryPlaceholder({ category }: { category: Category }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const all = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}");
      setNote(all[category.id] ?? "");
    } catch {
      setNote("");
    }
  }, [category.id]);

  const updateNote = (value: string) => {
    setNote(value);
    if (typeof window === "undefined") return;
    try {
      const all = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}");
      all[category.id] = value;
      localStorage.setItem(NOTES_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5">
      <p className="font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-ink)]/80">
        {category.description}
      </p>

      <CategoryLore id={category.id} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Notas de Bandolim
          </p>
          <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/45">
            anotações salvas localmente
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => updateNote(e.target.value)}
          placeholder="Vá adicionando informações conforme a campanha avança…"
          className="min-h-[260px] w-full resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-4 font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
          style={{ boxShadow: "inset 0 1px 2px oklch(0 0 0 / 0.08)" }}
        />
      </div>
    </div>
  );
}

function CategoryLore({ id }: { id: CategoryId }) {
  if (id === "pocoes") {
    return <PotionsList />;
  }
  if (id === "itens") {
    return <ItemsList />;
  }
  if (id === "bolsa") {
    return <BagList />;
  }
  void ERAS;
  void FIGURES;
  void FIGURES_INTRO;
  void CITY_OVERVIEW;
  return null;
}
