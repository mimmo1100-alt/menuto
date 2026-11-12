"use client";

import { useEffect, useState } from "react";
import type { MenuEdit } from "@/lib/menu-edit";
import { pickLang, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type Cat = MenuEdit["categories"][number];
type Item = Cat["items"][number];
type Group = MenuEdit["groups"][number];
type R = { id: string; name: string; slug: string; currency: string };
type L3 = { it: string; en: string; ar: string };

const LABELS = ["spicy", "vegetarian", "vegan", "halal", "raw"] as const;
const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "Menu", categories: "Categorie", groups: "Opzioni ed extra", addCategory: "Aggiungi categoria", addItem: "Aggiungi prodotto", addGroup: "Aggiungi gruppo",
    addOption: "Aggiungi scelta", addSize: "Aggiungi formato", name: "Nome", desc: "Descrizione", price: "Prezzo €", sizes: "Formati", internal: "Nome interno per la cucina",
    hidden: "Nascosto", soldOut: "Esaurito", available: "Disponibile", labels: "Etichette", hideInstr: "Nascondi il campo istruzioni speciali",
    attached: "Gruppi di opzioni", attachGroup: "Collega un gruppo…", required: "Obbligatorio", min: "Minimo", max: "Massimo (0 = senza limite)", preselected: "Preselezionato",
    remove: "Elimina", up: "Su", down: "Giù", edit: "Modifica", close: "Chiudi", save: "Salva modifiche", discard: "Annulla modifiche", saved: "Salvato", unsaved: "Modifiche non salvate",
    saveErr: "Salvataggio non riuscito. Controlla i campi e riprova.", confirmDel: "Tocca di nuovo per eliminare", empty: "Nessun prodotto. Aggiungine uno.",
    fromCategory: "dalla categoria", showOnly: "Visibile solo in certi giorni e orari", days: "Giorni", from: "Dalle", to: "Alle",
    spicy: "Piccante", vegetarian: "Vegetariano", vegan: "Vegano", halal: "Halal", raw: "Crudo", newCategory: "Nuova categoria", newItem: "Nuovo prodotto", newGroup: "Nuovo gruppo",
    translations: "Traduzioni", groupHint: "Un gruppo collegato a una categoria vale per tutti i suoi prodotti.",
  },
  en: {
    title: "Menu", categories: "Categories", groups: "Options & extras", addCategory: "Add category", addItem: "Add item", addGroup: "Add group",
    addOption: "Add choice", addSize: "Add size", name: "Name", desc: "Description", price: "Price €", sizes: "Sizes", internal: "Internal name for the kitchen",
    hidden: "Hidden", soldOut: "Sold out", available: "Available", labels: "Labels", hideInstr: "Hide the special instructions field",
    attached: "Option groups", attachGroup: "Attach a group…", required: "Required", min: "Minimum", max: "Maximum (0 = no limit)", preselected: "Preselected",
    remove: "Delete", up: "Up", down: "Down", edit: "Edit", close: "Close", save: "Save changes", discard: "Discard changes", saved: "Saved", unsaved: "Unsaved changes",
    saveErr: "Couldn't save. Check the fields and try again.", confirmDel: "Tap again to delete", empty: "No items yet. Add one.",
    fromCategory: "from the category", showOnly: "Only visible on some days and times", days: "Days", from: "From", to: "To",
    spicy: "Spicy", vegetarian: "Vegetarian", vegan: "Vegan", halal: "Halal", raw: "Raw", newCategory: "New category", newItem: "New item", newGroup: "New group",
    translations: "Translations", groupHint: "A group attached to a category applies to all its items.",
  },
  ar: {
    title: "المنيو", categories: "الأقسام", groups: "الإضافات والاختيارات", addCategory: "أضف قسم", addItem: "أضف صنف", addGroup: "أضف مجموعة",
    addOption: "أضف اختيار", addSize: "أضف حجم", name: "الاسم", desc: "الوصف", price: "السعر €", sizes: "الأحجام", internal: "اسم داخلي للمطبخ",
    hidden: "مخفي", soldOut: "خلصان", available: "متاح", labels: "علامات", hideInstr: "إخفاء خانة الملاحظات الخاصة",
    attached: "مجموعات الإضافات", attachGroup: "اربط مجموعة…", required: "إجباري", min: "الحد الأدنى", max: "الحد الأقصى (0 = بلا حد)", preselected: "مختار مسبقًا",
    remove: "حذف", up: "لفوق", down: "لتحت", edit: "تعديل", close: "قفل", save: "احفظ التعديلات", discard: "تراجع", saved: "اتحفظ", unsaved: "تعديلات مش محفوظة",
    saveErr: "الحفظ ماتمّش. راجع الخانات وجرب تاني.", confirmDel: "دوس تاني للحذف", empty: "مفيش أصناف. أضف صنف.",
    fromCategory: "من القسم", showOnly: "يظهر في أيام وساعات معيّنة بس", days: "الأيام", from: "من", to: "إلى",
    spicy: "حار", vegetarian: "نباتي", vegan: "نباتي صرف", halal: "حلال", raw: "نيء", newCategory: "قسم جديد", newItem: "صنف جديد", newGroup: "مجموعة جديدة",
    translations: "الترجمات", groupHint: "المجموعة المربوطة بقسم بتتطبق على كل أصنافه.",
  },
};
const DAYS: Record<Lang, string[]> = {
  it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], ar: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
};

