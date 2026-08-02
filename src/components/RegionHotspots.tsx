import { useState } from "react";
import { MapPin } from "lucide-react";
import mapImg from "@/assets/belamar-map.jpg";

type Stat = { label: string; value: number };

export type Region = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  habitantes: string;
  guilda: string;
  local: string;
  rumores: string[];
  /** position of the hotspot dot, in % of the map preview */
  x: number;
  y: number;
  /** object-position values for cropping the same map image as a "photo" */
  cropX: number;
  cropY: number;
  stats: Stat[];
};

export const REGIONS: Region[] = [
  {
    id: "vila-clara",
    name: "Vila Clara",
    tagline: "Onde os nomes valem ouro.",
    description:
      "Bairro nobre cercado por muros altos e guardas 24h. Ruas limpas, jardins cuidados e portões que só abrem com documentação.",
    habitantes: "Famílias antigas, comerciantes ricos.",
    guilda: "Casa dos Selos",
    local: "Praça do Lírio",
    rumores: ["Os jardins escondem cofres.", "Nem todo guarda serve à cidade."],
    x: 73,
    y: 47,
    cropX: 78,
    cropY: 50,
    stats: [
      { label: "Riqueza", value: 92 },
      { label: "Corrupção", value: 55 },
      { label: "Segurança", value: 88 },
      { label: "Comércio", value: 50 },
    ],
  },
  {
    id: "valedouro",
    name: "Valedouro",
    tagline: "Onde o ouro nunca dorme.",
    description:
      "Coração comercial de Belamar. Mercados, contratos e ouro circulando o tempo todo, sob regras próprias — inclusive a proibição do álcool.",
    habitantes: "Mercadores, escribas, agiotas.",
    guilda: "Câmara de Valedouro",
    local: "Mercado Central",
    rumores: ["Contratos somem do arquivo.", "Há um mercado abaixo do mercado."],
    x: 47,
    y: 50,
    cropX: 50,
    cropY: 50,
    stats: [
      { label: "Riqueza", value: 96 },
      { label: "Corrupção", value: 70 },
      { label: "Segurança", value: 70 },
      { label: "Comércio", value: 98 },
    ],
  },
  {
    id: "miravento",
    name: "Miravento",
    tagline: "Onde se lê o céu e o mar.",
    description:
      "Torres altas e observatórios. Abriga a maior escola da cidade; suas torres mantêm a meteorologia afiada e a defesa contra ataques.",
    habitantes: "Estudiosos, inventores, navegadores.",
    guilda: "Torres de Miravento",
    local: "Observatório Maior",
    rumores: ["Uma torre não responde mais.", "Há livros lacrados há séculos."],
    x: 20,
    y: 28,
    cropX: 18,
    cropY: 25,
    stats: [
      { label: "Riqueza", value: 65 },
      { label: "Corrupção", value: 25 },
      { label: "Segurança", value: 80 },
      { label: "Comércio", value: 45 },
    ],
  },
  {
    id: "lago-da-garoa",
    name: "Lago da Garoa",
    tagline: "A chuva que nunca cessa.",
    description:
      "Bonito, silencioso e coberto por uma garoa que nunca para. Templos, igrejas e o cemitério principal — ideal para encontros discretos.",
    habitantes: "Clérigos, coveiros, exilados.",
    guilda: "Ordem da Garoa",
    local: "Cemitério Maior",
    rumores: ["Lápides mudam de lugar.", "A garoa carrega vozes."],
    x: 60,
    y: 27,
    cropX: 62,
    cropY: 28,
    stats: [
      { label: "Riqueza", value: 40 },
      { label: "Corrupção", value: 30 },
      { label: "Segurança", value: 65 },
      { label: "Comércio", value: 25 },
    ],
  },
  {
    id: "colina-da-aurora",
    name: "Colina da Aurora",
    tagline: "Onde vivem os conselheiros.",
    description:
      "Região mais nobre da cidade. Cúpulas douradas, jardins suspensos e o silêncio pesado do poder. Sede do Conselho da Maré.",
    habitantes: "Nobres, políticos, veteranos.",
    guilda: "Casa da Última Porta, Conselho da Maré",
    local: "Sino da Aurora",
    rumores: ["Alguns conselheiros não envelhecem.", "O sino toca antes de tragédias."],
    x: 43,
    y: 18,
    cropX: 42,
    cropY: 12,
    stats: [
      { label: "Riqueza", value: 98 },
      { label: "Corrupção", value: 90 },
      { label: "Segurança", value: 90 },
      { label: "Comércio", value: 60 },
    ],
  },
  {
    id: "bairro-das-escadas",
    name: "Bairro das Escadas",
    tagline: "Fácil entrar. Difícil voltar.",
    description:
      "Ruas estreitas, caminhos confusos e construções apertadas. Lar de trabalhadores, contatos discretos e pessoas que preferem sumir.",
    habitantes: "Trabalhadores, informantes.",
    guilda: "Liga dos Andares",
    local: "Escada do Vento",
    rumores: ["Há um andar que ninguém usa.", "Algumas portas dão em becos errados."],
    x: 16,
    y: 60,
    cropX: 12,
    cropY: 60,
    stats: [
      { label: "Riqueza", value: 30 },
      { label: "Corrupção", value: 55 },
      { label: "Segurança", value: 35 },
      { label: "Comércio", value: 40 },
    ],
  },
  {
    id: "morro-das-cordas",
    name: "Morro das Cordas",
    tagline: "Casas penduradas no abismo.",
    description:
      "Zona de trabalho pesado junto ao porto. Casas empilhadas em encostas instáveis, mantidas por um sistema de cordas inventado por um construtor pobre.",
    habitantes: "Estivadores, cordoeiros, pescadores.",
    guilda: "Sindicato das Cordas",
    local: "Praça Pendente",
    rumores: ["Cordas se rompem sozinhas.", "Há quem viva entre as casas."],
    x: 40,
    y: 72,
    cropX: 40,
    cropY: 78,
    stats: [
      { label: "Riqueza", value: 25 },
      { label: "Corrupção", value: 45 },
      { label: "Segurança", value: 40 },
      { label: "Comércio", value: 55 },
    ],
  },
  {
    id: "ancora-baixa",
    name: "Âncora Baixa",
    tagline: "Onde a cidade aposta no escuro.",
    description:
      "Antigo porto abandonado, hoje território de jogos e negócios ilegais. Apesar disso, extremamente organizado pela Maré Negra.",
    habitantes: "Apostadores, contrabandistas, ex-marinheiros.",
    guilda: "Maré Negra",
    local: "Doca Cega",
    rumores: ["Há um navio que ninguém carrega.", "Quem deve à Maré, paga no mar."],
    x: 17,
    y: 90,
    cropX: 8,
    cropY: 95,
    stats: [
      { label: "Riqueza", value: 55 },
      { label: "Corrupção", value: 95 },
      { label: "Segurança", value: 50 },
      { label: "Comércio", value: 70 },
    ],
  },
  {
    id: "pedra-muda",
    name: "Pedra Muda",
    tagline: "Ninguém sai com histórias.",
    description:
      "A prisão da cidade. Local mais antigo de Belamar, fundada pelo primeiro rei. Poucos falam dela — menos ainda saem com histórias para contar.",
    habitantes: "Carcereiros, condenados, esquecidos.",
    guilda: "Guarda da Pedra",
    local: "Fortaleza Muda",
    rumores: ["Há celas sem porta.", "O primeiro rei ainda está lá."],
    x: 72,
    y: 78,
    cropX: 78,
    cropY: 85,
    stats: [
      { label: "Riqueza", value: 15 },
      { label: "Corrupção", value: 60 },
      { label: "Segurança", value: 95 },
      { label: "Comércio", value: 5 },
    ],
  },
];

