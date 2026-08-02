import { useRef, useState } from "react";
import { Camera, ChevronLeft, Plus, Save, Trash2 } from "lucide-react";
import { RELATION_LABEL, RELATION_ORDER, type NpcRelation } from "@/lib/npcs";
import { useCampaign } from "@/lib/campaign-context";
import { useSyncedNpcs, type SyncedNpc } from "@/lib/campaign-data";

const CUSTOM_NPCS_KEY = "belamar.custom-npcs";

type EditableNpc = SyncedNpc;

const TEST_NPC: EditableNpc = {
  id: "test-npc",
  name: "NPC de Teste",
  relation: "aliado",
  faction: "sem faccao",
  lastSeen: "Belamar",
  bond: "Criado para testar o novo card editavel.",
  summary: "Um rosto temporario para validar nome, descricao, relacao e imagem.",
  sigil: "T",
  accent: "oklch(0.62 0.09 70)",
};

function loadNpcs(): EditableNpc[] {
  if (typeof window === "undefined") return [TEST_NPC];
  try {
    const raw = localStorage.getItem(CUSTOM_NPCS_KEY);
    return raw ? (JSON.parse(raw) as EditableNpc[]) : [TEST_NPC];
  } catch {
    return [TEST_NPC];
  }
}

export function NpcsPanel() {
  const { campaignId, role } = useCampaign();
  const canEdit = role === "master" || role === "player";
  const { list: npcs, persist } = useSyncedNpcs(campaignId, loadNpcs);
  const [tab, setTab] = useState<NpcRelation>("aliado");
  const [selected, setSelected] = useState<EditableNpc | null>(null);

  const updateNpc = (id: string, patch: Partial<EditableNpc>) => {
    if (!canEdit) return;
    const next = npcs.map((npc) => (npc.id === id ? { ...npc, ...patch } : npc));
    persist(next);
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const deleteNpc = (id: string) => {
    if (!canEdit) return;
    persist(npcs.filter((npc) => npc.id !== id));
    setSelected(null);
  };

  const addNpc = () => {
    const npc: EditableNpc = {
      id: `npc-${Date.now()}`,
      name: "Novo NPC",
      relation: tab,
      faction: "sem faccao",
      lastSeen: "Belamar",
      bond: "Ainda sem relacao definida.",
      summary: "Descricao breve deste rosto em Belamar.",
      sigil: "N",
      accent: "oklch(0.62 0.09 70)",
    };
    if (!canEdit) return;
    persist([...npcs, npc]);
    setSelected(npc);
  };

  if (selected) {
    return (
      <NpcDetail
        npc={selected}
        onBack={() => setSelected(null)}
        onChange={(patch) => updateNpc(selected.id, patch)}
        onDelete={() => deleteNpc(selected.id)}
        canEdit={canEdit}
      />
    );
  }

  const list = npcs.filter((npc) => npc.relation === tab);

  return (
    <div className="space-y-5">
      <p className="font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[var(--color-ink)]/80">
        Rostos na nevoa. Quem caminha conosco, quem nos olha de longe e quem ainda nao tem nome.
      </p>

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-ink)]/15 pb-2">
        {RELATION_ORDER.map((relation) => {
          const active = relation === tab;
          const count = npcs.filter((npc) => npc.relation === relation).length;
          return (
            <button
              key={relation}
              onClick={() => setTab(relation)}
              className="rounded-sm px-3 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] transition-all"
              style={{
                color: active ? "var(--color-ink)" : "oklch(0.25 0.04 40 / 0.55)",
                background: active ? "oklch(0.96 0.04 80 / 0.7)" : "transparent",
                border: `1px solid ${
                  active ? "oklch(0.25 0.04 40 / 0.5)" : "oklch(0.25 0.04 40 / 0.15)"
                }`,
              }}
            >
              {RELATION_LABEL[relation]}
              <span className="ml-2 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {canEdit && (
        <button
          onClick={addNpc}
          className="group flex w-full items-center gap-4 rounded border border-dashed border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/25 p-4 text-left transition-all hover:border-[var(--color-ink)]/45 hover:bg-[oklch(0.96_0.04_80)]/50"
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              border: "1px solid var(--color-cat-npcs)",
              background:
                "radial-gradient(circle at 30% 25%, oklch(0.96 0.05 80) 0%, oklch(0.86 0.06 80) 100%)",
              boxShadow:
                "inset 0 0 10px oklch(0.62 0.09 70 / 0.25), 0 2px 6px oklch(0 0 0 / 0.25)",
            }}
          >
            <Plus size={20} strokeWidth={1.6} style={{ color: "var(--color-cat-npcs)" }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ink-text text-lg leading-none">Adicionar NPC</span>
            <span className="mt-1 block font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/60">
              novo card em {RELATION_LABEL[tab].toLowerCase()}
            </span>
          </span>
        </button>
      )}

      {list.length === 0 ? (
        <p className="rounded border border-dashed border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/30 p-6 text-center font-[family-name:var(--font-script)] italic text-[var(--color-ink)]/55">
          Nenhum NPC registrado aqui ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((npc) => (
            <li key={npc.id}>
              <button
                onClick={() => setSelected(npc)}
                className="group flex w-full items-center gap-4 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/30 p-4 text-left transition-all hover:border-[var(--color-ink)]/40 hover:bg-[oklch(0.96_0.04_80)]/55"
              >
                <NpcMedallion npc={npc} />
                <div className="min-w-0 flex-1">
                  <span className="ink-text text-lg leading-none">{npc.name}</span>
                  {npc.faction && npc.faction !== "sem faccao" && (
                    <p className="mt-1 font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/65">
                      {npc.faction}
                    </p>
                  )}
                  {npc.summary && (
                    <p className="mt-1 line-clamp-2 font-[family-name:var(--font-body)] text-[13.5px] text-[var(--color-ink)]/70">
                      {npc.summary}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NpcMedallion({ npc }: { npc: EditableNpc }) {
  const accent = npc.accent ?? "oklch(0.5 0.04 50)";
  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        border: `1px solid ${accent}`,
        background:
          "radial-gradient(circle at 30% 25%, oklch(0.96 0.05 80) 0%, oklch(0.86 0.06 80) 100%)",
        boxShadow: `inset 0 0 10px ${accent}30, 0 2px 6px oklch(0 0 0 / 0.25)`,
      }}
    >
      {npc.portrait ? (
        <img
          src={npc.portrait}
          alt={npc.name}
          className="h-full w-full object-cover"
          style={{ filter: "sepia(0.18) saturate(0.92) contrast(1.02)" }}
          draggable={false}
        />
      ) : (
        <span
          className="font-[family-name:var(--font-display)] text-2xl"
          style={{ color: accent, opacity: 0.6 }}
        >
          {npc.sigil ?? npc.name[0]}
        </span>
      )}
    </div>
  );
}

function NpcDetail({
  npc,
  onBack,
  onChange,
  onDelete,
  canEdit,
}: {
  npc: EditableNpc;
  onBack: () => void;
  onChange: (patch: Partial<EditableNpc>) => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ portrait: typeof reader.result === "string" ? reader.result : undefined });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={14} /> voltar aos npcs
      </button>

      <div className="flex items-start gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => canEdit && fileInputRef.current?.click()}
            className="block rounded-full outline-none ring-offset-2 focus:ring-2"
            aria-label="Selecionar imagem do NPC"
          >
            <NpcMedallion npc={npc} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => canEdit && updateImage(event.target.files?.[0] ?? null)}
          />
          {canEdit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-1 rounded-sm border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/45 px-2 py-1 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink)]/65 transition-colors hover:bg-[oklch(0.96_0.04_80)]/70"
            >
              <Camera size={11} /> imagem
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            value={npc.name}
            readOnly={!canEdit}
            onChange={(event) =>
              canEdit && onChange({
                name: event.target.value,
                sigil: event.target.value.trim().charAt(0).toUpperCase() || "N",
              })
            }
            className="ink-text w-full bg-transparent text-2xl outline-none focus:border-b focus:border-[var(--color-ink)]/40"
          />
          <p className="font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/70">
            {RELATION_LABEL[npc.relation].slice(0, -1)} -{" "}
            {npc.faction && npc.faction !== "sem faccao" ? npc.faction : "sem faccao"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {RELATION_ORDER.map((relation) => (
              <button
                key={relation}
                onClick={() => canEdit && onChange({ relation })}
                disabled={!canEdit}
                className="rounded-sm px-2 py-1 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] transition-all"
                style={{
                  color:
                    relation === npc.relation ? "var(--color-ink)" : "oklch(0.25 0.04 40 / 0.55)",
                  background:
                    relation === npc.relation ? "oklch(0.96 0.04 80 / 0.7)" : "transparent",
                  border: `1px solid ${
                    relation === npc.relation
                      ? "oklch(0.25 0.04 40 / 0.5)"
                      : "oklch(0.25 0.04 40 / 0.15)"
                  }`,
                }}
              >
                {RELATION_LABEL[relation]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Field
        label="Descricao"
        value={npc.summary}
        onChange={(value) => onChange({ summary: value })}
        readOnly={!canEdit}
      />
      <Field
        label="Ultima localizacao conhecida"
        value={npc.lastSeen}
        onChange={(value) => onChange({ lastSeen: value })}
        readOnly={!canEdit}
      />
      <Field
        label="Relacao com o grupo"
        value={npc.bond}
        onChange={(value) => onChange({ bond: value })}
        readOnly={!canEdit}
      />
      <Field
        label="Faccao"
        value={npc.faction}
        onChange={(value) => onChange({ faction: value })}
        readOnly={!canEdit}
      />

      <div className="flex items-center justify-between border-t border-[var(--color-ink)]/15 pt-3">
        <span className="inline-flex items-center gap-1 font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/55">
          <Save size={11} /> {canEdit ? "salvo na campanha" : "somente leitura"}
        </span>
        {canEdit && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-cat-danger)]/60 px-2 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-cat-danger)] transition-colors hover:bg-[var(--color-cat-danger)]/10"
          >
            <Trash2 size={11} /> remover
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
      <p className="mb-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
        {label}
      </p>
      <textarea
        value={value ?? ""}
        onChange={(event) => !readOnly && onChange(event.target.value)}
        readOnly={readOnly}
        className="min-h-[74px] w-full resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-2.5 font-[family-name:var(--font-body)] text-[14.5px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
      />
    </div>
  );
}