let seq = 0;
const newId = () => `new_${Date.now().toString(36)}_${seq++}`;
const blank = (it = ""): L3 => ({ it, en: "", ar: "" });
const toEuro = (c: number) => (c / 100).toFixed(2);
const toCents = (s: string) => { const n = Number(String(s).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0; };
const pick = (v: L3, lang: Lang) => v[lang] || v.it || v.en || v.ar;

export default function MenuEditor({ restaurant, restaurants, initial, isPartner = false }: { restaurant: R; restaurants: R[]; initial: MenuEdit; isPartner?: boolean }) {
  const [lang, setLang] = useState<Lang>("it");
  const [m, setM] = useState<MenuEdit>(initial);
  const [saved, setSaved] = useState<MenuEdit>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const k = (s: string) => D[lang][s] ?? s;
  const dirty = JSON.stringify(m) !== JSON.stringify(saved);

  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (fn: (d: MenuEdit) => void) => setM((cur) => { const d = structuredClone(cur); fn(d); return d; });
  const del = (key: string, fn: () => void) => { if (armed === key) { fn(); setArmed(null); } else { setArmed(key); setTimeout(() => setArmed((a) => (a === key ? null : a)), 3000); } };
  const move = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  async function save() {
    setStatus("saving");
    const res = await fetch(`/api/dashboard/${restaurant.id}/menu`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(m) });
    if (!res.ok) { setStatus("error"); return; }
    const fresh = (await res.json()) as MenuEdit;
    setM(fresh); setSaved(fresh); setStatus("saved"); setOpen(null);
    setTimeout(() => setStatus((s) => (s === "saved" ? "" : s)), 2000);
  }

  return (
    <>
      <DashNav lang={lang} current="menu" restaurant={restaurant} restaurants={restaurants} isPartner={isPartner} />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>

        <section className="card"><h3>{k("categories")}</h3>
          {m.categories.map((c, ci) => (
            <div className="acat" key={c.id}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <b style={{ flex: 1, minWidth: 0 }}>{pick(c.name, lang) || k("newCategory")}</b>
                {c.hidden && <span className="pill neutral">{k("hidden")}</span>}
                <button className="btn sm ghost" onClick={() => edit((d) => move(d.categories, ci, -1))} aria-label={k("up")}>↑</button>
                <button className="btn sm ghost" onClick={() => edit((d) => move(d.categories, ci, 1))} aria-label={k("down")}>↓</button>
                <button className="btn sm ghost" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? k("close") : k("edit")}</button>
              </div>
              {open === c.id && (
                <div style={{ display: "grid", gap: 10 }}>
                  <L3Input label={k("name")} value={c.name} onChange={(v) => edit((d) => { d.categories[ci].name = v; })} idp={`c-${c.id}-name`} />
                  <L3Input label={k("desc")} value={c.desc} onChange={(v) => edit((d) => { d.categories[ci].desc = v; })} idp={`c-${c.id}-desc`} />
                  <label className="check"><input type="checkbox" checked={c.hidden} onChange={(e) => edit((d) => { d.categories[ci].hidden = e.target.checked; })} /> {k("hidden")}</label>
                  <ShowOnlyInput value={c.showOnly} lang={lang} k={k} onChange={(v) => edit((d) => { d.categories[ci].showOnly = v; })} idp={`c-${c.id}`} />
                  <GroupChips label={k("attached")} hint={k("groupHint")} ids={c.groupIds} groups={m.groups} lang={lang} k={k}
                    onChange={(ids) => edit((d) => { d.categories[ci].groupIds = ids; })} />
                  <div><button className="link" onClick={() => del(`c${c.id}`, () => edit((d) => { d.categories.splice(ci, 1); }))}>{armed === `c${c.id}` ? k("confirmDel") : k("remove")}</button></div>
                </div>
              )}

              {!c.items.length && <p className="small muted" style={{ margin: 0 }}>{k("empty")}</p>}
              {c.items.map((it, ii) => (
                <div className="aitem" key={it.id}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ flex: 1, minWidth: 140 }}>
                      <b>{pick(it.name, lang) || k("newItem")}</b>{" "}
                      <span className="muted num small">{it.sizes.length ? it.sizes.map((s) => `${pick(s.name, lang)} ${toEuro(s.price)}`).join(" · ") : `€ ${toEuro(it.price)}`}</span>
                    </span>
                    {/* the two switches a restaurant uses every day stay visible */}
                    <button className={`pill ${it.soldOut ? "bad" : "ok"}`} style={{ border: 0 }} onClick={() => edit((d) => { d.categories[ci].items[ii].soldOut = !it.soldOut; })}>
                      {it.soldOut ? k("soldOut") : k("available")}
                    </button>
                    <label className="check" style={{ alignItems: "center" }}><input type="checkbox" checked={it.hidden} onChange={(e) => edit((d) => { d.categories[ci].items[ii].hidden = e.target.checked; })} /> {k("hidden")}</label>
                    <button className="btn sm ghost" onClick={() => edit((d) => move(d.categories[ci].items, ii, -1))} aria-label={k("up")}>↑</button>
                    <button className="btn sm ghost" onClick={() => edit((d) => move(d.categories[ci].items, ii, 1))} aria-label={k("down")}>↓</button>
                    <button className="btn sm ghost" onClick={() => setOpen(open === it.id ? null : it.id)}>{open === it.id ? k("close") : k("edit")}</button>
                  </div>
                  {open === it.id && (
                    <ItemForm it={it} cat={c} groups={m.groups} lang={lang} k={k} armed={armed}
                      onChange={(fn) => edit((d) => fn(d.categories[ci].items[ii]))}
                      onDelete={() => del(`i${it.id}`, () => edit((d) => { d.categories[ci].items.splice(ii, 1); }))} />
                  )}
                </div>
              ))}
              <div><button className="btn sm ghost" onClick={() => { const id = newId(); edit((d) => { d.categories[ci].items.push({ id, name: blank(), desc: blank(), internalName: "", price: 0, hidden: false, soldOut: false, labels: [], hideInstructions: false, showOnly: null, sizes: [], groupIds: [] }); }); setOpen(id); }}>+ {k("addItem")}</button></div>
            </div>
          ))}
          <div><button className="btn sm ghost" onClick={() => { const id = newId(); edit((d) => { d.categories.push({ id, name: blank(), desc: blank(), hidden: false, showOnly: null, groupIds: [], items: [] }); }); setOpen(id); }}>+ {k("addCategory")}</button></div>
        </section>

        <section className="card"><h3>{k("groups")}</h3>
          {m.groups.map((g, gi) => (
            <div className="acat" key={g.id}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <b style={{ flex: 1 }}>{pick(g.name, lang) || k("newGroup")}</b>
                <span className={`pill ${g.required ? "warn" : "neutral"}`}>{g.required ? k("required") : `${g.options.length}`}</span>
                <button className="btn sm ghost" onClick={() => setOpen(open === g.id ? null : g.id)}>{open === g.id ? k("close") : k("edit")}</button>
              </div>
              {open === g.id && (
                <GroupForm g={g} lang={lang} k={k} armed={armed}
                  onChange={(fn) => edit((d) => fn(d.groups[gi]))}
                  onDelete={() => del(`g${g.id}`, () => edit((d) => {
                    d.groups.splice(gi, 1);
                    d.categories.forEach((c) => { c.groupIds = c.groupIds.filter((x) => x !== g.id); c.items.forEach((i) => { i.groupIds = i.groupIds.filter((x) => x !== g.id); }); });
                  }))} />
              )}
            </div>
          ))}
          <div><button className="btn sm ghost" onClick={() => { const id = newId(); edit((d) => { d.groups.push({ id, name: blank(), required: false, min: 0, max: 0, options: [] }); }); setOpen(id); }}>+ {k("addGroup")}</button></div>
        </section>
      </div></div>

      <div className="savebar"><div className="wrap">
        <span className="small" style={{ flex: 1 }}>{status === "error" ? <span className="err">{k("saveErr")}</span> : status === "saved" ? k("saved") : dirty ? <span className="muted">{k("unsaved")}</span> : ""}</span>
        <button className="btn ghost" disabled={!dirty || status === "saving"} onClick={() => { setM(saved); setStatus(""); }}>{k("discard")}</button>
        <button className="btn" disabled={!dirty || status === "saving"} onClick={save}>{k("save")}</button>
      </div></div>
    </>
  );
}

