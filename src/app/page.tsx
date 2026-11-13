import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pickLang } from "@/lib/i18n";
import "./r/order.css";
import "./dashboard/dashboard.css";

export const dynamic = "force-dynamic";

const T = {
  it: { order: "Ordina online", staff: "Area ristoranti", login: "Accedi", hint: "Scegli il ristorante per vedere il menu e ordinare." },
  en: { order: "Order online", staff: "Restaurant area", login: "Sign in", hint: "Pick the restaurant to see the menu and order." },
  ar: { order: "اطلب أونلاين", staff: "منطقة المطاعم", login: "تسجيل الدخول", hint: "اختر المطعم لترى القائمة وتطلب." },
};

/** Start page: before the first account it sends to /setup; afterwards it links to each restaurant's ordering page and to the login. */
export default async function Home() {
  if ((await db.user.count()) === 0) redirect("/setup");
  const restaurants = await db.restaurant.findMany({ where: { acceptingOrders: true }, orderBy: [{ isDemo: "asc" }, { name: "asc" }], select: { slug: true, name: true, city: true } });
  const lang = pickLang((await headers()).get("accept-language"), "it");
  const k = T[lang];
  return (
    <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <main className="home">
        <h1>Menuto</h1>
        <section className="card home-card">
          <h2>{k.order}</h2>
          <p className="small muted" style={{ margin: 0 }}>{k.hint}</p>
          <div className="home-list">
            {restaurants.map((r) => (
              <a key={r.slug} className="btn" href={`/r/${r.slug}`}>{r.name}<span className="home-city">{r.city}</span></a>
            ))}
          </div>
        </section>
        <section className="card home-card">
          <h2>{k.staff}</h2>
          <div><a className="btn ghost" href="/login">{k.login}</a></div>
        </section>
      </main>
    </div>
  );
}
