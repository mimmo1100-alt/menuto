"use client";

import { useEffect, useState } from "react";

/** Without ?token: ask for the email. With ?token (link from the email): choose the new password. */
export default function Reset() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"form" | "sent" | "busy">("form");
  const [err, setErr] = useState("");
  useEffect(() => { setToken(new URLSearchParams(location.search).get("token")); }, []);

  async function ask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setState("busy");
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const res = await fetch("/api/auth/reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    if (res?.ok) return setState("sent");
    setErr(res?.status === 429 ? "Troppe richieste. Riprova tra un'ora." : "Qualcosa non ha funzionato. Riprova.");
    setState("form");
  }
  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? ""), again = String(fd.get("again") ?? "");
    if (password.length < 8) return setErr("La password deve avere almeno 8 caratteri.");
    if (password !== again) return setErr("Le due password non sono uguali.");
    setState("busy");
    const res = await fetch("/api/auth/reset/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) }).catch(() => null);
    if (res?.ok) { const j = await res.json(); location.href = j.role === "PARTNER" ? "/dashboard/partner" : "/dashboard/orders"; return; }
    setErr(res?.status === 400 ? "Il link è scaduto o è già stato usato. Chiedine uno nuovo." : "Qualcosa non ha funzionato. Riprova.");
    setState("form");
  }

  return (
    <div className="wrap">
      {token ? (
        <form className="card login" onSubmit={confirm}>
          <h1 style={{ fontSize: 28 }}>Nuova password</h1>
          <label className="f" htmlFor="password">Nuova password (almeno 8 caratteri)<input type="password" id="password" name="password" autoComplete="new-password" minLength={8} required /></label>
          <label className="f" htmlFor="again">Ripeti la password<input type="password" id="again" name="again" autoComplete="new-password" minLength={8} required /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn" disabled={state === "busy"}>Salva e accedi</button>
          {err.includes("scaduto") && <a className="link small" href="/login/reset" style={{ justifySelf: "center" }}>Chiedi un nuovo link</a>}
        </form>
      ) : state === "sent" ? (
        <div className="card login">
          <h1 style={{ fontSize: 28 }}>Controlla la tua email</h1>
          <p>Se questo indirizzo ha un account Menuto, ti abbiamo mandato un link per scegliere la nuova password. Vale 1 ora.</p>
          <p className="small muted">Non arriva? Guarda nella posta indesiderata.</p>
          <a className="link small" href="/login">Torna all&apos;accesso</a>
        </div>
      ) : (
        <form className="card login" onSubmit={ask}>
          <h1 style={{ fontSize: 28 }}>Password dimenticata</h1>
          <p className="small muted" style={{ margin: 0 }}>Scrivi l&apos;email con cui accedi: ti mandiamo un link per sceglierne una nuova.</p>
          <label className="f" htmlFor="email">Email<input type="email" id="email" name="email" autoComplete="username" required /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn" disabled={state === "busy"}>Mandami il link</button>
          <a className="link small" href="/login" style={{ justifySelf: "center" }}>Torna all&apos;accesso</a>
        </form>
      )}
    </div>
  );
}
