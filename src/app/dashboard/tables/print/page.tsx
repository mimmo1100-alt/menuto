import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { dashContext } from "@/lib/dash-page";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

/** Printable A4 sheet of table cards (6 per page). "Save as PDF" in the print window gives the PDF. */
export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string; id?: string }> }) {
  const sp = await searchParams;
  const { current, user } = await dashContext(sp.r);
  if (!current || user.role === "STAFF") return <div className="wrap"><p className="empty">—</p></div>;
  const h = await headers();
  const origin = process.env.PUBLIC_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const tables = await db.table.findMany({
    where: { restaurantId: current.id, active: true, ...(sp.id ? { id: sp.id } : {}) },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  const cards = await Promise.all(tables.map(async (t) => ({
    ...t, url: `${origin}/r/${current.slug}?t=${t.code}`,
    svg: await QRCode.toString(`${origin}/r/${current.slug}?t=${t.code}`, { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
  })));
  return (
    <div className="qrprint">
      <style>{`
        @page { size: A4; margin: 10mm; }
        body { background: #fff; }
        .qrprint { color: #1c2017; }
        .qrbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 16px; font-family: inherit; }
        .qrgrid { display: grid; grid-template-columns: repeat(2, 90mm); gap: 6mm; justify-content: center; padding: 0 0 16px; }
        .qrcard { width: 90mm; height: 85mm; border: 1px dashed #b9bcb0; border-radius: 4mm; padding: 6mm; box-sizing: border-box;
          display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; break-inside: avoid; background: #fff; }
        .qrcard .rn { font-size: 11pt; color: #5d6455; }
        .qrcard .tn { font-size: 22pt; font-weight: 800; line-height: 1; }
        .qrcard .qr { width: 42mm; height: 42mm; }
        .qrcard .qr svg { width: 100%; height: 100%; display: block; }
        .qrcard .cta { font-size: 10pt; line-height: 1.35; }
        .qrcard .cta b { font-size: 12pt; }
        @media print { .qrbar { display: none; } .qrgrid { padding: 0; } .dash-top { display: none; } }
      `}</style>
      <div className="qrbar">
        <b>{current.name}</b>
        <span className="small muted">{cards.length} QR</span>
        <span style={{ flex: 1 }} />
        <PrintButton />
      </div>
      {cards.length === 0 ? <p className="empty" style={{ margin: 16 }}>Nessun tavolo attivo. / No active tables.</p> : (
        <div className="qrgrid">
          {cards.map((c) => (
            <div className="qrcard" key={c.id}>
              <span className="rn">{current.name}</span>
              <span className="tn">{/^\d+$/.test(c.name) ? `Tavolo ${c.name}` : c.name}</span>
              <span className="qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
              <span className="cta"><b>Inquadra e ordina dal tavolo</b><br />Scan to order from your table<br /><span dir="rtl">امسح الرمز واطلب من طاولتك</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
