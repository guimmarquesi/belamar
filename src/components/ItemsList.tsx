import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  COMMON_ITEMS,
  UNCOMMON_ITEMS,
  RARE_ITEMS,
  SUPER_RARE_ITEMS,
  type Item,
  type ItemRarity,
} from "@/lib/items";
import {
  loadCustomItems,
  saveCustomItems,
  loadOwners,
  saveOwners,
  loadHidden,
  saveHidden,
  type CustomItem,
} from "@/lib/items-store";
import { PARTY } from "@/lib/party";
import { LoreBlock } from "@/components/LoreBlock";

const RARITY_COLOR: Record<ItemRarity, string> = {
  comum: "oklch(0.55 0.04 80)",
  incomum: "oklch(0.6 0.12 160)",
  raro: "oklch(0.6 0.16 280)",
  super_raro: "oklch(0.62 0.2 35)",
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  comum: "Comuns",
  incomum: "Incomuns",
  raro: "Raros",
  super_raro: "Super Raros",
};

const NO_OWNER = "__none__";

function ItemEntry({
  item,
  itemKey,
  rarity,
  owner,
  onOwnerChange,
  onDelete,
}: {
  item: Item;
  itemKey: string;
  rarity: ItemRarity;
  owner: string;
  onOwnerChange: (v: string) => void;
  onDelete?: () => void;
}) {
  return (
    <li className="border-l-2 pl-3" style={{ borderColor: RARITY_COLOR[rarity] }}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
          {item.name}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-[var(--color-ink)]/40 hover:text-red-700 transition"
            title="Remover"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
      {item.flavor && (
        <p className="mt-1 font-[family-name:var(--font-script)] text-[13px] italic leading-relaxed text-[var(--color-ink)]/70">
          {item.flavor}
        </p>
      )}
      {item.effect && (
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink)]/85">
          {item.effect}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <label className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/55">
          Em posse de
        </label>
        <select
          value={owner || NO_OWNER}
          onChange={(e) => onOwnerChange(e.target.value === NO_OWNER ? "" : e.target.value)}
          className="rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/60 px-2 py-0.5 text-[12px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
        >
          <option value={NO_OWNER}>— Tesouro do grupo —</option>
          {PARTY.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

function AddItemForm({ onAdd }: { onAdd: (item: CustomItem) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState<ItemRarity>("comum");
  const [flavor, setFlavor] = useState("");
  const [effect, setEffect] = useState("");

  const reset = () => {
    setName("");
    setFlavor("");
    setEffect("");
    setRarity("comum");
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
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as ItemRarity)}
          className="rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[12px] text-[var(--color-ink)]"
        >
          <option value="comum">Comum</option>
          <option value="incomum">Incomum</option>
          <option value="raro">Raro</option>
          <option value="super_raro">Super Raro</option>
        </select>
      </div>
      <textarea
        placeholder="Sabor / descrição (opcional)"
        value={flavor}
        onChange={(e) => setFlavor(e.target.value)}
        rows={2}
        className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1 text-[13px] italic text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
      />
      <textarea
        placeholder="Efeito mecânico (opcional)"
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
              id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: name.trim(),
              rarity,
              flavor: flavor.trim(),
              effect: effect.trim(),
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

export function ItemsList() {
  const [custom, setCustom] = useState<CustomItem[]>([]);
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    setCustom(loadCustomItems());
    setOwners(loadOwners());
    setHidden(loadHidden());
  }, []);

  const updateOwner = (key: string, owner: string) => {
    const next = { ...owners };
    if (owner) next[key] = owner;
    else delete next[key];
    setOwners(next);
    saveOwners(next);
  };

  const addItem = (item: CustomItem) => {
    const next = [...custom, item];
    setCustom(next);
    saveCustomItems(next);
  };

  const deleteItem = (key: string) => {
    if (key.startsWith("builtin:")) {
      const next = [...hidden, key];
      setHidden(next);
      saveHidden(next);
    } else {
      const next = custom.filter((c) => c.id !== key);
      setCustom(next);
      saveCustomItems(next);
    }
    if (owners[key]) {
      const o = { ...owners };
      delete o[key];
      setOwners(o);
      saveOwners(o);
    }
  };

  const groups = useMemo(() => {
    const builtIn: Record<ItemRarity, { item: Item; key: string }[]> = {
      comum: COMMON_ITEMS.map((it) => ({ item: it, key: `builtin:${it.name}` })),
      incomum: UNCOMMON_ITEMS.map((it) => ({ item: it, key: `builtin:${it.name}` })),
      raro: RARE_ITEMS.map((it) => ({ item: it, key: `builtin:${it.name}` })),
      super_raro: SUPER_RARE_ITEMS.map((it) => ({ item: it, key: `builtin:${it.name}` })),
    };
    const hiddenSet = new Set(hidden);
    (Object.keys(builtIn) as ItemRarity[]).forEach((r) => {
      builtIn[r] = builtIn[r].filter((entry) => !hiddenSet.has(entry.key));
    });
    for (const ci of custom) {
      builtIn[ci.rarity].push({ item: ci, key: ci.id });
    }
    return builtIn;
  }, [custom, hidden]);

  const rarities: ItemRarity[] = ["comum", "incomum", "raro", "super_raro"];

  return (
    <>
      <AddItemForm onAdd={addItem} />
      {rarities.map((r) => (
        <LoreBlock
          key={r}
          title={`${RARITY_LABEL[r]} · ${groups[r].length}`}
          hint={
            r === "comum"
              ? "quinquilharias úteis"
              : r === "incomum"
                ? "curiosidades de Belamar"
                : r === "raro"
                  ? "relíquias do horizonte"
                  : "lendas do além-mar"
          }
        >
          <ul className="space-y-3">
            {groups[r].map(({ item, key }) => (
              <ItemEntry
                key={key}
                itemKey={key}
                item={item}
                rarity={r}
                owner={owners[key] ?? ""}
                onOwnerChange={(v) => updateOwner(key, v)}
                onDelete={() => deleteItem(key)}
              />
            ))}
          </ul>
        </LoreBlock>
      ))}
    </>
  );
}
