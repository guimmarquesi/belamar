import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, MapPin, Pencil, X } from "lucide-react";
import {
  newQuestId,
  type Quest,
  type QuestKind,
  type QuestStatus,
} from "@/lib/quests-store";
import { MAP_MARKERS, MARKER_META, type MapMarker } from "@/lib/map";
import { LoreBlock } from "@/components/LoreBlock";
import { useCampaign } from "@/lib/campaign-context";
import { useSyncedQuests } from "@/lib/campaign-data";

const CUSTOM_MARKERS_KEY = "belamar.custom-markers";

function loadAllMarkers(): MapMarker[] {
  let custom: MapMarker[] = [];
  if (typeof window !== "undefined") {
    try {
      custom = JSON.parse(localStorage.getItem(CUSTOM_MARKERS_KEY) ?? "[]");
    } catch {
      custom = [];
    }
  }
  return [...MAP_MARKERS, ...custom];
}

const STATUS_LABEL: Record<QuestStatus, string> = {
  ativa: "Ativa",
  concluida: "Concluída",
  falhada: "Falhada",
};

const STATUS_COLOR: Record<QuestStatus, string> = {
  ativa: "var(--color-cat-quests)",
  concluida: "oklch(0.6 0.13 160)",
  falhada: "oklch(0.55 0.18 25)",
};

const KIND_LABEL: Record<QuestKind, string> = {
  principal: "Principais",
  secundaria: "Secundárias",
};

function nextStatus(s: QuestStatus): QuestStatus {
  if (s === "ativa") return "concluida";
  if (s === "concluida") return "falhada";
  return "ativa";
}

export function QuestsPanel({ onFocusMarker }: { onFocusMarker?: (markerId: string) => void }) {
  const { campaignId, isMaster } = useCampaign();
  const { list: quests, persist } = useSyncedQuests(campaignId);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setMarkers(loadAllMarkers());
  }, []);

  const addOrUpdate = (q: Quest) => {
    const exists = quests.some((x) => x.id === q.id);
    persist(exists ? quests.map((x) => (x.id === q.id ? q : x)) : [...quests, q]);
    setEditing(null);
    setShowForm(false);
  };

  const remove = (id: string) => persist(quests.filter((q) => q.id !== id));

  const cycleStatus = (q: Quest) =>
    persist(quests.map((x) => (x.id === q.id ? { ...x, status: nextStatus(x.status) } : x)));

  const groups = useMemo(() => {
    const g: Record<QuestKind, Quest[]> = { principal: [], secundaria: [] };
    for (const q of quests) g[q.kind].push(q);
    return g;
  }, [quests]);

  const markerById = useMemo(() => {
    const m = new Map<string, MapMarker>();
    for (const x of markers) m.set(x.id, x);
    return m;
  }, [markers]);

  return (
    <div className="space-y-4">
      {isMaster && !showForm && !editing && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[var(--color-ink)]/30 bg-[oklch(0.96_0.04_80)]/30 px-3 py-2 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]/60 hover:text-[var(--color-ink)] transition"
        >
          <Plus className="size-3.5" />
          Adicionar quest
        </button>
      )}

      {isMaster && (showForm || editing) && (
        <QuestForm
          initial={editing}
          markers={markers}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={addOrUpdate}
        />
      )}

      {(["principal", "secundaria"] as QuestKind[]).map((k) => (
        <LoreBlock
          key={k}
          title={`${KIND_LABEL[k]} · ${groups[k].length}`}
          hint={k === "principal" ? "fios que movem a cidade" : "contratos avulsos"}
        >
          {groups[k].length === 0 ? (
            <p className="font-[family-name:var(--font-script)] text-[13px] italic text-[var(--color-ink)]/55">
              nenhuma quest registrada.
            </p>
          ) : (
            <ul className="space-y-3">
              {groups[k].map((q) => (
                <QuestEntry
                  key={q.id}
                  quest={q}
                  markerById={markerById}
                  onEdit={() => setEditing(q)}
                  onDelete={() => remove(q.id)}
                  onCycleStatus={() => cycleStatus(q)}
                  onFocusMarker={onFocusMarker}
                  canEdit={isMaster}
                />
              ))}
            </ul>
          )}
        </LoreBlock>
      ))}
    </div>
  );
}

