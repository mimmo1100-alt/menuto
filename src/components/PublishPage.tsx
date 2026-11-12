"use client";

import { useEffect, useState } from "react";
import { pickLang, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type R = { id: string; name: string; slug: string; currency: string };
const D: Record<Lang, Record<string, string>> = {
  it: { title: "Pubblica", link: "Link per ordinare", linkHint: "Mettilo su Instagram, Facebook, Google Business, WhatsApp e ovunque i clienti ti trovano.",
    button: "Pulsante per il tuo sito", buttonHint: "Incolla questo codice nella pagina del tuo sito dove vuoi il pulsante. Funziona con WordPress, Wix e qualsiasi sito.",
    qr: "Codice QR", qrHint: "Stampalo su volantini, vetrina e scontrini: inquadrandolo si apre il menu.", copy: "Copia", copied: "Copiato", preview: "Anteprima del pulsante", download: "Scarica il QR (SVG)" },
  en: { title: "Publish", link: "Ordering link", linkHint: "Put it on Instagram, Facebook, Google Business, WhatsApp and anywhere customers find you.",
    button: "Button for your website", buttonHint: "Paste this code into your website where you want the button. Works with WordPress, Wix and any site.",
    qr: "QR code", qrHint: "Print it on flyers, the window and receipts: scanning it opens the menu.", copy: "Copy", copied: "Copied", preview: "Button preview", download: "Download the QR (SVG)" },
  ar: { title: "النشر", link: "لينك الطلب", linkHint: "حطه على إنستجرام وفيسبوك وجوجل وواتساب وأي مكان العملاء بيلاقوك فيه.",
    button: "زرار لموقعك", buttonHint: "الصق الكود ده في صفحة موقعك مكان ما عاوز الزرار يظهر. بيشتغل مع WordPress وWix وأي موقع.",
    qr: "كود QR", qrHint: "اطبعه على الفلايرز والفاترينة والفواتير: لما حد يصوّره يفتح المنيو.", copy: "نسخ", copied: "اتنسخ", preview: "شكل الزرار", download: "نزّل الـ QR (SVG)" },
};

export default function PublishPage({ restaurant, restaurants, origin, link, qrSvg, isPartner = false }: { restaurant: R; restaurants: R[]; origin: string; link: string; qrSvg: string; isPartner?: boolean }) {
  const [lang, setLang] = useState<Lang>("it");
  const [copied, setCopied] = useState("");
  const k = (s: string) => D[lang][s] ?? s;
  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  useEffect(() => {
    if (document.querySelector('script[data-menuto-preview]')) return;
    const s = document.createElement("script"); s.src = "/embed.js"; s.defer = true; s.dataset.menutoPreview = "1"; document.body.appendChild(s);
  }, []);
  const code = `<span class="menuto-button" data-menuto="${restaurant.slug}"></span>\n<script src="${origin}/embed.js" defer></script>`;
  async function copy(id: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); }
    catch { const el = document.getElementById(id) as HTMLTextAreaElement | HTMLInputElement | null; el?.select(); }
  }
  const qrUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
  return (
    <>
      <DashNav lang={lang} current="publish" restaurant={restaurant} restaurants={restaurants} isPartner={isPartner} />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>
        <section className="card"><h3>{k("link")}</h3>
          <p className="small muted" style={{ margin: 0 }}>{k("linkHint")}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" id="pub-link" readOnly value={link} dir="ltr" onFocus={(e) => e.target.select()} />
            <button className="btn sm" onClick={() => copy("pub-link", link)}>{copied === "pub-link" ? k("copied") : k("copy")}</button>
          </div>
        </section>
        <section className="card"><h3>{k("button")}</h3>
          <p className="small muted" style={{ margin: 0 }}>{k("buttonHint")}</p>
          <textarea id="pub-code" readOnly value={code} dir="ltr" rows={3} style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }} onFocus={(e) => e.target.select()} />
          <div><button className="btn sm" onClick={() => copy("pub-code", code)}>{copied === "pub-code" ? k("copied") : k("copy")}</button></div>
          <span className="small muted">{k("preview")}</span>
          <div><span className="menuto-button" data-menuto={restaurant.slug} /></div>
        </section>
        <section className="card"><h3>{k("qr")}</h3>
          <p className="small muted" style={{ margin: 0 }}>{k("qrHint")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={link} width={220} height={220} style={{ background: "#fff", borderRadius: 8, padding: 8 }} />
          <div><a className="btn sm ghost" href={qrUrl} download={`menuto-${restaurant.slug}-qr.svg`}>{k("download")}</a></div>
        </section>
      </div></div>
    </>
  );
}
