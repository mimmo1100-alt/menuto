import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { privacyDoc, termsDoc, type LegalLang } from "@/lib/legal";

/** Server page for /r/[slug]/privacy and /r/[slug]/terms: Italian, or English for other device languages. */
export default async function LegalPage({ slug, kind, lang: asked }: { slug: string; kind: "privacy" | "terms"; lang?: string }) {
  const r = await db.restaurant.findUnique({ where: { slug }, include: { partner: { select: { name: true } } } });
  if (!r) notFound();
  const device = ((await headers()).get("accept-language") ?? "it").slice(0, 2).toLowerCase();
  const lang: LegalLang = asked === "it" || asked === "en" ? asked : device === "it" ? "it" : "en";
  const data = {
    name: r.name, legalName: r.legalName, vatNumber: r.vatNumber, privacyEmail: r.privacyEmail, address: r.address, city: r.city,
    postcode: r.postcode, phone: r.phone, partnerName: r.partner?.name ?? null, hasDelivery: r.services.includes("DELIVERY"),
  };
  const doc = kind === "privacy" ? privacyDoc(data, lang) : termsDoc(data, lang);
  const other = kind === "privacy" ? "terms" : "privacy";
  const L = lang === "it"
    ? { back: "Torna al menu", updated: "Aggiornata il", other: kind === "privacy" ? "Condizioni d'ordine" : "Informativa privacy", switchTo: "English" }
    : { back: "Back to the menu", updated: "Updated", other: kind === "privacy" ? "Order terms" : "Privacy notice", switchTo: "Italiano" };
  return (
    <div className="wrap" lang={lang} dir="ltr">
      <article className="legal">
        <p className="small muted" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a className="link" href={`/r/${slug}`}>← {L.back}</a>
          <a className="link" href={`/r/${slug}/${kind}?lang=${lang === "it" ? "en" : "it"}`}>{L.switchTo}</a>
          <a className="link" href={`/r/${slug}/${other}?lang=${lang}`}>{L.other}</a>
        </p>
        <h1>{doc.title}</h1>
        <p className="muted">{r.name} · {L.updated} {new Date(`${doc.updated}T12:00:00Z`).toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        {doc.sections.map((s) => (
          <section key={s.h}><h2>{s.h}</h2>{s.p.map((p, i) => <p key={i}>{p}</p>)}</section>
        ))}
      </article>
    </div>
  );
}
