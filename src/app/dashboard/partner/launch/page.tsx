import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pickLang, type Lang } from "@/lib/i18n";
import { readiness, systemStatus } from "@/lib/launch";
import { requirePartner } from "@/lib/partner";
import NavBar from "./NavBar";

export const dynamic = "force-dynamic";

const T: Record<Lang, Record<string, string>> = {
  it: {
    title: "Pronti per partire?", intro: "Per ogni ristorante: cosa manca prima di passare da GloriaFood a Menuto. Clicca su «Sistema» per andare dove si sistema.",
    system: "Stato del sistema", fixIt: "Sistema", ready: "Pronto", missingN: "{n} da fare", optional: "facoltativo", back: "← Pannello partner",
    menu: "Menu con almeno un prodotto ({d})", hours: "Orari di apertura", contacts: "Telefono e indirizzo veri", location: "Posizione del ristorante sulla mappa",
    payments: "Metodi di pagamento per ogni servizio", zones: "Zone di consegna", notify: "Email che ricevono gli ordini", legal: "Ragione sociale e Partita IVA (privacy e condizioni)",
    owner: "Accesso del titolare", testOrder: "Ordine di prova ricevuto nell'app ordini", printed: "Stampa provata sulla stampante", tables: "Tavoli con codice QR", accepting: "Ordini online accesi",
    database: "Database collegato ({d} aggiornamenti)", address: "Indirizzo pubblico del sito: {d}", addressWarn: "Imposta PUBLIC_URL in Vercel con l'indirizzo definitivo, così link nelle email e QR sono giusti.",
    email: "Invio email (Resend)", emailOff: "Le email non partono: aggiungi RESEND_API_KEY ed EMAIL_FROM in Vercel. Finora {d} email solo registrate.", emailOn: "Ultimi 7 giorni: {d} inviate/fallite",
    emailFailures: "Email fallite negli ultimi 7 giorni: {d}", cron: "Rapporto del mattino", cronWarn: "Consigliato: imposta CRON_SECRET in Vercel.", cronLast: "Ultimo invio: {d}", cronNever: "Nessun invio ancora",
    demo: "Demo",
  },
  en: {
    title: "Ready to go live?", intro: "For each restaurant: what's missing before moving from GloriaFood to Menuto. Click “Fix” to go where it's fixed.",
    system: "System status", fixIt: "Fix", ready: "Ready", missingN: "{n} to do", optional: "optional", back: "← Partner panel",
    menu: "Menu with at least one item ({d})", hours: "Opening hours", contacts: "Real phone and address", location: "Restaurant location on the map",
    payments: "Payment methods for every service", zones: "Delivery areas", notify: "Emails that receive orders", legal: "Company name and VAT number (privacy and terms)",
    owner: "Owner login", testOrder: "Test order received in the orders app", printed: "Printing tried on the printer", tables: "Tables with QR codes", accepting: "Online ordering on",
    database: "Database connected ({d} updates)", address: "Public address of the site: {d}", addressWarn: "Set PUBLIC_URL in Vercel to the final address, so email links and QR codes are right.",
    email: "Email sending (Resend)", emailOff: "Emails aren't sent: add RESEND_API_KEY and EMAIL_FROM in Vercel. So far {d} emails only logged.", emailOn: "Last 7 days: {d} sent/failed",
    emailFailures: "Failed emails in the last 7 days: {d}", cron: "Morning report", cronWarn: "Recommended: set CRON_SECRET in Vercel.", cronLast: "Last sent: {d}", cronNever: "Not sent yet",
    demo: "Demo",
  },
  ar: {
    title: "جاهزين نبدأ؟", intro: "لكل مطعم: إيه اللي ناقص قبل ما ينقل من GloriaFood لـ Menuto. دوس «صلّح» عشان تروح المكان اللي بيتظبط فيه.",
    system: "حالة السيستم", fixIt: "صلّح", ready: "جاهز", missingN: "ناقص {n}", optional: "اختياري", back: "← لوحة الشريك",
    menu: "منيو فيه صنف واحد على الأقل ({d})", hours: "مواعيد الفتح", contacts: "تليفون وعنوان حقيقيين", location: "مكان المطعم على الخريطة",
    payments: "طرق دفع لكل خدمة", zones: "مناطق التوصيل", notify: "إيميلات بتستلم الطلبات", legal: "اسم الشركة والرقم الضريبي (الخصوصية والشروط)",
    owner: "حساب لصاحب المطعم", testOrder: "طلب تجريبي وصل لتطبيق الطلبات", printed: "الطباعة اتجربت على الطابعة", tables: "ترابيزات بأكواد QR", accepting: "الطلبات أونلاين شغالة",
    database: "قاعدة البيانات متوصلة ({d} تحديث)", address: "عنوان الموقع: {d}", addressWarn: "حط PUBLIC_URL في Vercel بالعنوان النهائي، عشان اللينكات في الإيميلات والـ QR تبقى صح.",
    email: "إرسال الإيميلات (Resend)", emailOff: "الإيميلات مش بتتبعت: ضيف RESEND_API_KEY وEMAIL_FROM في Vercel. لحد دلوقتي {d} إيميل اتسجلوا بس.", emailOn: "آخر 7 أيام: {d} اتبعتوا/فشلوا",
    emailFailures: "إيميلات فشلت في آخر 7 أيام: {d}", cron: "تقرير الصبح", cronWarn: "يُفضّل: حط CRON_SECRET في Vercel.", cronLast: "آخر إرسال: {d}", cronNever: "لسه ماتبعتش",
    demo: "تجريبي",
  },
};

