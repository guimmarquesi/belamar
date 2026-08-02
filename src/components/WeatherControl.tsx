import { useEffect, useMemo, useState } from "react";
import { Sun, Cloud, CloudRain, CloudLightning, Sparkles, ChevronDown } from "lucide-react";

export type Weather = "ensolarado" | "nublado" | "chuvoso" | "tempestade" | "nevoa";

const STORAGE_KEY = "belamar:weather";

const OPTIONS: { id: Weather; label: string; hint: string; icon: typeof Sun }[] = [
  { id: "ensolarado", label: "Ensolarado", hint: "luz quente, ar limpo", icon: Sun },
  { id: "nublado", label: "Nublado", hint: "céu coberto, luz difusa", icon: Cloud },
  { id: "chuvoso", label: "Chuvoso", hint: "garoa fina sobre os telhados", icon: CloudRain },
  { id: "tempestade", label: "Tempestade", hint: "raios distantes no porto", icon: CloudLightning },
  { id: "nevoa", label: "Névoa mágica", hint: "brumas com brilho arcano", icon: Sparkles },
];

export function useWeather(): [Weather, (w: Weather) => void] {
  const [weather, setWeather] = useState<Weather>("ensolarado");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY) as Weather | null;
    if (saved && OPTIONS.some((o) => o.id === saved)) setWeather(saved);
  }, []);
  const update = (w: Weather) => {
    setWeather(w);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, w);
  };
  return [weather, update];
}

export function WeatherSelector({
  weather,
  onChange,
}: {
  weather: Weather;
  onChange: (w: Weather) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.id === weather)!;
  const Icon = current.icon;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div
      className="pointer-events-auto fixed right-4 top-4 z-[70] select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Selecionar clima"
        className="group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-300"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.22 0.03 40 / 0.92), oklch(0.14 0.02 35 / 0.92))",
          borderColor: "oklch(0.55 0.08 65 / 0.55)",
          boxShadow: "0 6px 18px oklch(0 0 0 / 0.55), inset 0 1px 0 oklch(1 0 0 / 0.12)",
          color: "oklch(0.88 0.05 75)",
        }}
      >
        <Icon size={16} strokeWidth={1.4} className="opacity-90" />
        <span className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.28em]">
          {current.label}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.4}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute right-0 mt-2 w-[240px] origin-top-right overflow-hidden rounded-lg border transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(180deg, oklch(0.18 0.025 38 / 0.96), oklch(0.11 0.015 32 / 0.96))",
          borderColor: "oklch(0.55 0.08 65 / 0.55)",
          boxShadow: "0 16px 36px oklch(0 0 0 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        {OPTIONS.map((opt) => {
          const OptIcon = opt.icon;
          const active = opt.id === weather;
          return (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 border-b border-[oklch(0.55_0.08_65/0.18)] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[oklch(0.55_0.08_65/0.12)]"
              style={{ color: "oklch(0.88 0.05 75)" }}
            >
              <OptIcon
                size={18}
                strokeWidth={1.4}
                className="mt-0.5 shrink-0"
                style={{
                  color: active ? "oklch(0.82 0.16 70)" : "oklch(0.7 0.07 70)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.22em]">
                  {opt.label}
                </div>
                <div className="mt-0.5 font-[family-name:var(--font-script)] text-[11px] italic opacity-70">
                  {opt.hint}
                </div>
              </div>
              {active && (
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: "oklch(0.82 0.16 70)",
                    boxShadow: "0 0 8px oklch(0.82 0.16 70 / 0.8)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Atmospheric overlay rendered fixed over the entire app.
 * pointer-events-none so it never blocks the UI.
 * Effects are intentionally subtle.
 */
export function WeatherOverlay({ weather }: { weather: Weather }) {
  // Pre-compute deterministic positions so re-renders don't reshuffle particles.
  const raindrops = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        left: (i * 12.37) % 100,
        delay: (i % 13) * 0.13,
        duration: 0.55 + ((i * 7) % 40) / 100,
        opacity: 0.25 + ((i * 17) % 35) / 100,
        height: 14 + ((i * 5) % 18),
      })),
    [],
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        left: (i * 13.7 + 4) % 100,
        top: (i * 9.3 + 10) % 100,
        size: 2 + (i % 3),
        delay: (i % 11) * 0.4,
        duration: 4 + (i % 5),
      })),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden opacity-55 transition-opacity duration-700"
    >
      {/* ENSOLARADO — discreto, leve calor */}
      {weather === "ensolarado" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% -10%, oklch(0.92 0.14 85 / 0.08) 0%, transparent 55%)",
          }}
        />
      )}

      {/* NUBLADO — discreto */}
      {weather === "nublado" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.55 0.02 240 / 0.1) 0%, oklch(0.4 0.02 240 / 0.06) 100%)",
            }}
          />
          <div
            className="absolute inset-x-[-10%] top-0 h-[55%] belamar-clouds"
            style={{
              background:
                "radial-gradient(ellipse 40% 60% at 15% 30%, oklch(0.85 0.01 240 / 0.08), transparent 70%)," +
                "radial-gradient(ellipse 50% 55% at 55% 20%, oklch(0.9 0.01 240 / 0.07), transparent 70%)," +
                "radial-gradient(ellipse 45% 65% at 88% 35%, oklch(0.82 0.01 240 / 0.08), transparent 70%)",
              filter: "blur(8px)",
            }}
          />
        </>
      )}

      {/* CHUVOSO — discreto */}
      {weather === "chuvoso" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.35 0.05 240 / 0.1) 0%, oklch(0.18 0.04 240 / 0.06) 100%)",
            }}
          />
          {raindrops.slice(0, 38).map((d, i) => (
            <span
              key={i}
              className="absolute top-[-10%] w-px belamar-rain"
              style={{
                left: `${d.left}%`,
                height: `${d.height}px`,
                background: "linear-gradient(180deg, transparent, oklch(0.85 0.04 240 / 0.28))",
                opacity: d.opacity * 0.5,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.duration}s`,
              }}
            />
          ))}
        </>
      )}

      {/* TEMPESTADE — discreta */}
      {weather === "tempestade" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, oklch(0.12 0.03 250 / 0.16) 0%, oklch(0.05 0.02 250 / 0.32) 100%)",
            }}
          />
          {raindrops.slice(0, 55).map((d, i) => (
            <span
              key={i}
              className="absolute top-[-10%] w-px belamar-rain"
              style={{
                left: `${d.left}%`,
                height: `${d.height + 4}px`,
                background: "linear-gradient(180deg, transparent, oklch(0.78 0.05 240 / 0.4))",
                opacity: Math.min(0.5, d.opacity + 0.1),
                animationDelay: `${d.delay}s`,
                animationDuration: `${Math.max(0.4, d.duration - 0.1)}s`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-white belamar-lightning opacity-40" />
        </>
      )}

      {/* NÉVOA MÁGICA — discreta */}
      {weather === "nevoa" && (
        <>
          <div
            className="absolute inset-0 belamar-fog"
            style={{
              background:
                "radial-gradient(ellipse at 30% 60%, oklch(0.75 0.08 180 / 0.1) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, oklch(0.7 0.1 290 / 0.08) 0%, transparent 60%)",
            }}
          />
          {sparkles.slice(0, 14).map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full belamar-sparkle"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                background: "oklch(0.92 0.14 200)",
                boxShadow:
                  "0 0 5px oklch(0.85 0.18 200 / 0.55), 0 0 10px oklch(0.7 0.2 290 / 0.35)",
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
