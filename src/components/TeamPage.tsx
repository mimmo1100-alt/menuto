"use client";

import { useEffect, useState } from "react";
import { LOCALE, pickLang, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type R = { id: string; name: string; slug: string; currency: string };
type Member = { id: string; email: string; name: string | null; role: string; createdAt: string };

const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "Team", people: "Chi può accedere", hint: "Il personale (Staff) vede solo gli ordini: accetta, stampa, segna pronto. Il titolare vede tutto.",
    OWNER: "Titolare", STAFF: "Personale", PARTNER: "Partner", you: "tu", since: "dal", remove: "Rimuovi", confirm: "Rimuovere {email}? Non potrà più accedere.",
    add: "Aggiungi una persona", email: "Email", name: "Nome (facoltativo)", password: "Password (almeno 8 caratteri)", role: "Ruolo", create: "Aggiungi",
    addHint: "Dai tu la password alla persona. Potrà cambiarla da questa pagina, o con «Password dimenticata?» nella pagina di accesso.",
    added: "Aggiunto", removed: "Rimosso", errTaken: "Questa email ha già un account.", errInvalid: "Controlla email e password (almeno 8 caratteri).",
    errLast: "Serve almeno un titolare.", err: "Non riuscito. Riprova.",
    mine: "La tua password", current: "Password attuale", next: "Nuova password (almeno 8 caratteri)", again: "Ripeti la nuova password", change: "Cambia password",
    changed: "Password cambiata. Gli altri dispositivi sono stati disconnessi.", wrong: "La password attuale non è giusta.", short: "La nuova password è troppo corta.", mismatch: "Le due password non sono uguali.", tooMany: "Troppi tentativi. Riprova tra un'ora.",
  },
  en: {
    title: "Team", people: "Who can sign in", hint: "Staff only see the orders: accept, print, mark ready. The owner sees everything.",
    OWNER: "Owner", STAFF: "Staff", PARTNER: "Partner", you: "you", since: "since", remove: "Remove", confirm: "Remove {email}? They won't be able to sign in any more.",
    add: "Add a person", email: "Email", name: "Name (optional)", password: "Password (at least 8 characters)", role: "Role", create: "Add",
    addHint: "You give the password to the person. They can change it on this page, or with “Forgot password?” on the sign-in page.",
    added: "Added", removed: "Removed", errTaken: "This email already has an account.", errInvalid: "Check the email and password (at least 8 characters).",
    errLast: "There must be at least one owner.", err: "Didn't work. Try again.",
    mine: "Your password", current: "Current password", next: "New password (at least 8 characters)", again: "Repeat the new password", change: "Change password",
    changed: "Password changed. Your other devices were signed out.", wrong: "The current password isn't right.", short: "The new password is too short.", mismatch: "The two passwords don't match.", tooMany: "Too many tries. Try again in an hour.",
  },
  ar: {
    title: "الفريق", people: "مين يقدر يدخل", hint: "الموظف (Staff) بيشوف الطلبات بس: يقبل ويطبع ويعلّم إنه جاهز. صاحب المطعم بيشوف كل حاجة.",
    OWNER: "صاحب المطعم", STAFF: "موظف", PARTNER: "شريك", you: "انت", since: "من", remove: "امسح", confirm: "تمسح {email}؟ مش هيقدر يدخل تاني.",
    add: "ضيف شخص", email: "الإيميل", name: "الاسم (اختياري)", password: "كلمة السر (8 حروف على الأقل)", role: "الدور", create: "ضيف",
    addHint: "انت اللي بتدّي كلمة السر للشخص. يقدر يغيّرها من الصفحة دي، أو من «نسيت كلمة السر؟» في صفحة الدخول.",
    added: "اتضاف", removed: "اتمسح", errTaken: "الإيميل ده عليه حساب قبل كده.", errInvalid: "راجع الإيميل وكلمة السر (8 حروف على الأقل).",
    errLast: "لازم يفضل صاحب مطعم واحد على الأقل.", err: "مانفعش. حاول تاني.",
    mine: "كلمة السر بتاعتك", current: "كلمة السر الحالية", next: "كلمة السر الجديدة (8 حروف على الأقل)", again: "اكتب الجديدة تاني", change: "غيّر كلمة السر",
    changed: "كلمة السر اتغيرت. الأجهزة التانية اتعملها خروج.", wrong: "كلمة السر الحالية غلط.", short: "كلمة السر الجديدة قصيرة.", mismatch: "الكلمتين مش زي بعض.", tooMany: "محاولات كتير. جرّب بعد ساعة.",
  },
};

