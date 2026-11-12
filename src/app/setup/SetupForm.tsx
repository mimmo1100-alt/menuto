"use client";

import { useState } from "react";

export default function SetupForm() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (String(fd.get("password")).length < 8) { setErr("La password deve avere almeno 8 caratteri."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd)) });
    if (res.ok) { location.href = "/dashboard/partner"; return; }
    setErr(res.status === 409 ? "Configurazione già fatta: accedi." : "Controlla i campi e riprova.");
    setBusy(false);
  }
  const field = { width: "100%", border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 10, padding: "10px 12px" } as const;
  return (
    <div className="wrap">
      <form className="card login" onSubmit={submit}>
        <h1 style={{ fontSize: 28 }}>Benvenuto in Menuto</h1>
        <p className="muted" style={{ margin: 0 }}>Crea il tuo account. Aggiungeremo anche un ristorante di prova per iniziare.</p>
        <label className="f" htmlFor="company">Nome della tua azienda<input id="company" name="company" required style={field} /></label>
        <label className="f" htmlFor="name">Il tuo nome<input id="name" name="name" required autoComplete="name" style={field} /></label>
        <label className="f" htmlFor="email">Email<input type="email" id="email" name="email" required autoComplete="email" style={field} /></label>
        <label className="f" htmlFor="password">Password (almeno 8 caratteri)<input type="password" id="password" name="password" required minLength={8} autoComplete="new-password" style={field} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy}>Crea account</button>
      </form>
    </div>
  );
}