function L3Input({ label, value, onChange, idp }: { label: string; value: L3; onChange: (v: L3) => void; idp: string }) {
  return (
    <div className="tri">
      {(["it", "en", "ar"] as const).map((l) => (
        <label className="f" key={l} htmlFor={`${idp}-${l}`}>{label} ({l.toUpperCase()})
          <input type="text" id={`${idp}-${l}`} dir={l === "ar" ? "rtl" : "ltr"} value={value[l]} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />
        </label>
      ))}
    </div>
  );
}

function PriceInput({ id, cents, onChange, label }: { id: string; cents: number; onChange: (c: number) => void; label: string }) {
  const [text, setText] = useState(toEuro(cents));
  useEffect(() => { if (toCents(text) !== cents) setText(toEuro(cents)); }, [cents]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="f" htmlFor={id}>{label}
      <input type="text" inputMode="decimal" id={id} value={text} dir="ltr" onChange={(e) => { setText(e.target.value); onChange(toCents(e.target.value)); }} onBlur={() => setText(toEuro(cents))} />
    </label>
  );
}

function ShowOnlyInput({ value, onChange, lang, k, idp }: { value: Cat["showOnly"]; onChange: (v: Cat["showOnly"]) => void; lang: Lang; k: (s: string) => string; idp: string }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label className="check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? { days: [1, 2, 3, 4, 5], from: "12:00", to: "15:00" } : null)} /> {k("showOnly")}</label>
      {value && (
        <div className="hrow">
          <div className="dayrow">{[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <button key={d} aria-pressed={value.days.includes(d)} onClick={() => onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d].sort() })}>{DAYS[lang][d]}</button>
          ))}</div>
          <label className="f" htmlFor={`${idp}-so-from`}>{k("from")}<input type="time" id={`${idp}-so-from`} value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} /></label>
          <label className="f" htmlFor={`${idp}-so-to`}>{k("to")}<input type="time" id={`${idp}-so-to`} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} /></label>
        </div>
      )}
    </div>
  );
}

