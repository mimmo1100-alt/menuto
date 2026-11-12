/**
 * Privacy notice (GDPR art. 13) and order terms for one restaurant, in Italian and English.
 * The restaurant is the data controller; the partner that runs Menuto for it is the processor.
 * This is a template written to the facts of how Menuto works; it should be reviewed by a lawyer before go-live.
 */
export type LegalDoc = { title: string; updated: string; sections: { h: string; p: string[] }[] };
export type LegalLang = "it" | "en";
export type LegalRestaurant = {
  name: string; legalName: string | null; vatNumber: string | null; privacyEmail: string | null;
  address: string; city: string; postcode: string | null; phone: string; partnerName: string | null; hasDelivery: boolean;
};

const UPDATED = "2026-11-12";

function who(r: LegalRestaurant, lang: LegalLang) {
  const todo = lang === "it" ? "[da completare]" : "[to be completed]";
  const company = r.legalName || `${r.name} ${todo}`;
  const vat = r.vatNumber ? `, ${lang === "it" ? "P.IVA" : "VAT no."} ${r.vatNumber}` : `, ${lang === "it" ? "P.IVA" : "VAT no."} ${todo}`;
  const addr = `${r.address}, ${r.postcode ? r.postcode + " " : ""}${r.city}`;
  const contact = [r.privacyEmail, r.phone].filter(Boolean).join(" · ");
  return { company, vat, addr, contact };
}

export function privacyDoc(r: LegalRestaurant, lang: LegalLang): LegalDoc {
  const w = who(r, lang);
  const partner = r.partnerName || "Menuto";
  if (lang === "it") return {
    title: "Informativa privacy", updated: UPDATED,
    sections: [
      { h: "Chi tratta i tuoi dati", p: [
        `Titolare del trattamento è ${w.company}${w.vat}, ${w.addr} (“${r.name}”). Contatti: ${w.contact}.`,
        `La pagina d'ordine funziona con Menuto, gestito per conto del ristorante da ${partner}, che tratta i dati come responsabile del trattamento (art. 28 GDPR) e solo per far funzionare il servizio.`,
      ] },
      { h: "Quali dati raccogliamo", p: [
        `Quando ordini: nome, cognome, email e telefono; ${r.hasDelivery ? "per la consegna l'indirizzo e il punto sulla mappa; " : ""}cosa ordini, note, metodo di pagamento, data e ora. Al tavolo basta il nome.`,
        "Per la sicurezza del servizio: indirizzo IP e dati tecnici della richiesta, usati per bloccare abusi (per esempio ordini falsi ripetuti).",
        "Sul tuo dispositivo (non sui nostri server) restano il carrello, la lingua scelta e i tuoi dati di contatto, per non doverli riscrivere al prossimo ordine. Non usiamo cookie di profilazione né strumenti di analisi o pubblicità.",
      ] },
      { h: "Perché e su quale base", p: [
        "Per preparare e consegnarti l'ordine e tenerti aggiornato sul suo stato (esecuzione del contratto, art. 6.1.b GDPR).",
        "Per adempiere agli obblighi fiscali e contabili (obbligo di legge, art. 6.1.c).",
        "Per proteggere il servizio da abusi (legittimo interesse, art. 6.1.f).",
        "Per mandarti offerte del ristorante, solo se spunti la casella apposita (consenso, art. 6.1.a). Puoi ritirarlo quando vuoi scrivendo al ristorante.",
      ] },
      { h: "A chi arrivano i dati", p: [
        `Al ristorante e al suo personale, e a ${partner} come responsabile.`,
        "Ai fornitori tecnici che ospitano il servizio, come sub-responsabili: hosting del sito (Vercel), database, invio delle email (Resend). Alcuni hanno sede negli Stati Uniti: il trasferimento avviene con il Data Privacy Framework UE-USA o con le clausole contrattuali standard della Commissione europea.",
        ...(r.hasDelivery ? ["La mappa per scegliere il punto di consegna è caricata da OpenStreetMap (OpenStreetMap Foundation, Regno Unito, paese con decisione di adeguatezza): il tuo browser invia loro l'indirizzo IP e l'indirizzo che cerchi."] : []),
        "I dati non vengono venduti né usati per pubblicità di terzi.",
      ] },
      { h: "Per quanto tempo", p: [
        "I dati dell'ordine per il tempo necessario a gestirlo e poi per quanto richiesto dalla legge fiscale e contabile (fino a 10 anni). Il consenso alle offerte vale finché non lo ritiri. I dati tecnici di sicurezza vengono cancellati entro pochi giorni.",
      ] },
      { h: "I tuoi diritti", p: [
        `Puoi chiedere di accedere ai tuoi dati, correggerli, cancellarli, limitarne l'uso, riceverli in un formato leggibile, opporti al trattamento basato sul legittimo interesse e ritirare il consenso, scrivendo a ${w.contact}.`,
        "Puoi anche fare reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
        "Senza i dati richiesti per l'ordine non possiamo prenderlo; il consenso alle offerte è facoltativo.",
      ] },
    ],
  };
  return {
    title: "Privacy notice", updated: UPDATED,
    sections: [
      { h: "Who handles your data", p: [
        `The data controller is ${w.company}${w.vat}, ${w.addr} (“${r.name}”). Contact: ${w.contact}.`,
        `The ordering page runs on Menuto, operated for the restaurant by ${partner}, which processes data as a processor (art. 28 GDPR) and only to run the service.`,
      ] },
      { h: "What we collect", p: [
        `When you order: first and last name, email and phone; ${r.hasDelivery ? "for delivery, the address and the point on the map; " : ""}what you order, notes, payment method, date and time. At a table only your name is needed.`,
        "For the security of the service: IP address and technical request data, used to block abuse (for example repeated fake orders).",
        "On your device (not on our servers) we keep your cart, chosen language and contact details, so you don't have to type them again next time. We use no profiling cookies and no analytics or advertising tools.",
      ] },
      { h: "Why, and on what basis", p: [
        "To prepare and deliver your order and keep you updated on it (performance of a contract, art. 6.1.b GDPR).",
        "To meet tax and accounting duties (legal obligation, art. 6.1.c).",
        "To protect the service from abuse (legitimate interest, art. 6.1.f).",
        "To send you the restaurant's offers, only if you tick the box (consent, art. 6.1.a). You can withdraw it at any time by writing to the restaurant.",
      ] },
      { h: "Who receives the data", p: [
        `The restaurant and its staff, and ${partner} as processor.`,
        "The technical providers that host the service, as sub-processors: website hosting (Vercel), database, email sending (Resend). Some are based in the United States: transfers rely on the EU-US Data Privacy Framework or the European Commission's standard contractual clauses.",
        ...(r.hasDelivery ? ["The map for choosing the delivery point is loaded from OpenStreetMap (OpenStreetMap Foundation, United Kingdom, a country with an adequacy decision): your browser sends them your IP address and the address you search for."] : []),
        "Data is never sold or used for third-party advertising.",
      ] },
      { h: "How long", p: [
        "Order data for as long as needed to handle the order and then as long as tax and accounting law requires (up to 10 years). Consent to offers lasts until you withdraw it. Technical security data is deleted within a few days.",
      ] },
      { h: "Your rights", p: [
        `You can ask to access, correct or delete your data, restrict its use, receive it in a readable format, object to processing based on legitimate interest and withdraw consent, by writing to ${w.contact}.`,
        "You can also complain to the Italian data protection authority, Garante per la protezione dei dati personali (www.garanteprivacy.it).",
        "Without the data needed for the order we can't take it; consent to offers is optional.",
      ] },
    ],
  };
}