export function RegionHotspots({ onOpen }: { onOpen: () => void }) {
  const [active, setActive] = useState<Region | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {REGIONS.map((r) => (
        <button
          key={r.id}
          type="button"
          onMouseEnter={() => setActive(r)}
          onMouseLeave={() => setActive((cur) => (cur?.id === r.id ? null : cur))}
          onFocus={() => setActive(r)}
          onBlur={() => setActive((cur) => (cur?.id === r.id ? null : cur))}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={r.name}
          className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}
        >
          {/* Tiny dot positioned over the map's number label — discreet until hovered */}
          <span
            className="block rounded-full transition-all duration-300"
            style={{
              width: active?.id === r.id ? 8 : 5,
              height: active?.id === r.id ? 8 : 5,
              background:
                active?.id === r.id ? "oklch(0.85 0.18 75 / 0.95)" : "oklch(0.85 0.18 75 / 0.55)",
              boxShadow:
                active?.id === r.id
                  ? "0 0 0 1px oklch(0.2 0.02 30 / 0.85), 0 0 10px oklch(0.85 0.18 75 / 0.6)"
                  : "0 0 4px oklch(0.85 0.18 75 / 0.35)",
            }}
          />
        </button>
      ))}

      {active && <RegionPopover region={active} />}
    </div>
  );
}

