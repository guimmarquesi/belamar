/**
 * Exportação das chaves legadas de `localStorage` usadas pelo app Belamar.
 *
 * Serve para migrar os dados locais do jogador para outro backend sem perda.
 * Puramente leitura — não altera nada no navegador.
 */

/** Todas as chaves atualmente utilizadas pelo app. */
export const LEGACY_KEYS = [
  // notas / sessão
  "belamar.session-notes",
  "belamar.category-notes",
  "belamar.notes",
  // grupo
  "belamar.party-goals",
  "belamar.party-status",
  // missões
  "belamar.quests",
  // poções
  "belamar.potions",
  "belamar.potions.seeded.v1",
  // itens
  "belamar.custom-items",
  "belamar.item-owners",
  "belamar.hidden-items",
  // bolsa
  "belamar.bag",
  "belamar.bag.coins",
  // npcs
  "belamar.custom-npcs",
  // mapa
  "belamar.custom-markers",
  // clima
  "belamar:weather",
  "belamar:weather-auto",
  "belamar:weather-auto-ts",
] as const;

export type LegacyKey = (typeof LEGACY_KEYS)[number];

export type LegacyExport = {
  app: "belamar";
  version: 1;
  exportedAt: string;
  keys: Record<string, unknown>;
};

const PREFIXES = ["belamar.", "belamar:"];

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Lê todas as chaves `belamar.*` / `belamar:*` presentes no localStorage.
 * Inclui as chaves conhecidas em `LEGACY_KEYS` e também quaisquer outras
 * com o mesmo prefixo (para não perder dados de versões anteriores).
 */
export function collectLegacyData(): LegacyExport {
  const keys: Record<string, unknown> = {};

  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const found = new Set<string>(LEGACY_KEYS);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && PREFIXES.some((p) => key.startsWith(p))) found.add(key);
    }
    for (const key of [...found].sort()) {
      const raw = localStorage.getItem(key);
      if (raw !== null) keys[key] = parse(raw);
    }
  }

  return {
    app: "belamar",
    version: 1,
    exportedAt: new Date().toISOString(),
    keys,
  };
}

/** Retorna o export completo como string JSON formatada. */
export function exportLegacyDataAsJson(): string {
  return JSON.stringify(collectLegacyData(), null, 2);
}

/** Dispara o download de um arquivo `.json` com os dados legados. */
export function downloadLegacyDataAsJson(
  filename = `belamar-backup-${new Date().toISOString().slice(0, 10)}.json`,
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const blob = new Blob([exportLegacyDataAsJson()], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

/**
 * Restaura um backup JSON de Belamar no localStorage atual.
 * Chaves fora dos prefixos de Belamar são ignoradas e nenhum dado existente é apagado.
 */
export function restoreLegacyDataFromJson(source: string): number {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return 0;

  const parsed = JSON.parse(source) as Partial<LegacyExport>;
  if (parsed.app !== "belamar" || parsed.version !== 1 || !parsed.keys) {
    throw new Error("Este arquivo não é um backup válido de Belamar.");
  }

  let restored = 0;
  for (const [key, value] of Object.entries(parsed.keys)) {
    if (!PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    restored += 1;
  }
  return restored;
}