function GroupChips({ label, hint, ids, inherited = [], groups, lang, k, onChange }: { label: string; hint?: string; ids: string[]; inherited?: string[]; groups: Group[]; lang: Lang; k: (s: string) => string; onChange: (ids: string[]) => void }) {
  const name = (id: string) => pick(groups.find((g) => g.id === id)?.name ?? blank(), lang) || "—";
  const free = groups.filter((g) => !ids.includes(g.id) && !inherited.includes(g.id));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span className="small muted">{label}{hint ? ` · ${hint}` : ""}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {inherited.map((id) => <span key={id} className="pill neutral">{name(id)} · {k("fromCategory")}</span>)}
        {ids.map((id) => <span key={id} className="pill ok">{name(id)} <button className="link" style={{ textDecoration: "none" }} aria-label={k("remove")} onClick={() => onChange(ids.filter((x) => x !== id))}>×</button></span>)}
        {free.length > 0 && (
          <select value="" onChange={(e) => e.target.value && onChange([...ids, e.target.value])} aria-label={k("attachGroup")} style={{ width: "auto" }}>
            <option value="">{k("attachGroup")}</option>
            {free.map((g) => <option key={g.id} value={g.id}>{pick(g.name, lang) || "—"}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function ItemForm({ it, cat, groups, lang, k, armed, onChange, onDelete }: {
  it: Item; cat: Cat; groups: Group[]; lang: Lang; k: (s: string) => string; armed: string | null; onChange: (fn: (i: Item) => void) => void; onDelete: () => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <L3Input label={k("name")} value={it.name} onChange={(v) => onChange((i) => { i.name = v; })} idp={`i-${it.id}-name`} />
      <L3Input label={k("desc")} value={it.desc} onChange={(v) => onChange((i) => { i.desc = v; })} idp={`i-${it.id}-desc`} />
      <div className="row2">
        {!it.sizes.length && <PriceInput id={`i-${it.id}-price`} label={k("price")} cents={it.price} onChange={(c) => onChange((i) => { i.price = c; })} />}
        <label className="f" htmlFor={`i-${it.id}-internal`}>{k("internal")}<input type="text" id={`i-${it.id}-internal`} value={it.internalName} onChange={(e) => onChange((i) => { i.internalName = e.target.value; })} /></label>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span className="small muted">{k("sizes")}</span>
        {it.sizes.map((s, si) => (
          <div className="hrow" key={s.id}>
            <span style={{ flex: "1 1 260px" }}><L3Input label={k("name")} value={s.name} onChange={(v) => onChange((i) => { i.sizes[si].name = v; })} idp={`s-${s.id}`} /></span>
            <span style={{ width: 120 }}><PriceInput id={`s-${s.id}-price`} label={k("price")} cents={s.price} onChange={(c) => onChange((i) => { i.sizes[si].price = c; })} /></span>
            <label className="check"><input type="radio" name={`pre-${it.id}`} checked={s.preselected} onChange={() => onChange((i) => { i.sizes.forEach((x, xi) => { x.preselected = xi === si; }); })} /> {k("preselected")}</label>
            <button className="link" onClick={() => onChange((i) => { i.sizes.splice(si, 1); })}>{k("remove")}</button>
          </div>
        ))}
        <div><button className="btn sm ghost" onClick={() => onChange((i) => { i.sizes.push({ id: newId(), name: blank(), price: i.price, preselected: i.sizes.length === 0 }); })}>+ {k("addSize")}</button></div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="small muted" style={{ width: "100%" }}>{k("labels")}</span>
        {LABELS.map((l) => (
          <label key={l} className="check"><input type="checkbox" checked={it.labels.includes(l)} onChange={(e) => onChange((i) => { i.labels = e.target.checked ? [...i.labels, l] : i.labels.filter((x) => x !== l); })} /> {k(l)}</label>
        ))}
      </div>
      <GroupChips label={k("attached")} ids={it.groupIds} inherited={cat.groupIds} groups={groups} lang={lang} k={k} onChange={(ids) => onChange((i) => { i.groupIds = ids; })} />
      <ShowOnlyInput value={it.showOnly} lang={lang} k={k} onChange={(v) => onChange((i) => { i.showOnly = v; })} idp={`i-${it.id}`} />
      <label className="check"><input type="checkbox" checked={it.hideInstructions} onChange={(e) => onChange((i) => { i.hideInstructions = e.target.checked; })} /> {k("hideInstr")}</label>
      <div><button className="link" onClick={onDelete}>{armed === `i${it.id}` ? k("confirmDel") : k("remove")}</button></div>
    </div>
  );
}

function GroupForm({ g, lang, k, armed, onChange, onDelete }: { g: Group; lang: Lang; k: (s: string) => string; armed: string | null; onChange: (fn: (x: Group) => void) => void; onDelete: () => void }) {
  void lang;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <L3Input label={k("name")} value={g.name} onChange={(v) => onChange((x) => { x.name = v; })} idp={`g-${g.id}`} />
      <div className="row2">
        <label className="check"><input type="checkbox" checked={g.required} onChange={(e) => onChange((x) => { x.required = e.target.checked; if (e.target.checked && x.min < 1) x.min = 1; })} /> {k("required")}</label>
        <span />
        <label className="f" htmlFor={`g-${g.id}-min`}>{k("min")}<input type="number" min={0} max={50} id={`g-${g.id}-min`} value={g.min} onChange={(e) => onChange((x) => { x.min = Math.max(0, Math.min(50, Number(e.target.value) || 0)); })} /></label>
        <label className="f" htmlFor={`g-${g.id}-max`}>{k("max")}<input type="number" min={0} max={50} id={`g-${g.id}-max`} value={g.max} onChange={(e) => onChange((x) => { x.max = Math.max(0, Math.min(50, Number(e.target.value) || 0)); })} /></label>
      </div>
      {g.options.map((o, oi) => (
        <div className="hrow" key={o.id}>
          <span style={{ flex: "1 1 260px" }}><L3Input label={k("name")} value={o.name} onChange={(v) => onChange((x) => { x.options[oi].name = v; })} idp={`o-${o.id}`} /></span>
          <span style={{ width: 120 }}><PriceInput id={`o-${o.id}-price`} label={k("price")} cents={o.price} onChange={(c) => onChange((x) => { x.options[oi].price = c; })} /></span>
          <label className="check"><input type="checkbox" checked={o.preselected} onChange={(e) => onChange((x) => { x.options[oi].preselected = e.target.checked; })} /> {k("preselected")}</label>
          <button className={`pill ${o.soldOut ? "bad" : "ok"}`} style={{ border: 0 }} onClick={() => onChange((x) => { x.options[oi].soldOut = !o.soldOut; })}>{o.soldOut ? k("soldOut") : k("available")}</button>
          <button className="link" onClick={() => onChange((x) => { x.options.splice(oi, 1); })}>{k("remove")}</button>
        </div>
      ))}
      <div><button className="btn sm ghost" onClick={() => onChange((x) => { x.options.push({ id: newId(), name: blank(), price: 0, preselected: false, soldOut: false }); })}>+ {k("addOption")}</button></div>
      <div><button className="link" onClick={onDelete}>{armed === `g${g.id}` ? k("confirmDel") : k("remove")}</button></div>
    </div>
  );
}
