import { useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  X,
  Plus,
  Trash2,
  MousePointer2,
  Save,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import mapImg from "@/assets/belamar-map.jpg";
import parchmentImg from "@/assets/parchment.jpg";
import { MAP_MARKERS, MARKER_META, type MapMarker, type MarkerType } from "@/lib/map";
import { loadQuests, type Quest } from "@/lib/quests-store";
import { loadStoredNpcs, type StoredNpc } from "@/lib/npcs-store";
import { useCampaign } from "@/lib/campaign-context";
import { useDocument } from "@/lib/campaign-data";

const STORAGE_KEY = "belamar.custom-markers";
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type CustomMarker = MapMarker & { custom?: boolean; linkedNpcId?: string };
type Pan = { x: number; y: number };
type Size = { width: number; height: number };
type MapBounds = Size & { left: number; top: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getContainedMapBounds(viewport: Size, mapSize: Size | null): MapBounds {
  if (!mapSize?.width || !mapSize.height || !viewport.width || !viewport.height) {
    return { left: 0, top: 0, width: viewport.width, height: viewport.height };
  }

  const scale = Math.min(viewport.width / mapSize.width, viewport.height / mapSize.height);
  const width = mapSize.width * scale;
  const height = mapSize.height * scale;

  return {
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
    width,
    height,
  };
}

function clampAxis(
  value: number,
  viewportSize: number,
  contentStart: number,
  contentSize: number,
  zoom: number,
) {
  const scaledSize = contentSize * zoom;

  if (scaledSize <= viewportSize) {
    return (viewportSize - scaledSize) / 2 - contentStart;
  }

  return clamp(value, viewportSize - contentStart - scaledSize, -contentStart);
}

function clampPan(pan: Pan, zoom: number, viewport: Size, bounds: MapBounds): Pan {
  return {
    x: clampAxis(pan.x, viewport.width, bounds.left, bounds.width, zoom),
    y: clampAxis(pan.y, viewport.height, bounds.top, bounds.height, zoom),
  };
}

function loadCustom(): CustomMarker[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomMarker[];
  } catch {
    return [];
  }
}

function saveCustom(list: CustomMarker[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function MapDrawer({
  open,
  onClose,
  focusMarkerId,
}: {
  open: boolean;
  onClose: () => void;
  focusMarkerId?: string | null;
}) {
  const { campaignId } = useCampaign();
  const customDocument = useDocument<CustomMarker[]>(
    campaignId,
    "map.custom-markers",
    loadCustom(),
  );
  const [active, setActive] = useState<Set<MarkerType>>(
    () => new Set(Object.keys(MARKER_META) as MarkerType[]),
  );
  const [editing, setEditing] = useState<CustomMarker | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const custom = customDocument.value;
  const [placing, setPlacing] = useState<MarkerType | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [mapSize, setMapSize] = useState<Size | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [storedNpcs, setStoredNpcs] = useState<StoredNpc[]>([]);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    panX: 0,
    panY: 0,
  });

  useEffect(() => {
    if (open) {
      setQuests(loadQuests());
      setStoredNpcs(loadStoredNpcs());
    }
  }, [open]);

  useEffect(() => {
    if (!open || !mapRef.current) return;

    const updateViewportSize = () => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateViewportSize();
    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(mapRef.current);

    return () => observer.disconnect();
  }, [open]);

  const all = useMemo<CustomMarker[]>(() => [...MAP_MARKERS, ...custom], [custom]);
  const visible = useMemo(() => all.filter((m) => active.has(m.type)), [all, active]);
  const mapBounds = useMemo(
    () => getContainedMapBounds(viewportSize, mapSize),
    [viewportSize, mapSize],
  );

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;

    setPan((currentPan) => {
      const nextPan = clampPan(currentPan, zoom, viewportSize, mapBounds);
      return nextPan.x === currentPan.x && nextPan.y === currentPan.y ? currentPan : nextPan;
    });
  }, [mapBounds, viewportSize, zoom]);

  // Focus a specific marker when requested from outside
  useEffect(() => {
    if (!open || !focusMarkerId) return;
    if (!viewportSize.width || !mapBounds.width) return;
    const marker = all.find((m) => m.id === focusMarkerId);
    if (!marker) return;

    // ensure category is visible
    if (!active.has(marker.type)) {
      const na = new Set(active);
      na.add(marker.type);
      setActive(na);
    }

    const targetZoom = Math.min(2.25, MAX_ZOOM);
    const mapPxX = (marker.x / 100) * mapBounds.width;
    const mapPxY = (marker.y / 100) * mapBounds.height;
    const nextPan = clampPan(
      {
        x: viewportSize.width / 2 - mapBounds.left - mapPxX * targetZoom,
        y: viewportSize.height / 2 - mapBounds.top - mapPxY * targetZoom,
      },
      targetZoom,
      viewportSize,
      mapBounds,
    );
    setZoom(targetZoom);
    setPan(nextPan);
    setHoveredId(marker.id);
    setPulseId(marker.id);
    const t = window.setTimeout(() => setPulseId(null), 2400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    focusMarkerId,
    viewportSize.width,
    viewportSize.height,
    mapBounds.width,
    mapBounds.height,
    all,
  ]);

  const toggle = (t: MarkerType) => {
    const next = new Set(active);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setActive(next);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mapX = (e.clientX - rect.left - mapBounds.left - pan.x) / zoom;
    const mapY = (e.clientY - rect.top - mapBounds.top - pan.y) / zoom;
    if (mapX < 0 || mapX > mapBounds.width || mapY < 0 || mapY > mapBounds.height) return;
    const x = clamp((mapX / mapBounds.width) * 100, 0, 100);
    const y = clamp((mapY / mapBounds.height) * 100, 0, 100);
    const id = `custom-${Date.now()}`;
    const marker: CustomMarker = {
      id,
      name: `Novo ${MARKER_META[placing].label.replace(/s$/, "")}`,
      type: placing,
      x,
      y,
      summary: "",
      custom: true,
    };
    const next = [...custom, marker];
    customDocument.persist(next);
    saveCustom(next);
    setEditing(marker);
    setPlacing(null);
    if (!active.has(placing)) {
      const na = new Set(active);
      na.add(placing);
      setActive(na);
    }
  };

  const updateCustom = (id: string, patch: Partial<CustomMarker>) => {
    const next = custom.map((m) => (m.id === id ? { ...m, ...patch } : m));
    customDocument.persist(next);
    saveCustom(next);
    setEditing((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  };

  const deleteCustom = (id: string) => {
    const next = custom.filter((m) => m.id !== id);
    customDocument.persist(next);
    saveCustom(next);
    setEditing(null);
  };

  const zoomTo = (nextZoom: number, center?: { x: number; y: number }) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const viewport = { width: rect.width, height: rect.height };
    const bounds = getContainedMapBounds(viewport, mapSize);
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const focus = center ?? {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const focusX = focus.x - rect.left;
    const focusY = focus.y - rect.top;
    const mapX = (focusX - bounds.left - pan.x) / zoom;
    const mapY = (focusY - bounds.top - pan.y) / zoom;

    setZoom(clampedZoom);
    setPan(
      clampPan(
        {
          x: focusX - bounds.left - mapX * clampedZoom,
          y: focusY - bounds.top - mapY * clampedZoom,
        },
        clampedZoom,
        viewport,
        bounds,
      ),
    );
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    zoomTo(zoom + direction * ZOOM_STEP, { x: e.clientX, y: e.clientY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (placing || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    panStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const viewport = { width: rect.width, height: rect.height };
    const bounds = getContainedMapBounds(viewport, mapSize);
    const start = panStartRef.current;
    setPan(
      clampPan(
        {
          x: start.panX + e.clientX - start.pointerX,
          y: start.panY + e.clientY - start.pointerY,
        },
        zoom,
        viewport,
        bounds,
      ),
    );
  };

  const stopPanning = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsPanning(false);
  };

  const hovered = hoveredId ? (all.find((m) => m.id === hoveredId) ?? null) : null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`belamar-drawer fixed inset-0 z-[90] flex transform transition-all duration-500 ease-out ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* LEFT DRAWER */}
        <aside
          className="relative flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--color-ink)]/30"
          style={{
            backgroundImage: `url(${parchmentImg})`,
            backgroundSize: "cover",
            boxShadow: "8px 0 30px oklch(0 0 0 / 0.6)",
          }}
        >
          <div className="absolute inset-0 bg-[oklch(0.92_0.05_80)]/35" />
          <div className="relative flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-ink)]/25 p-4">
              <div className="flex items-center gap-2">
                <Compass size={18} style={{ color: "var(--color-cat-map)" }} />
                <h2 className="ink-text text-lg">Marcadores</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-[var(--color-ink)] transition-colors hover:bg-[oklch(0.25_0.04_35)]/10"
                aria-label="Fechar mapa"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {/* Filters */}
              <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/55">
                Filtrar por categoria
              </p>
              <div className="mb-4 grid grid-cols-2 gap-1.5">
                {(Object.keys(MARKER_META) as MarkerType[]).map((t) => {
                  const meta = MARKER_META[t];
                  const Icon = meta.icon;
                  const isOn = active.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggle(t)}
                      className="inline-flex items-center justify-between rounded-sm px-2 py-1 font-[family-name:var(--font-display)] text-[9.5px] uppercase tracking-[0.2em] transition-all"
                      style={{
                        color: isOn ? meta.color : "oklch(0.25 0.04 40 / 0.4)",
                        background: isOn ? "oklch(0.96 0.04 80 / 0.7)" : "transparent",
                        border: `1px solid ${isOn ? meta.color : "oklch(0.25 0.04 40 / 0.18)"}`,
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon size={10} strokeWidth={1.8} />
                        {meta.label}
                      </span>
                      {isOn ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  );
                })}
              </div>

              {/* Place new */}
              <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/55">
                Plantar marcador
              </p>
              <div className="mb-4 grid grid-cols-2 gap-1.5">
                {(Object.keys(MARKER_META) as MarkerType[]).map((t) => {
                  const meta = MARKER_META[t];
                  const Icon = meta.icon;
                  const isPlacing = placing === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setPlacing(isPlacing ? null : t)}
                      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 font-[family-name:var(--font-display)] text-[9.5px] uppercase tracking-[0.2em] transition-all"
                      style={{
                        color: isPlacing ? "oklch(0.96 0.05 80)" : meta.color,
                        background: isPlacing ? meta.color : "transparent",
                        border: `1px solid ${meta.color}`,
                      }}
                    >
                      <Plus size={10} strokeWidth={2} />
                      <Icon size={10} strokeWidth={1.8} />
                      {meta.label.replace(/s$/, "")}
                    </button>
                  );
                })}
              </div>
              {placing && (
                <button
                  onClick={() => setPlacing(null)}
                  className="mb-4 inline-flex w-full items-center justify-center gap-1 rounded-sm border border-[var(--color-ink)]/30 bg-[oklch(0.96_0.04_80)]/60 px-2 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink)]/75"
                >
                  <MousePointer2 size={11} /> cancelar plantio
                </button>
              )}

              {/* List */}
              <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/55">
                Marcadores ({visible.length})
              </p>
              <ul className="space-y-1">
                {visible.map((m) => {
                  const meta = MARKER_META[m.type];
                  const Icon = meta.icon;
                  const isHover = hoveredId === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        onMouseEnter={() => setHoveredId(m.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => m.custom && setEditing(m)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors"
                        style={{
                          background: isHover ? "oklch(0.96 0.04 80 / 0.7)" : "transparent",
                          border: `1px solid ${isHover ? meta.color : "transparent"}`,
                        }}
                      >
                        <Icon size={12} strokeWidth={1.8} style={{ color: meta.color }} />
                        <span className="flex-1 truncate font-[family-name:var(--font-body)] text-[14px] text-[var(--color-ink)]">
                          {m.name}
                        </span>
                        {m.custom && (
                          <span
                            className="font-[family-name:var(--font-script)] text-[10px] italic"
                            style={{ color: meta.color }}
                          >
                            ✎
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-[var(--color-ink)]/20 p-3">
              <p className="text-center font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/55">
                clique num pin para inspecionar
              </p>
            </div>
          </div>
        </aside>

        {/* MAP — fills remaining space */}
        <div
          className="relative min-h-0 flex-1 bg-[oklch(0.1_0.02_30)]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.08 0.02 30 / 0.62), oklch(0.08 0.02 30 / 0.78)), url(${mapImg})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div
            ref={mapRef}
            onClick={handleMapClick}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPanning}
            onPointerCancel={stopPanning}
            onDragStart={(e) => e.preventDefault()}
            className="relative h-full w-full overflow-hidden"
            style={{
              cursor: placing ? "crosshair" : isPanning ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            <div
              className="absolute"
              style={{
                left: mapBounds.left,
                top: mapBounds.top,
                width: mapBounds.width,
                height: mapBounds.height,
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              <img
                src={mapImg}
                alt="Mapa de Belamar"
                onLoad={(e) =>
                  setMapSize({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  })
                }
                onDragStart={(e) => e.preventDefault()}
                className="pointer-events-none h-full w-full select-none object-contain shadow-[0_18px_60px_oklch(0_0_0/0.65)]"
                style={{ WebkitUserDrag: "none" } as React.CSSProperties}
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,oklch(0_0_0/0.55)_100%)]" />

              {visible.map((m) => {
                const meta = MARKER_META[m.type];
                const Icon = meta.icon;
                const isHover = hoveredId === m.id;
                const isPulse = pulseId === m.id;
                return (
                  <button
                    key={m.id}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (placing) return;
                      if (m.custom) setEditing(m);
                    }}
                    className="group absolute"
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                    }}
                    aria-label={m.name}
                  >
                    {isPulse && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          left: -18,
                          top: -18,
                          width: 60,
                          height: 60,
                          border: `2px solid ${meta.color}`,
                          animation: "belamar-pulse 1.1s ease-out infinite",
                        }}
                      />
                    )}
                    <span
                      className="absolute rounded-full blur-md transition-opacity duration-300"
                      style={{
                        background: meta.color,
                        opacity: isHover || isPulse ? 0.9 : 0.4,
                        width: 44,
                        height: 44,
                        left: -10,
                        top: -10,
                      }}
                    />
                    <span
                      className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-125"
                      style={{
                        background: "oklch(0.96 0.05 80)",
                        border: `1.5px solid ${meta.color}`,
                        boxShadow: `0 0 12px ${meta.color}, inset 0 0 4px ${meta.color}80`,
                      }}
                    >
                      {(() => {
                        const npc = m.linkedNpcId
                          ? storedNpcs.find((n) => n.id === m.linkedNpcId)
                          : null;
                        if (npc?.portrait) {
                          return (
                            <img
                              src={npc.portrait}
                              alt={npc.name}
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          );
                        }
                        return <Icon size={12} strokeWidth={2} style={{ color: meta.color }} />;
                      })()}
                    </span>
                  </button>
                );
              })}

              {/* Tooltip — follows the hovered marker */}
              {hovered && !editing && (
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: `${hovered.x}%`,
                    top: `calc(${hovered.y}% - 22px)`,
                    transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                    transformOrigin: "bottom center",
                  }}
                >
                  <MarkerTooltip marker={hovered} quests={quests} storedNpcs={storedNpcs} />
                </div>
              )}
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-sm border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.05_80)]/90 p-1 shadow-[0_10px_30px_oklch(0_0_0/0.35)]"
            >
              <button
                onClick={() => zoomTo(zoom - ZOOM_STEP)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)]/10 disabled:opacity-35"
                disabled={zoom <= MIN_ZOOM}
                aria-label="Diminuir zoom"
              >
                <ZoomOut size={16} />
              </button>
              <span className="min-w-12 text-center font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => zoomTo(zoom + ZOOM_STEP)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)]/10 disabled:opacity-35"
                disabled={zoom >= MAX_ZOOM}
                aria-label="Aumentar zoom"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetView}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)]/10 disabled:opacity-35"
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                aria-label="Resetar zoom"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {placing && (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
                <p className="rounded-sm border border-[var(--color-cat-map)] bg-[oklch(0.96_0.05_80)]/95 px-3 py-1.5 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-ink)]">
                  clique para fixar · {MARKER_META[placing].label}
                </p>
              </div>
            )}
          </div>

          {/* Edit popover */}
          {editing && (
            <div
              className="absolute right-6 top-6 z-30 w-[340px] rounded border border-[var(--color-ink)]/30"
              style={{
                backgroundImage: `url(${parchmentImg})`,
                backgroundSize: "cover",
                boxShadow: "0 18px 50px oklch(0 0 0 / 0.7)",
              }}
            >
              <div className="absolute inset-0 rounded bg-[oklch(0.92_0.05_80)]/45" />
              <div className="relative p-5">
                <button
                  onClick={() => setEditing(null)}
                  className="absolute right-3 top-3 rounded-full p-1 text-[var(--color-ink)] hover:bg-[oklch(0.25_0.04_35)]/10"
                  aria-label="Fechar"
                >
                  <X size={14} />
                </button>
                <MarkerEditor
                  marker={editing}
                  storedNpcs={storedNpcs}
                  onChange={(patch) => updateCustom(editing.id, patch)}
                  onDelete={() => deleteCustom(editing.id)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MarkerTooltip({
  marker,
  quests,
  storedNpcs,
}: {
  marker: CustomMarker;
  quests: Quest[];
  storedNpcs: StoredNpc[];
}) {
  const meta = MARKER_META[marker.type];
  const Icon = meta.icon;
  const linkedQuestTitles = useMemo(() => {
    const fromStore = (quests ?? [])
      .filter((q) => q.linkedMarkerIds.includes(marker.id))
      .map((q) => `${q.title}${q.status !== "ativa" ? ` (${q.status})` : ""}`);
    const merged = [...(marker.linkedQuests ?? []), ...fromStore];
    return Array.from(new Set(merged));
  }, [quests, marker]);
  const linkedNpc = marker.linkedNpcId ? storedNpcs.find((n) => n.id === marker.linkedNpcId) : null;
  return (
    <div
      className="w-[280px] rounded border border-[var(--color-ink)]/30 p-3"
      style={{
        backgroundImage: `url(${parchmentImg})`,
        backgroundSize: "cover",
        boxShadow: `0 10px 30px oklch(0 0 0 / 0.7), 0 0 14px ${meta.color}`,
      }}
    >
      <div className="absolute inset-0 rounded bg-[oklch(0.92_0.05_80)]/45" />
      <div className="relative">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full"
            style={{
              border: `1px solid ${meta.color}`,
              background: "oklch(0.96 0.04 80 / 0.7)",
            }}
          >
            {linkedNpc?.portrait ? (
              <img
                src={linkedNpc.portrait}
                alt={linkedNpc.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon size={13} strokeWidth={1.6} style={{ color: meta.color }} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="ink-text truncate text-base">
              {linkedNpc ? linkedNpc.name : marker.name}
            </h3>
            <p className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/70">
              {meta.label.replace(/s$/, "")}
              {marker.district ? ` · ${marker.district}` : ""}
              {linkedNpc?.faction && linkedNpc.faction !== "sem faccao"
                ? ` · ${linkedNpc.faction}`
                : ""}
            </p>
          </div>
        </div>
        {(linkedNpc?.summary || marker.summary) && (
          <p className="font-[family-name:var(--font-body)] text-[13px] leading-snug text-[var(--color-ink)]/85">
            {linkedNpc?.summary || marker.summary}
          </p>
        )}
        <TooltipList label="Serviços" items={marker.services} />
        <TooltipList label="Eventos" items={marker.events} />
        <TooltipList label="NPCs" items={marker.linkedNpcs} />
        <TooltipList label="Quests" items={linkedQuestTitles} />
      </div>
      <span
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[var(--color-ink)]/30"
        style={{ background: "oklch(0.92 0.05 80)" }}
      />
    </div>
  );
}

function TooltipList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-1.5">
      <p className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.25em] text-[var(--color-ink)]/55">
        {label}
      </p>
      <p className="font-[family-name:var(--font-body)] text-[12.5px] text-[var(--color-ink)]/80">
        {items.join(" · ")}
      </p>
    </div>
  );
}

function MarkerEditor({
  marker,
  storedNpcs,
  onChange,
  onDelete,
}: {
  marker: CustomMarker;
  storedNpcs: StoredNpc[];
  onChange: (patch: Partial<CustomMarker>) => void;
  onDelete: () => void;
}) {
  const meta = MARKER_META[marker.type];
  const Icon = meta.icon;
  const linkedNpc = marker.linkedNpcId ? storedNpcs.find((n) => n.id === marker.linkedNpcId) : null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
          style={{
            border: `1px solid ${meta.color}`,
            background: "oklch(0.96 0.04 80 / 0.7)",
          }}
        >
          {linkedNpc?.portrait ? (
            <img
              src={linkedNpc.portrait}
              alt={linkedNpc.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon size={16} strokeWidth={1.5} style={{ color: meta.color }} />
          )}
        </span>
        <input
          value={marker.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="ink-text w-full bg-transparent text-lg outline-none focus:border-b focus:border-[var(--color-ink)]/40"
        />
      </div>

      {marker.type === "npc" && (
        <div className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-2.5">
          <p className="mb-1 font-[family-name:var(--font-display)] text-[9.5px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Vincular a um NPC
          </p>
          <select
            value={marker.linkedNpcId ?? ""}
            onChange={(e) => {
              const id = e.target.value || undefined;
              const npc = id ? storedNpcs.find((n) => n.id === id) : null;
              onChange({
                linkedNpcId: id,
                ...(npc ? { name: npc.name } : {}),
              });
            }}
            className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/70 px-2 py-1.5 font-[family-name:var(--font-body)] text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]/50"
          >
            <option value="">— nenhum (token livre) —</option>
            {storedNpcs.length === 0 && <option disabled>Nenhum NPC criado ainda</option>}
            {storedNpcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
                {n.faction && n.faction !== "sem faccao" ? ` · ${n.faction}` : ""}
              </option>
            ))}
          </select>
          {linkedNpc && (
            <p className="mt-1.5 font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/65">
              Token usa foto e descrição de “{linkedNpc.name}”.
            </p>
          )}
        </div>
      )}

      <textarea
        value={marker.summary ?? ""}
        onChange={(e) => onChange({ summary: e.target.value })}
        placeholder="Anotação sobre este local…"
        className="min-h-[120px] w-full resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/60 p-2.5 font-[family-name:var(--font-body)] text-[14px] leading-snug text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
      />

      <div className="flex items-center justify-between border-t border-[var(--color-ink)]/15 pt-2">
        <span className="inline-flex items-center gap-1 font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/55">
          <Save size={11} /> salvo localmente
        </span>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-cat-danger)]/60 px-2 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-cat-danger)] transition-colors hover:bg-[var(--color-cat-danger)]/10"
        >
          <Trash2 size={11} /> remover
        </button>
      </div>
    </div>
  );
}
