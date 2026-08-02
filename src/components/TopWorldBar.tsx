import { useEffect, useMemo, useState } from "react";
import { Compass, MapPin, Moon, Thermometer, Wind } from "lucide-react";
import type { Weather } from "@/components/WeatherControl";
import {
  fantasyDate,
  moonPhase,
  MoonGlyph,
  pickEvent,
  useAutoWeather,
} from "@/components/WorldHub";

export function TopWorldBar({ setWeather }: { setWeather: (w: Weather) => void }) {
  const auto = useAutoWeather(setWeather);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const safeNow = now ?? new Date(0);
  const fdate = useMemo(() => fantasyDate(safeNow), [safeNow]);
  const moon = useMemo(() => moonPhase(safeNow), [safeNow]);
  const event = useMemo(() => pickEvent(safeNow), [safeNow]);
  const timeStr =
    mounted && now
      ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : "--:--";

  return (
    <div className="pointer-events-auto fixed left-1/2 top-3 z-[55] w-[min(96vw,1180px)] -translate-x-1/2">
      <div
        className="flex items-stretch gap-0 overflow-hidden rounded-md border"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.2 0.028 38 / 0.94), oklch(0.12 0.018 32 / 0.94))",
          borderColor: "oklch(0.55 0.08 65 / 0.5)",
          boxShadow:
            "0 14px 36px oklch(0 0 0 / 0.65), inset 0 1px 0 oklch(1 0 0 / 0.08), inset 0 -1px 0 oklch(0 0 0 / 0.4)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2 border-r border-[oklch(0.55_0.08_65/0.28)] px-4 py-2">
          <Compass size={16} strokeWidth={1.3} className="text-[oklch(0.82_0.16_70)]" />
          <div className="leading-tight">
            <div
              className="font-[family-name:var(--font-display)] text-[14px] tracking-[0.32em]"
              style={{ color: "oklch(0.92 0.06 75)" }}
            >
              BELAMAR
            </div>
            <div className="font-[family-name:var(--font-script)] text-[10px] italic text-[oklch(0.78_0.06_75)]/75">
              crônica viva
            </div>
          </div>
        </div>

        {/* Date */}
        <Cell title="Calendário">
          <div className="font-[family-name:var(--font-display)] text-[12px] tracking-wide text-[oklch(0.9_0.05_75)]">
            {fdate.weekday}, {fdate.day} de {fdate.month}
          </div>
          <div className="font-[family-name:var(--font-script)] text-[10.5px] italic text-[oklch(0.78_0.06_75)]/75">
            {fdate.year} EM · sino {timeStr}
          </div>
        </Cell>

        {/* Weather */}
        <Cell title="Clima no porto" icon={<Thermometer size={11} strokeWidth={1.5} />}>
          <div className="font-[family-name:var(--font-display)] text-[13px] tracking-wide text-[oklch(0.9_0.05_75)]">
            {mounted && auto ? `${auto.temp}°` : "—"}
            <span className="ml-1.5 text-[10px] opacity-70">
              <Wind size={10} className="-mt-0.5 inline" />{" "}
              {mounted && auto ? `${auto.wind} km/h` : ""}
            </span>
          </div>
          <div className="font-[family-name:var(--font-script)] text-[10.5px] italic text-[oklch(0.78_0.06_75)]/80">
            {mounted ? (auto?.label ?? "consultando os ventos…") : "consultando os ventos…"}
          </div>
        </Cell>

        {/* Moon */}
        <Cell title="Lua" icon={<Moon size={11} strokeWidth={1.5} />}>
          <div className="flex items-center gap-2">
            <MoonGlyph frac={moon.frac} size={26} />
            <div>
              <div className="font-[family-name:var(--font-display)] text-[12px] tracking-wide text-[oklch(0.9_0.05_75)]">
                {moon.name}
              </div>
              <div className="font-[family-name:var(--font-script)] text-[10.5px] italic text-[oklch(0.78_0.06_75)]/75">
                {Math.round((0.5 - 0.5 * Math.cos(moon.frac * Math.PI * 2)) * 100)}% iluminada
              </div>
            </div>
          </div>
        </Cell>

        {/* World event */}
        <div className="hidden min-w-0 flex-1 items-center gap-2 px-4 py-2 md:flex">
          <MapPin size={12} strokeWidth={1.5} className="shrink-0 text-[oklch(0.82_0.16_70)]" />
          <p className="truncate font-[family-name:var(--font-script)] text-[12px] italic text-[oklch(0.86_0.05_75)]/90">
            {event}
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col justify-center border-r border-[oklch(0.55_0.08_65/0.22)] px-4 py-2">
      <div className="flex items-center gap-1.5 text-[oklch(0.78_0.06_75)]/70">
        {icon}
        <span className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.28em]">
          {title}
        </span>
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