export function termsDoc(r: LegalRestaurant, lang: LegalLang): LegalDoc {
  const w = who(r, lang);
  if (lang === "it") return {
    title: "Condizioni d'ordine", updated: UPDATED,
    sections: [
      { h: "Con chi fai l'ordine", p: [`Il contratto è tra te e ${w.company}${w.vat}, ${w.addr}. Menuto è solo lo strumento tecnico che trasmette l'ordine al ristorante.`] },
      { h: "Quando l'ordine è confermato", p: [
        "Inviare l'ordine è una proposta: diventa vincolante quando il ristorante lo accetta. Vedi lo stato sulla pagina dell'ordine e, se hai lasciato l'email, ricevi una conferma.",
        "Il ristorante può rifiutare l'ordine (per esempio se un prodotto è finito o è troppo pieno). Se non risponde entro pochi minuti, l'ordine decade e non devi nulla.",
      ] },
      { h: "Prezzi e pagamento", p: [
        "I prezzi sono in euro e comprendono l'IVA, salvo diversa indicazione nel carrello. Il totale, comprese eventuali spese di consegna e sconti, è quello mostrato prima dell'invio.",
        "Il pagamento avviene con il metodo che scegli (contanti o carta) al ritiro, alla consegna o al tavolo.",
      ] },
      { h: "Orari e consegna", p: ["Gli orari indicati sono stime del ristorante. La consegna avviene solo nelle zone indicate, con l'ordine minimo e il costo della zona."] },
      { h: "Allergeni", p: ["Se hai allergie o intolleranze, chiedi al ristorante prima di ordinare: le informazioni sugli allergeni sono disponibili presso il ristorante (Reg. UE 1169/2011)."] },
      { h: "Annullare un ordine", p: [
        "Per cambiare o annullare un ordine già inviato, chiama subito il ristorante. Per i prodotti alimentari deperibili e preparati su richiesta non si applica il diritto di recesso (art. 59 Codice del Consumo).",
      ] },
      { h: "Problemi e contatti", p: [`Per qualsiasi problema con l'ordine contatta il ristorante: ${w.contact}. Restano salvi i tuoi diritti di consumatore previsti dalla legge italiana.`] },
    ],
  };
  return {
    title: "Order terms", updated: UPDATED,
    sections: [
      { h: "Who you order from", p: [`The contract is between you and ${w.company}${w.vat}, ${w.addr}. Menuto is only the technical tool that passes your order to the restaurant.`] },
      { h: "When the order is confirmed", p: [
        "Sending the order is an offer: it becomes binding when the restaurant accepts it. You see the status on the order page and, if you left an email, you get a confirmation.",
        "The restaurant may decline the order (for example if an item has run out or it's too busy). If it doesn't answer within a few minutes, the order lapses and you owe nothing.",
      ] },
      { h: "Prices and payment", p: [
        "Prices are in euro and include VAT unless the cart says otherwise. The total, including any delivery fee and discounts, is the one shown before sending.",
        "You pay with the method you choose (cash or card) at pickup, on delivery or at the table.",
      ] },
      { h: "Times and delivery", p: ["Times shown are the restaurant's estimates. Delivery is only to the areas shown, with that area's minimum order and fee."] },
      { h: "Allergens", p: ["If you have allergies or intolerances, ask the restaurant before ordering: allergen information is available from the restaurant (EU Regulation 1169/2011)."] },
      { h: "Cancelling an order", p: [
        "To change or cancel an order you already sent, call the restaurant straight away. The right of withdrawal does not apply to perishable food made to order (art. 59 Italian Consumer Code).",
      ] },
      { h: "Problems and contact", p: [`For any problem with your order contact the restaurant: ${w.contact}. Your consumer rights under Italian law are not affected.`] },
    ],
  };
}