function RegionPopover({ region }: { region: Region }) {
  // Decide popup horizontal anchor so it never escapes the map preview
  const placeLeft = region.x > 55;
  return (
    <div
      className="pointer-events-none absolute z-30 w-[260px] -translate-y-1/2"
      style={{
        left: placeLeft ? `calc(${region.x}% - 18px)` : `calc(${region.x}% + 18px)`,
        top: `${Math.min(Math.max(region.y, 22), 78)}%`,
        transform: placeLeft ? "translate(-100%, -50%)" : "translate(0, -50%)",
      }}
    >
      <div
        className="overflow-hidden rounded-md border"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.2 0.028 38 / 0.97), oklch(0.11 0.018 32 / 0.97))",
          borderColor: "oklch(0.72 0.13 75 / 0.5)",
          boxShadow: "0 18px 40px oklch(0 0 0 / 0.7)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Cropped map photo */}
        <div
          className="relative h-[100px] w-full"
          style={{
            backgroundImage: `url(${mapImg})`,
            backgroundSize: "320% auto",
            backgroundPosition: `${region.cropX}% ${region.cropY}%`,
            filter: "saturate(1.05) brightness(0.92)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, oklch(0.11 0.018 32 / 0.95) 100%)",
            }}
          />
          <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center gap-1.5">
            <MapPin size={11} className="text-[oklch(0.82_0.16_70)]" />
            <span className="font-[family-name:var(--font-display)] text-[8.5px] uppercase tracking-[0.3em] text-[oklch(0.82_0.16_70)]">
              Bairro
            </span>
          </div>
        </div>

        <div className="px-3 py-2.5">
          <h3
            className="font-[family-name:var(--font-display)] text-[14px] tracking-[0.16em]"
            style={{ color: "oklch(0.92 0.06 75)" }}
          >
            {region.name}
          </h3>
          <p className="font-[family-name:var(--font-script)] text-[11px] italic text-[oklch(0.85_0.05_75)]/75">
            {region.tagline}
          </p>

          <p className="mt-1.5 font-[family-name:var(--font-body)] text-[11.5px] leading-snug text-[oklch(0.88_0.05_75)]/85">
            {region.description}
          </p>

          {/* Stats */}
          <div className="mt-2 space-y-1">
            {region.stats.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-[oklch(0.78_0.06_75)]/70">
                  <span>{s.label}</span>
                  <span className="text-[oklch(0.82_0.16_70)]">{s.value}%</span>
                </div>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-[oklch(0.3_0.03_40)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.value}%`,
                      background:
                        "linear-gradient(to right, oklch(0.72 0.13 65), oklch(0.85 0.18 75))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick tags */}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Tag label="Habitantes" value={region.habitantes} />
            <Tag label="Guilda" value={region.guilda} />
            <Tag label="Local" value={region.local} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-sm border px-1.5 py-1"
      style={{
        background: "oklch(0.16 0.02 32 / 0.7)",
        borderColor: "oklch(0.55 0.08 65 / 0.35)",
      }}
    >
      <div className="font-[family-name:var(--font-display)] text-[7.5px] uppercase tracking-[0.22em] text-[oklch(0.82_0.16_70)]">
        {label}
      </div>
      <div className="mt-0.5 font-[family-name:var(--font-body)] text-[9.5px] leading-snug text-[oklch(0.88_0.05_75)]/90">
        {value}
      </div>
    </div>
  );
}