export default async function Page() {
  const u = await requirePartner();
  if (!u) redirect("/dashboard/orders");
  const lang = pickLang((await headers()).get("accept-language"), "it");
  const k = (key: string, v: Record<string, string | number> = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), T[lang][key] ?? key);
  const restaurants = await db.restaurant.findMany({ where: { partnerId: u.partnerId! }, orderBy: [{ isDemo: "asc" }, { name: "asc" }], select: { id: true, name: true, isDemo: true, city: true } });
  const [sys, lists] = await Promise.all([systemStatus(), Promise.all(restaurants.map((r) => readiness(r.id)))]);
  const sysText = (s: (typeof sys)[number]) => {
    if (s.key === "database") return k("database", { d: s.detail ?? "" });
    if (s.key === "address") return k("address", { d: s.detail ?? "" });
    if (s.key === "email") return `${k("email")} · ${s.ok ? k("emailOn", { d: s.detail ?? "" }) : k("emailOff", { d: s.detail ?? "0" })}`;
    if (s.key === "emailFailures") return k("emailFailures", { d: s.detail ?? "0" });
    return `${k("cron")} · ${s.detail ? k("cronLast", { d: new Date(s.detail).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) }) : k("cronNever")}`;
  };
  const hint = (s: (typeof sys)[number]) => (s.key === "address" && s.warn ? k("addressWarn") : s.key === "cron" && s.warn ? k("cronWarn") : "");

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <NavBar lang={lang} />
      <div className="wrap"><div className="adm">
        <a className="link small" href="/dashboard/partner">{k("back")}</a>
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>
        <p className="muted" style={{ margin: 0 }}>{k("intro")}</p>

        <section className="card" data-testid="system">
          <h3>{k("system")}</h3>
          <ul className="checks">
            {sys.map((s) => (
              <li key={s.key} className={s.ok ? (s.warn ? "warn" : "ok") : "bad"}>
                <span className="mark" aria-hidden="true">{s.ok ? (s.warn ? "!" : "✓") : "✗"}</span>
                <span>{sysText(s)}{hint(s) && <span className="small muted" style={{ display: "block" }}>{hint(s)}</span>}</span>
              </li>
            ))}
          </ul>
        </section>

        {restaurants.map((r, i) => {
          const checks = lists[i];
          const todo = checks.filter((c) => !c.ok && !c.optional).length;
          return (
            <section className="card" key={r.id} data-testid={`launch-${r.id}`}>
              <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {r.name} {r.isDemo && <span className="pill neutral">{k("demo")}</span>}
                <span className={`pill ${todo ? "bad" : "ok"}`} style={{ marginInlineStart: "auto" }}>{todo ? k("missingN", { n: todo }) : k("ready")}</span>
              </h3>
              <ul className="checks">
                {checks.map((c) => (
                  <li key={c.key} className={c.ok ? "ok" : c.optional ? "warn" : "bad"}>
                    <span className="mark" aria-hidden="true">{c.ok ? "✓" : c.optional ? "–" : "✗"}</span>
                    <span>{k(c.key, { d: c.detail ?? "" })}{c.optional && !c.ok ? ` (${k("optional")})` : ""}</span>
                    {!c.ok && <a className="link small" href={c.fix}>{k("fixIt")}</a>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div></div>
    </div>
  );
}
