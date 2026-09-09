/**
 * Tela de entrada de Belamar (login / cadastro por e-mail e senha).
 * Mesmo tema visual da mesa: pergaminho, tinta sépia e tipografia display.
 */
import { useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import tableBg from "@/assets/scene/table-bg.jpg";
import parchmentImg from "@/assets/parchment.jpg";
import { useAuth } from "@/lib/auth-context";

type Mode = "entrar" | "criar";

export function AuthScreen() {
  const { signIn, signInAsPlayer, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "entrar") {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password, name.trim());
        if (needsConfirmation) {
          setNotice(
            "Conta criada. Confirme seu e-mail pelo link que acabamos de enviar antes de entrar.",
          );
          setMode("entrar");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !email.trim() || password.length < 6 || (mode === "criar" && !name.trim());

  const enterAsPlayer = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signInAsPlayer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar como jogador.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4"
      style={{
        backgroundImage: `url(${tableBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "oklch(0.12 0.02 30)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 30%, oklch(0.06 0.02 30 / 0.6) 80%, oklch(0.04 0.01 25 / 0.9) 100%)",
        }}
      />

      <div
        className="relative w-full max-w-[420px] rounded-md p-7"
        style={{
          backgroundImage: `url(${parchmentImg})`,
          backgroundSize: "cover",
          border: "1px solid oklch(0.55 0.08 65 / 0.55)",
          boxShadow: "0 28px 70px oklch(0 0 0 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.15)",
        }}
      >
        <div className="flex items-center gap-2 text-[var(--color-ink)]">
          <Compass size={18} strokeWidth={1.3} />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[17px] tracking-[0.3em]">
              BELAMAR
            </h1>
            <p className="font-[family-name:var(--font-script)] text-[12px] italic text-[var(--color-ink)]/70">
              o mar guarda segredos antigos
            </p>
          </div>
        </div>

        <button
          disabled={busy}
          onClick={() => void enterAsPlayer()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-[oklch(0.96_0.04_80)] disabled:opacity-40"
        >
          {busy && <Loader2 className="size-3.5 animate-spin" />}
          Entrar como jogador
        </button>
        <p className="mt-2 text-center text-[12px] text-[var(--color-ink)]/65">
          Sem cadastro: escolha seu personagem na próxima tela.
        </p>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/45">
          <span className="h-px flex-1 bg-[var(--color-ink)]/15" />
          Conta do Mestre
          <span className="h-px flex-1 bg-[var(--color-ink)]/15" />
        </div>

        <div className="flex rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)]/60 p-0.5">
          {(["entrar", "criar"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="flex-1 rounded-sm px-3 py-1.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] transition"
              style={{
                background: mode === m ? "var(--color-ink)" : "transparent",
                color: mode === m ? "oklch(0.96 0.04 80)" : "oklch(0.25 0.04 40 / 0.7)",
              }}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {mode === "criar" && (
            <input
              placeholder="Seu nome na mesa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-3 py-2 text-[14px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
            />
          )}
          <input
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-3 py-2 text-[14px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
          />
          <input
            type="password"
            autoComplete={mode === "criar" ? "new-password" : "current-password"}
            placeholder="Senha (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !disabled) void submit();
            }}
            className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-3 py-2 text-[14px] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]/40"
          />
        </div>

        {error && (
          <p className="mt-3 rounded border border-red-900/30 bg-red-900/10 px-3 py-2 text-[13px] text-red-900">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-3 rounded border border-[var(--color-ink)]/25 bg-[oklch(0.96_0.04_80)]/70 px-3 py-2 text-[13px] text-[var(--color-ink)]">
            {notice}
          </p>
        )}

        <button
          disabled={disabled}
          onClick={() => void submit()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[var(--color-ink)] px-4 py-2.5 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.28em] text-[oklch(0.96_0.04_80)] disabled:opacity-40"
        >
          {busy && <Loader2 className="size-3.5 animate-spin" />}
          {mode === "entrar" ? "Entrar na mesa" : "Criar minha conta"}
        </button>

        <p className="mt-3 text-center font-[family-name:var(--font-script)] text-[12px] italic text-[var(--color-ink)]/60">
          {mode === "entrar"
            ? "A crônica só se abre a quem tem nome."
            : "Após o cadastro, pode ser necessário confirmar o e-mail."}
        </p>
      </div>
    </div>
  );
}
