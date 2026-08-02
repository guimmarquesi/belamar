import { useState } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import { type BagItem, type Coins } from "@/lib/bag-store";
import { LoreBlock } from "@/components/LoreBlock";
import { useCampaign } from "@/lib/campaign-context";
import { useSyncedBag, useSyncedCoins } from "@/lib/campaign-data";

const COIN_STYLES: Record<keyof Coins, { label: string; bg: string; ring: string; ink: string }> = {
  gold: {
    label: "Ouro",
    bg: "oklch(0.82 0.16 85)",
    ring: "oklch(0.55 0.12 80)",
    ink: "oklch(0.28 0.08 70)",
  },
  silver: {
    label: "Prata",
    bg: "oklch(0.88 0.01 250)",
    ring: "oklch(0.6 0.02 250)",
    ink: "oklch(0.3 0.02 250)",
  },
  bronze: {
    label: "Bronze",
    bg: "oklch(0.68 0.11 45)",
    ring: "oklch(0.42 0.09 40)",
    ink: "oklch(0.22 0.06 40)",
  },
};

function CoinPurse({ canEdit }: { canEdit: boolean }) {
  const { campaignId } = useCampaign();
  const { coins, persist } = useSyncedCoins(campaignId);

  const update = (kind: keyof Coins, delta: number) => {
    if (!canEdit) return;
    persist({ ...coins, [kind]: Math.max(0, coins[kind] + delta) });
  };
  const setValue = (kind: keyof Coins, v: number) => {
    if (!canEdit) return;
    persist({ ...coins, [kind]: Math.max(0, Math.floor(v) || 0) });
  };

  return (
    <LoreBlock title="Bolsa de moedas" hint="ouro · prata · bronze">
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(COIN_STYLES) as (keyof Coins)[]).map((k) => {
          const s = COIN_STYLES[k];
          return (
            <div
              key={k}
              className="flex flex-col items-center gap-2 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-2"
            >
              <div
                className="flex size-11 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-widest"
                style={{
                  background: `radial-gradient(circle at 35% 30%, oklch(0.98 0.05 90 / 0.6), ${s.bg} 60%, ${s.ring})`,
                  boxShadow: `inset 0 0 0 2px ${s.ring}, 0 1px 3px oklch(0 0 0 / 0.25)`,
                  color: s.ink,
                }}
                title={s.label}
              >
                {s.label[0]}
              </div>
              <div className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink)]/60">
                {s.label}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => update(k, -1)}
                  disabled={!canEdit}
                  className="rounded border border-[var(--color-ink)]/20 px-1 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-ink)]/10"
                >
                  <Minus className="size-3" />
                </button>
                <input
                  type="number"
                  min={0}
                  value={coins[k]}
                  onChange={(e) => setValue(k, Number(e.target.value))}
                  readOnly={!canEdit}
                  className="w-14 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-1 py-0.5 text-center font-[family-name:var(--font-display)] text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
                />
                <button
                  onClick={() => update(k, 1)}
                  disabled={!canEdit}
                  className="rounded border border-[var(--color-ink)]/20 px-1 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-ink)]/10"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </LoreBlock>
  );
}

function AddForm({ onAdd }: { onAdd: (item: BagItem) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(1);

  const reset = () => {
    setName("");
    setDescription("");
    setCount(1);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[var(--color-ink)]/30 bg-[oklch(0.96_0.04_80)]/30 px-3 py-2 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]/60 hover:text-[var(--color-ink)] transition"
      >
        <Plus className="size-3.5" />
        Adicionar item
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/50 p-3">
      <div className="flex gap-2">
        <input
          autoFocus
          placeholder="Nome do item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
        />
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-14 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[12px] text-[var(--color-ink)]"
        />
      </div>
      <textarea
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="px-3 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/60 hover:text-[var(--color-ink)]"
        >
          Cancelar
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => {
            onAdd({
              id: globalThis.crypto?.randomUUID?.() ?? `bag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: name.trim(),
              description: description.trim(),
              count,
            });
            reset();
            setOpen(false);
          }}
          className="rounded bg-[var(--color-ink)] px-3 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[oklch(0.96_0.04_80)] disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

export function BagList() {
  const { campaignId, role } = useCampaign();
  const { list: items, persist } = useSyncedBag(campaignId);
  const canEdit = role !== "guest";

  const addItem = (i: BagItem) => persist([...items, i]);
  const removeItem = (id: string) => persist(items.filter((i) => i.id !== id));
  const updateCount = (id: string, delta: number) =>
    persist(items.map((i) => (i.id === id ? { ...i, count: Math.max(0, i.count + delta) } : i)));

  return (
    <>
      <CoinPurse canEdit={canEdit} />
      {canEdit && <AddForm onAdd={addItem} />}
      {items.length === 0 ? (
        <p className="mt-3 font-[family-name:var(--font-script)] text-[13px] italic text-[var(--color-ink)]/50">
          A bolsa está vazia. Cordas, tochas, rações — adicione o que a companhia carrega.
        </p>
      ) : (
        <LoreBlock title={`Bolsa · ${items.length}`} hint="tralhas & utensílios">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="border-l-2 border-[oklch(0.5_0.05_60)] pl-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
                    {i.name}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => removeItem(i.id)}
                      className="text-[var(--color-ink)]/40 hover:text-red-700 transition"
                      title="Remover"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                {i.description && (
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink)]/85">
                    {i.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/55">
                    Quantidade
                  </span>
                  <button
                    onClick={() => canEdit && updateCount(i.id, -1)}
                    disabled={!canEdit}
                    className="rounded border border-[var(--color-ink)]/20 px-1.5 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-ink)]/10"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="min-w-[1.5rem] text-center font-[family-name:var(--font-display)] text-[13px] text-[var(--color-ink)]">
                    {i.count}
                  </span>
                  <button
                    onClick={() => canEdit && updateCount(i.id, 1)}
                    disabled={!canEdit}
                    className="rounded border border-[var(--color-ink)]/20 px-1.5 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-ink)]/10"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </LoreBlock>
      )}
    </>
  );
}