export default function TeamPage({ restaurant, restaurants, me, canEdit, initial }: { restaurant: R | null; restaurants: R[]; me: { id: string; email: string; role: string }; canEdit: boolean; initial: Member[] }) {
  const [lang, setLang] = useState<Lang>("it");
  const [team, setTeam] = useState(initial);
  const [msg, setMsg] = useState<{ where: "team" | "pw"; text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const k = (x: string, v: Record<string, string> = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace(`{${a}}`, b), D[lang][x] ?? x);
  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, fd = new FormData(form);
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/dashboard/${restaurant!.id}/team`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd)) }).catch(() => null);
    setBusy(false);
    if (res?.ok) { setTeam(await res.json()); form.reset(); setMsg({ where: "team", text: k("added") }); return; }
    const j = await res?.json().catch(() => ({})) ?? {};
    setMsg({ where: "team", bad: true, text: k(j.error === "email_taken" ? "errTaken" : j.error === "invalid" ? "errInvalid" : "err") });
  }
  async function remove(m: Member) {
    if (!confirm(k("confirm", { email: m.email }))) return;
    setMsg(null);
    const res = await fetch(`/api/dashboard/${restaurant!.id}/team/${m.id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) { setTeam(await res.json()); setMsg({ where: "team", text: k("removed") }); return; }
    const j = await res?.json().catch(() => ({})) ?? {};
    setMsg({ where: "team", bad: true, text: k(j.error === "last_owner" ? "errLast" : "err") });
  }
  async function changePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, fd = new FormData(form);
    const current = String(fd.get("current")), next = String(fd.get("next")), again = String(fd.get("again"));
    if (next.length < 8) return setMsg({ where: "pw", bad: true, text: k("short") });
    if (next !== again) return setMsg({ where: "pw", bad: true, text: k("mismatch") });
    setBusy(true); setMsg(null);
    const res = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current, next }) }).catch(() => null);
    setBusy(false);
    if (res?.ok) { form.reset(); setMsg({ where: "pw", text: k("changed") }); return; }
    const j = await res?.json().catch(() => ({})) ?? {};
    setMsg({ where: "pw", bad: true, text: k(res?.status === 429 ? "tooMany" : j.error === "wrong" ? "wrong" : j.error === "short" ? "short" : "err") });
  }
  const note = (where: "team" | "pw") => msg?.where === where && <p className={msg.bad ? "err" : "small"} style={{ margin: 0 }}>{msg.text}</p>;
  const date = (iso: string) => new Date(iso).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <DashNav lang={lang} current="team" restaurant={restaurant} restaurants={restaurants} isPartner={me.role === "PARTNER"} staff={me.role === "STAFF"} />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>

        {canEdit && restaurant && (
          <>
            <section className="card">
              <h3>{k("people")} · {restaurant.name}</h3>
              <p className="small muted" style={{ margin: 0 }}>{k("hint")}</p>
              <table className="ptable"><tbody>
                {team.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.name || m.email}</b>{m.name && <div className="small muted">{m.email}</div>}</td>
                    <td><span className="pill">{k(m.role)}</span>{m.id === me.id && <span className="small muted"> ({k("you")})</span>}</td>
                    <td className="small muted">{k("since")} {date(m.createdAt)}</td>
                    <td style={{ textAlign: "end" }}>{m.id !== me.id && <button className="link small" onClick={() => remove(m)}>{k("remove")}</button>}</td>
                  </tr>
                ))}
              </tbody></table>
              {note("team")}
            </section>

            <section className="card">
              <h3>{k("add")}</h3>
              <form className="form" onSubmit={add} style={{ margin: 0 }}>
                <div className="row2">
                  <label className="f">{k("email")} *<input type="email" name="email" required autoComplete="off" /></label>
                  <label className="f">{k("name")}<input type="text" name="name" maxLength={60} autoComplete="off" /></label>
                  <label className="f">{k("password")} *<input type="text" name="password" required minLength={8} autoComplete="new-password" /></label>
                  <label className="f">{k("role")}<select name="role" defaultValue="STAFF"><option value="STAFF">{k("STAFF")}</option><option value="OWNER">{k("OWNER")}</option></select></label>
                </div>
                <span className="small muted">{k("addHint")}</span>
                <div><button className="btn" disabled={busy}>{k("create")}</button></div>
              </form>
            </section>
          </>
        )}

        <section className="card">
          <h3>{k("mine")}</h3>
          <span className="small muted">{me.email}</span>
          <form className="form" onSubmit={changePw} style={{ margin: 0, maxWidth: 420 }}>
            <input type="email" name="username" autoComplete="username" value={me.email} readOnly hidden />
            <label className="f">{k("current")}<input type="password" name="current" required autoComplete="current-password" /></label>
            <label className="f">{k("next")}<input type="password" name="next" required minLength={8} autoComplete="new-password" /></label>
            <label className="f">{k("again")}<input type="password" name="again" required minLength={8} autoComplete="new-password" /></label>
            {note("pw")}
            <div><button className="btn" disabled={busy}>{k("change")}</button></div>
          </form>
        </section>
      </div></div>
    </>
  );
}
