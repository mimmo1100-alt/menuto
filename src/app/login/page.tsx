"use client";

import { useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
    if (res.ok) { const j = await res.json(); location.href = j.role === "PARTNER" ? "/dashboard/partner" : "/dashboard/orders"; return; }
    setErr(res.status === 401 ? "Email o password non corretti." : "Accesso non riuscito. Riprova.");
    setBusy(false);
  }
  return (
    <div className="wrap">
      <form className="card login" onSubmit={submit}>
        <h1 style={{ fontSize: 28 }}>Menuto</h1>
        <label className="f" htmlFor="email">Email<input type="email" id="email" name="email" autoComplete="username" required /></label>
        <label className="f" htmlFor="password">Password<input type="password" id="password" name="password" autoComplete="current-password" required style={{ width: "100%", border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 10, padding: "10px 12px" }} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy}>Accedi</button>
      </form>
    </div>
  );
}