function QuestEntry({
  quest,
  markerById,
  onEdit,
  onDelete,
  onCycleStatus,
  onFocusMarker,
  canEdit,
}: {
  quest: Quest;
  markerById: Map<string, MapMarker>;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
  onFocusMarker?: (id: string) => void;
  canEdit: boolean;
}) {
  return (
    <li className="border-l-2 pl-3" style={{ borderColor: STATUS_COLOR[quest.status] }}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
          {quest.title}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={canEdit ? onCycleStatus : undefined}
            className="rounded-sm px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] transition"
            style={{
              color: STATUS_COLOR[quest.status],
              border: `1px solid ${STATUS_COLOR[quest.status]}`,
              background: "oklch(0.96 0.04 80 / 0.5)",
              cursor: canEdit ? "pointer" : "default",
            }}
            title={canEdit ? "Alternar status" : "Somente o Mestre pode alterar quests"}
          >
            {STATUS_LABEL[quest.status]}
          </button>
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] transition"
                title="Editar"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={onDelete}
                className="text-[var(--color-ink)]/40 hover:text-red-700 transition"
                title="Remover"
              >
                <Trash2 className="size-3" />
              </button>
            </>
          )}
        </div>
      </div>
      {quest.summary && (
        <p className="mt-1 font-[family-name:var(--font-script)] text-[13px] italic leading-relaxed text-[var(--color-ink)]/70">
          {quest.summary}
        </p>
      )}
      {quest.notes && (
        <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--color-ink)]/85">
          {quest.notes}
        </p>
      )}
      {quest.linkedMarkerIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quest.linkedMarkerIds.map((id) => {
            const m = markerById.get(id);
            if (!m) return null;
            const meta = MARKER_META[m.type];
            const Icon = meta.icon;
            return (
              <button
                key={id}
                onClick={() => onFocusMarker?.(id)}
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[9.5px] uppercase tracking-[0.2em] transition hover:bg-[oklch(0.96_0.04_80)]/70"
                style={{
                  color: meta.color,
                  border: `1px solid ${meta.color}`,
                }}
                title="Ver no mapa"
              >
                <Icon size={9} strokeWidth={2} />
                {m.name}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

function QuestForm({
  initial,
  markers,
  onCancel,
  onSubmit,
}: {
  initial: Quest | null;
  markers: MapMarker[];
  onCancel: () => void;
  onSubmit: (q: Quest) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<QuestKind>(initial?.kind ?? "principal");
  const [status, setStatus] = useState<QuestStatus>(initial?.status ?? "ativa");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [linked, setLinked] = useState<string[]>(initial?.linkedMarkerIds ?? []);
  const [markerSearch, setMarkerSearch] = useState("");

  const toggleMarker = (id: string) =>
    setLinked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const filteredMarkers = useMemo(() => {
    const s = markerSearch.trim().toLowerCase();
    if (!s) return markers;
    return markers.filter(
      (m) => m.name.toLowerCase().includes(s) || (m.district ?? "").toLowerCase().includes(s),
    );
  }, [markers, markerSearch]);

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      id: initial?.id ?? newQuestId(),
      title: title.trim(),
      kind,
      status,
      summary: summary.trim(),
      notes: notes.trim(),
      linkedMarkerIds: linked,
      createdAt: initial?.createdAt ?? Date.now(),
    });
  };

  return (
    <div className="space-y-2 rounded border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/50 p-3">
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/65">
          {initial ? "Editar quest" : "Nova quest"}
        </p>
        <button
          onClick={onCancel}
          className="text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <input
        autoFocus
        placeholder="Título da quest"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] p-0.5">
          {(["principal", "secundaria"] as QuestKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className="flex-1 rounded-sm px-2 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.18em] transition"
              style={{
                background: kind === k ? "var(--color-cat-quests)" : "transparent",
                color: kind === k ? "oklch(0.96 0.05 80)" : "var(--color-ink)",
              }}
            >
              {k === "principal" ? "Principal" : "Secundária"}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuestStatus)}
          className="rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[12px] text-[var(--color-ink)]"
        >
          <option value="ativa">Ativa</option>
          <option value="concluida">Concluída</option>
          <option value="falhada">Falhada</option>
        </select>
      </div>

      <textarea
        placeholder="Resumo (opcional)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={2}
        className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] italic text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
      />

      <textarea
        placeholder="Notas e detalhes (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink)]/65">
            <MapPin className="mr-1 inline size-3" />
            Marcadores ligados ({linked.length})
          </p>
          <input
            placeholder="filtrar…"
            value={markerSearch}
            onChange={(e) => setMarkerSearch(e.target.value)}
            className="w-28 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-1.5 py-0.5 text-[11px] italic text-[var(--color-ink)] focus:outline-none"
          />
        </div>
        <div className="max-h-40 overflow-y-auto rounded border border-[var(--color-ink)]/15 bg-[oklch(0.98_0.02_80)]/70 p-1">
          {filteredMarkers.length === 0 ? (
            <p className="px-2 py-1 font-[family-name:var(--font-script)] text-[12px] italic text-[var(--color-ink)]/55">
              nenhum marcador.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredMarkers.map((m) => {
                const meta = MARKER_META[m.type];
                const Icon = meta.icon;
                const on = linked.includes(m.id);
                return (
                  <li key={m.id}>
                    <label
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-[12.5px] text-[var(--color-ink)] transition hover:bg-[oklch(0.92_0.05_80)]/60"
                      style={on ? { background: "oklch(0.92 0.05 80 / 0.7)" } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleMarker(m.id)}
                        className="accent-[var(--color-cat-quests)]"
                      />
                      <Icon size={11} strokeWidth={1.8} style={{ color: meta.color }} />
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.district && (
                        <span className="font-[family-name:var(--font-script)] text-[10.5px] italic text-[var(--color-ink)]/55">
                          {m.district}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/60 hover:text-[var(--color-ink)]"
        >
          Cancelar
        </button>
        <button
          disabled={!title.trim()}
          onClick={submit}
          className="rounded bg-[var(--color-ink)] px-3 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[oklch(0.96_0.04_80)] disabled:opacity-40"
        >
          {initial ? "Salvar" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}
