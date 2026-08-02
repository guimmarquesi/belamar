import { useMemo, useState } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import { type Potion, type PotionRarity } from "@/lib/potions-store";
import { LoreBlock } from "@/components/LoreBlock";
import { useCampaign } from "@/lib/campaign-context";
import { useSyncedPotions } from "@/lib/campaign-data";

const RARITY_COLOR: Record<PotionRarity, string> = {
  sem: "oklch(0.5 0.02 80)",
  comum: "oklch(0.55 0.04 80)",
  incomum: "oklch(0.6 0.12 160)",
  raro: "oklch(0.6 0.16 280)",
  super_raro: "oklch(0.62 0.2 35)",
};

const RARITY_LABEL: Record<PotionRarity, string> = {
  sem: "Sem raridade",
  comum: "Comuns",
  incomum: "Incomuns",
  raro: "Raros",
  super_raro: "Super Raros",
};

const RARITY_ORDER: PotionRarity[] = ["sem", "comum", "incomum", "raro", "super_raro"];

function AddForm({ onAdd }: { onAdd: (p: Potion) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [effect, setEffect] = useState("");
  const [rarity, setRarity] = useState<PotionRarity>("sem");
  const [count, setCount] = useState(1);

  const reset = () => {
    setName("");
    setEffect("");
    setRarity("sem");
    setCount(1);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[var(--color-ink)]/30 bg-[oklch(0.96_0.04_80)]/30 px-3 py-2 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]/60 hover:text-[var(--color-ink)] transition"
      >
        <Plus className="size-3.5" />
        Adicionar poção
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/50 p-3">
      <div className="flex gap-2">
        <input
          autoFocus
          placeholder="Nome da poção"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
        />
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as PotionRarity)}
          className="rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[12px] text-[var(--color-ink)]"
        >
          <option value="sem">Sem raridade</option>
          <option value="comum">Comum</option>
          <option value="incomum">Incomum</option>
          <option value="raro">Raro</option>
          <option value="super_raro">Super Raro</option>
        </select>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-14 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[12px] text-[var(--color-ink)]"
        />
      </div>
      <textarea
        placeholder="Efeito"
        value={effect}
        onChange={(e) => setEffect(e.target.value)}
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
              id: `potion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: name.trim(),
              effect: effect.trim(),
              rarity,
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

export function PotionsList() {
  const { campaignId, role } = useCampaign();
  const { list: potions, persist } = useSyncedPotions(campaignId);
  const canEdit = role !== "guest";

  const addPotion = (p: Potion) => persist([...potions, p]);
  const removePotion = (id: string) => persist(potions.filter((p) => p.id !== id));
  const updateCount = (id: string, delta: number) =>
    persist(potions.map((p) => (p.id === id ? { ...p, count: Math.max(0, p.count + delta) } : p)));

  const groups = useMemo(() => {
    const out: Record<PotionRarity, Potion[]> = {
      sem: [],
      comum: [],
      incomum: [],
      raro: [],
      super_raro: [],
    };
    for (const p of potions) out[p.rarity].push(p);
    return out;
  }, [potions]);

  return (
    <>
      {canEdit ? (
        <AddForm onAdd={addPotion} />
      ) : (
        <p className="mb-3 text-center font-[family-name:var(--font-script)] text-[12px] italic text-[var(--color-ink)]/55">
          modo de leitura
        </p>
      )}
      {RARITY_ORDER.map((r) =>
        groups[r].length === 0 ? null : (
          <LoreBlock
            key={r}
            title={`${RARITY_LABEL[r]} · ${groups[r].length}`}
            hint={
              r === "sem"
                ? "tinturas sem classificação"
                : r === "comum"
                  ? "frascos do dia a dia"
                  : r === "incomum"
                    ? "elixires de alquimistas"
                    : r === "raro"
                      ? "filtros de raros mestres"
                      : "essências lendárias"
            }
          >
            <ul className="space-y-3">
              {groups[r].map((p) => (
                <li key={p.id} className="border-l-2 pl-3" style={{ borderColor: RARITY_COLOR[r] }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
                      {p.name}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => removePotion(p.id)}
                        className="text-[var(--color-ink)]/40 hover:text-red-700 transition"
                        title="Remover"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                  {p.effect && (
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink)]/85">
                      {p.effect}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/55">
                      Quantidade
                    </span>
                    <button
                      onClick={() => canEdit && updateCount(p.id, -1)}
                      disabled={!canEdit}
                      className="rounded border border-[var(--color-ink)]/20 px-1.5 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-ink)]/10"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="min-w-[1.5rem] text-center font-[family-name:var(--font-display)] text-[13px] text-[var(--color-ink)]">
                      {p.count}
                    </span>
                    <button
                      onClick={() => canEdit && updateCount(p.id, 1)}
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
        ),
      )}
    </>
  );
}
