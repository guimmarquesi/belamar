import { useEffect, useMemo, useState } from "react";
import { Compass, MapPin, Moon, Thermometer, Wind } from "lucide-react";
import type { Weather } from "@/components/WeatherControl";

type OpenMeteoCurrent = {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  timezone?: string;
};

const STORAGE_KEY = "belamar:weather-auto";
const STORAGE_TS = "belamar:weather-auto-ts";
const REFRESH_MS = 30 * 60 * 1000; // 30 minutes

// Belamar é uma cidade costeira fictícia — usamos coordenadas de uma cidade
// portuária real (Porto, PT) só para alimentar o Open-Meteo.
const LAT = 41.15;
const LON = -8.61;

function mapWeatherCode(code: number): { weather: Weather; label: string } {
  if ([0].includes(code)) return { weather: "ensolarado", label: "Céu limpo" };
  if ([1].includes(code)) return { weather: "ensolarado", label: "Predominantemente limpo" };
  if ([2].includes(code)) return { weather: "nublado", label: "Parcialmente nublado" };
  if ([3].includes(code)) return { weather: "nublado", label: "Encoberto" };
  if ([45, 48].includes(code)) return { weather: "nevoa", label: "Névoa densa" };
  if ([51, 53, 55, 56, 57].includes(code)) return { weather: "chuvoso", label: "Garoa" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { weather: "chuvoso", label: "Chuva sobre o porto" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { weather: "nevoa", label: "Neve rara" };
  if ([95, 96, 99].includes(code)) return { weather: "tempestade", label: "Tempestade" };
  return { weather: "ensolarado", label: "Tempo brando" };
}

const MONTHS = [
  "Aurora",
  "Verglas",
  "Maremoto",
  "Florença",
  "Solstício",
  "Brasador",
  "Mareterna",
  "Crepúsculo",
  "Vendaval",
  "Néveos",
  "Lúmen",
  "Hibernal",
];
const WEEKDAYS = ["Lúadia", "Marédia", "Forjadia", "Astradia", "Bardia", "Velandia", "Solandia"];

function fantasyDate(d: Date) {
  const year = d.getFullYear() + 312; // Era da Maré
  return {
    weekday: WEEKDAYS[d.getDay()],
    day: d.getDate(),
    month: MONTHS[d.getMonth()],
    year,
  };
}

// Conway-style synodic moon phase (0..1)
function moonPhase(date: Date) {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14); // known new moon
  const days = (date.getTime() - ref) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic;
  const frac = phase / synodic;
  let name = "Nova";
  if (frac < 0.03 || frac > 0.97) name = "Nova";
  else if (frac < 0.22) name = "Crescente";
  else if (frac < 0.28) name = "Quarto Crescente";
  else if (frac < 0.47) name = "Gibosa Crescente";
  else if (frac < 0.53) name = "Cheia";
  else if (frac < 0.72) name = "Gibosa Minguante";
  else if (frac < 0.78) name = "Quarto Minguante";
  else name = "Minguante";
  return { frac, name };
}

export { fantasyDate, moonPhase, MoonGlyph, pickEvent };

const WORLD_EVENTS = [
  "Velas avistadas além do Farol Caído.",
  "Sinos de Vila Clara tocam por motivo desconhecido.",
  "Marinheiros do porto falam de um cardume prateado.",
  "Mercadores de Valedouro fecharam cedo hoje.",
  "Brumas incomuns descem sobre o Lago da Garoa.",
  "Pegadas estranhas na areia da Âncora Baixa.",
  "Um sino subaquático foi ouvido ao amanhecer.",
  "Caravanas chegam de Miravento com livros lacrados.",
  "A Maré Negra fez uma reunião extraordinária.",
  "Gaivotas voam em círculos sobre a Pedra Muda.",
];

function pickEvent(date: Date) {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  return WORLD_EVENTS[seed % WORLD_EVENTS.length];
}

function MoonGlyph({ frac, size = 36 }: { frac: number; size?: number }) {
  // Approximate illuminated portion as a clipped circle
  const illum = 0.5 - 0.5 * Math.cos(frac * Math.PI * 2);
  const waxing = frac < 0.5;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <radialGradient id="moon-surface" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="oklch(0.95 0.04 80)" />
          <stop offset="100%" stopColor="oklch(0.72 0.04 75)" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="16" fill="oklch(0.2 0.02 30)" />
      <g>
        <clipPath id="moon-clip">
          {waxing ? (
            <rect x="20" y="0" width="20" height="40" />
          ) : (
            <rect x="0" y="0" width="20" height="40" />
          )}
        </clipPath>
        <circle cx="20" cy="20" r="16" fill="url(#moon-surface)" clipPath="url(#moon-clip)" />
        <ellipse
          cx="20"
          cy="20"
          rx={16 * Math.abs(1 - illum * 2)}
          ry="16"
          fill={illum < 0.5 ? "oklch(0.2 0.02 30)" : "url(#moon-surface)"}
        />
      </g>
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="oklch(0.55 0.08 65 / 0.7)"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export function useAutoWeather(setWeather: (w: Weather) => void) {
  const [data, setData] = useState<{
    temp: number;
    wind: number;
    code: number;
    label: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let alive = true;
    const fetchWeather = async () => {
      try {
        const ts = Number(localStorage.getItem(STORAGE_TS) || 0);
        if (data && Date.now() - ts < REFRESH_MS) {
          const mapped = mapWeatherCode(data.code);
          setWeather(mapped.weather);
          return;
        }
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
        );
        if (!r.ok) return;
        const json: OpenMeteoResponse = await r.json();
        if (!alive || !json.current) return;
        const mapped = mapWeatherCode(json.current.weather_code);
        const next = {
          temp: Math.round(json.current.temperature_2m),
          wind: Math.round(json.current.wind_speed_10m),
          code: json.current.weather_code,
          label: mapped.label,
        };
        setData(next);
        setWeather(mapped.weather);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(STORAGE_TS, String(Date.now()));
      } catch {
        // silent — keep previous state
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

export function WorldHubPanel({ setWeather }: { setWeather: (w: Weather) => void }) {
  const auto = useAutoWeather(setWeather);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fdate = useMemo(() => fantasyDate(now), [now]);
  const moon = useMemo(() => moonPhase(now), [now]);
  const event = useMemo(() => pickEvent(now), [now]);
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-14 pb-16 pt-7 text-center">
      <div className="flex items-center gap-2 text-[var(--color-ink)]/80">
        <Compass size={16} strokeWidth={1.2} />
        <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.42em]">
          Crônica de Belamar
        </span>
      </div>

      <h1
        className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-[0.18em] md:text-3xl"
        style={{
          color: "var(--color-ink)",
          textShadow: "0 1px 0 oklch(0.95 0.04 80 / 0.5)",
        }}
      >
        BELAMAR
      </h1>

      {/* Date line */}
      <div className="mt-2 font-[family-name:var(--font-script)] text-[15px] italic text-[var(--color-ink)]/90">
        {fdate.weekday}, {fdate.day} de {fdate.month}{" "}
        <span className="opacity-70">· {fdate.year} EM</span>
      </div>
      <div className="mt-0.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink)]/65">
        Sino badala {timeStr}
      </div>

      {/* Decorative rule */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-px w-10 opacity-60"
          style={{ background: "linear-gradient(to right, transparent, var(--color-ink))" }}
        />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-ink)]/70">✦</span>
        <span
          className="h-px w-10 opacity-60"
          style={{ background: "linear-gradient(to left, transparent, var(--color-ink))" }}
        />
      </div>

      {/* Weather + Moon row */}
      <div className="mt-2 grid w-full max-w-[360px] grid-cols-2 gap-3 text-left">
        <div
          className="rounded-md border px-2.5 py-2"
          style={{
            background: "oklch(0.88 0.05 80 / 0.18)",
            borderColor: "oklch(0.45 0.06 50 / 0.35)",
          }}
        >
          <div className="flex items-center gap-1.5 text-[var(--color-ink)]/80">
            <Thermometer size={12} strokeWidth={1.4} />
            <span className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.28em]">
              No porto
            </span>
          </div>
          <div className="mt-0.5 font-[family-name:var(--font-display)] text-base tracking-wide text-[var(--color-ink)]">
            {auto ? `${auto.temp}°` : "—"}{" "}
            <span className="text-[10px] opacity-70">
              <Wind size={10} className="-mt-0.5 inline" /> {auto ? `${auto.wind} km/h` : ""}
            </span>
          </div>
          <div className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/80">
            {auto?.label ?? "consultando os ventos…"}
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-md border px-2.5 py-2"
          style={{
            background: "oklch(0.88 0.05 80 / 0.18)",
            borderColor: "oklch(0.45 0.06 50 / 0.35)",
          }}
        >
          <MoonGlyph frac={moon.frac} size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[var(--color-ink)]/80">
              <Moon size={12} strokeWidth={1.4} />
              <span className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.28em]">
                Lua
              </span>
            </div>
            <div className="font-[family-name:var(--font-display)] text-[12px] tracking-wide text-[var(--color-ink)]">
              {moon.name}
            </div>
            <div className="font-[family-name:var(--font-script)] text-[10px] italic text-[var(--color-ink)]/75">
              {Math.round((0.5 - 0.5 * Math.cos(moon.frac * Math.PI * 2)) * 100)}% iluminada
            </div>
          </div>
        </div>
      </div>

      {/* World event */}
      <div className="mt-2 flex max-w-[380px] items-start gap-1.5 text-left">
        <MapPin
          size={11}
          strokeWidth={1.4}
          className="mt-0.5 shrink-0 text-[var(--color-ink)]/70"
        />
        <p className="font-[family-name:var(--font-script)] text-[11px] italic leading-snug text-[var(--color-ink)]/85">
          {event}
        </p>
      </div>
    </div>
  );
}
