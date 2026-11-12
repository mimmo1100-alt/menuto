export const LANGS = ["it", "en", "ar"] as const;
export type Lang = (typeof LANGS)[number];
export type L10n = Partial<Record<Lang, string>> | string | null | undefined;

export function tr(v: L10n | unknown, lang: Lang): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  const o = v as Record<string, string>;
  return o[lang] || o.it || o.en || o.ar || Object.values(o)[0] || "";
}

export function pickLang(list: readonly string[] | string | null | undefined, fallback: Lang = "it"): Lang {
  const arr = typeof list === "string" ? list.split(",").map((s) => s.split(";")[0].trim()) : list ?? [];
  for (const l of arr) {
    const c = l.slice(0, 2).toLowerCase();
    if ((LANGS as readonly string[]).includes(c)) return c as Lang;
  }
  return fallback;
}

export const LOCALE: Record<Lang, string> = { it: "it-IT", en: "en-GB", ar: "ar-EG" };

export function money(cents: number, lang: Lang, currency = "EUR") {
  return new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency }).format((cents || 0) / 100);
}

type Dict = Record<string, string>;
const it: Dict = {
  openNow: "Aperto ora", closedNow: "Ora siamo chiusi, ma puoi ordinare per dopo.", closedNoPre: "Ora siamo chiusi.",
  notAccepting: "Al momento non accettiamo ordini online.", paused: "Ordini in pausa",
  seeMenu: "Vedi il menu e ordina", seeMenuAhead: "Vedi il menu e ordina in anticipo",
  menu: "Menu", info: "Info", cart: "Carrello", add: "Aggiungi al carrello", required: "Obbligatorio", optional: "Facoltativo",
  chooseOne: "Scegline uno", chooseUpTo: "Fino a {n}", chooseExactly: "Scegline {n}", chooseAtLeast: "Almeno {n}",
  soldOut: "Esaurito", size: "Formato", instructions: "Istruzioni speciali (facoltativo)",
  cartEmpty: "Il carrello è vuoto", subtotal: "Subtotale", deliveryFee: "Consegna", discount: "Sconto", tax: "di cui {name}", taxAdded: "{name}", total: "Totale",
  checkout: "Vai al pagamento", contact: "I tuoi dati", orderType: "Tipo di ordine", time: "Orario", payment: "Pagamento", change: "Modifica", save: "Salva",
  firstName: "Nome", lastName: "Cognome", email: "E-mail", phone: "Telefono",
  marketing: "Voglio ricevere offerte da questo ristorante. Posso annullare in qualsiasi momento.",
  PICKUP: "Ritiro", DELIVERY: "Consegna", DINEIN: "Al tavolo",
  street: "Via e numero civico", city: "Città", more: "CAP, scala, citofono, dove parcheggiare", zone: "Zona di consegna",
  today: "Oggi", tomorrow: "Domani", asap: "Prima possibile", day: "Giorno", hour: "Ora", noSlots: "Nessun orario disponibile",
  cash: "Contanti", card_counter: "Carta al ritiro", card_courier: "Carta al fattorino", card_table: "Carta al tavolo",
  comments: "Note per il ristorante (facoltativo)", coupon: "Codice sconto", apply: "Applica", couponBad: "Codice non valido", couponOk: "Codice applicato",
  placePICKUP: "Invia ordine di ritiro", placeDELIVERY: "Invia ordine di consegna", placeDINEIN: "Invia ordine",
  minOrder: "Ordine minimo", fillRequired: "Compila i campi obbligatori", backToMenu: "Torna al menu", sending: "Invio…",
  PENDING: "In attesa di conferma", pendingSub: "Il ristorante sta guardando il tuo ordine. Resta su questa pagina.",
  ACCEPTED: "Ordine confermato", readyAt: "Pronto per le", READY: "Il tuo ordine è pronto", COMPLETED: "Ordine completato",
  REJECTED: "Ordine rifiutato", MISSED: "Il ristorante non ha risposto in tempo", CANCELED: "Ordine annullato",
  tryAgain: "Riprova", orderNo: "Ordine", address: "Indirizzo", hours: "Orari di apertura", payMethods: "Metodi di pagamento",
  deliveryZones: "Zone di consegna", fee: "Costo", min: "Minimo", languages: "Lingua",
  sun: "Dom", mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab",
  rTooBusy: "Siamo troppo pieni", rClosed: "Siamo chiusi", rItem: "Un prodotto non è disponibile", rArea: "Indirizzo fuori zona", rOther: "Altro motivo",
  spicy: "Piccante", vegetarian: "Vegetariano", vegan: "Vegano", halal: "Halal", raw: "Crudo",
  errClosed: "Il ristorante non accetta ordini per questo orario.", errItem: "Un prodotto non è più disponibile. Aggiorna il carrello.",
  findOnMap: "Trova l'indirizzo sulla mappa", pinHint: "Sposta il segnaposto sul punto esatto della consegna.", outsideArea: "Questo indirizzo è fuori dalle nostre zone di consegna.", notFound: "Indirizzo non trovato: sposta il segnaposto a mano.", mapLabel: "Mappa: punto di consegna",
  errMin: "Non hai raggiunto l'ordine minimo per la consegna.", errGeneric: "L'ordine non è stato inviato. Riprova.",
};
const en: Dict = {
  openNow: "Open now", closedNow: "We're closed now, but you can order for later.", closedNoPre: "We're closed now.",
  notAccepting: "We're not taking online orders right now.", paused: "Orders paused",
  seeMenu: "See menu & order", seeMenuAhead: "See menu & order ahead",
  menu: "Menu", info: "Info", cart: "Cart", add: "Add to cart", required: "Required", optional: "Optional",
  chooseOne: "Choose one", chooseUpTo: "Up to {n}", chooseExactly: "Choose {n}", chooseAtLeast: "At least {n}",
  soldOut: "Sold out", size: "Size", instructions: "Special instructions (optional)",
  cartEmpty: "Your cart is empty", subtotal: "Subtotal", deliveryFee: "Delivery", discount: "Discount", tax: "incl. {name}", taxAdded: "{name}", total: "Total",
  checkout: "Go to checkout", contact: "Your details", orderType: "Order type", time: "Time", payment: "Payment", change: "Change", save: "Save",
  firstName: "First name", lastName: "Last name", email: "E-mail", phone: "Phone",
  marketing: "I'd like to receive offers from this restaurant. I can unsubscribe at any time.",
  PICKUP: "Pickup", DELIVERY: "Delivery", DINEIN: "At the table",
  street: "Street and number", city: "Town", more: "Postcode, floor, intercom, where to park", zone: "Delivery area",
  today: "Today", tomorrow: "Tomorrow", asap: "As soon as possible", day: "Day", hour: "Time", noSlots: "No times available",
  cash: "Cash", card_counter: "Card at pickup counter", card_courier: "Card to the delivery person", card_table: "Card at the table",
  comments: "Notes for the restaurant (optional)", coupon: "Coupon code", apply: "Apply", couponBad: "This code isn't valid", couponOk: "Code applied",
  placePICKUP: "Place pickup order", placeDELIVERY: "Place delivery order", placeDINEIN: "Place order",
  minOrder: "Minimum order", fillRequired: "Fill in the required fields", backToMenu: "Back to menu", sending: "Sending…",
  PENDING: "Waiting for confirmation", pendingSub: "The restaurant is looking at your order. Keep this page open.",
  ACCEPTED: "Order confirmed", readyAt: "Ready at", READY: "Your order is ready", COMPLETED: "Order completed",
  REJECTED: "Order declined", MISSED: "The restaurant didn't answer in time", CANCELED: "Order canceled",
  tryAgain: "Try again", orderNo: "Order", address: "Address", hours: "Opening hours", payMethods: "Payment methods",
  deliveryZones: "Delivery areas", fee: "Fee", min: "Minimum", languages: "Language",
  sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",
  rTooBusy: "We're too busy", rClosed: "We're closed", rItem: "An item is unavailable", rArea: "Address outside our area", rOther: "Other reason",
  spicy: "Spicy", vegetarian: "Vegetarian", vegan: "Vegan", halal: "Halal", raw: "Raw",
  errClosed: "The restaurant isn't taking orders for this time.", errItem: "An item is no longer available. Please update your cart.",
  findOnMap: "Find the address on the map", pinHint: "Move the pin to the exact delivery spot.", outsideArea: "This address is outside our delivery areas.", notFound: "Address not found: move the pin by hand.", mapLabel: "Map: delivery spot",
  errMin: "Your order is below the delivery minimum.", errGeneric: "The order wasn't sent. Try again.",
};
const ar: Dict = {
  openNow: "مفتوح الآن", closedNow: "مغلق الآن، لكن يمكنك الطلب لوقت لاحق.", closedNoPre: "مغلق الآن.",
  notAccepting: "لا نستقبل طلبات أونلاين الآن.", paused: "الطلبات متوقفة مؤقتًا",
  seeMenu: "اعرض المنيو واطلب", seeMenuAhead: "اعرض المنيو واطلب مسبقًا",
  menu: "المنيو", info: "معلومات", cart: "السلة", add: "أضف إلى السلة", required: "إجباري", optional: "اختياري",
  chooseOne: "اختر واحدًا", chooseUpTo: "حتى {n}", chooseExactly: "اختر {n}", chooseAtLeast: "على الأقل {n}",
  soldOut: "نفد", size: "الحجم", instructions: "تعليمات خاصة (اختياري)",
  cartEmpty: "السلة فارغة", subtotal: "المجموع الفرعي", deliveryFee: "التوصيل", discount: "الخصم", tax: "شامل {name}", taxAdded: "{name}", total: "الإجمالي",
  checkout: "إتمام الطلب", contact: "بياناتك", orderType: "نوع الطلب", time: "الوقت", payment: "الدفع", change: "تعديل", save: "حفظ",
  firstName: "الاسم الأول", lastName: "اسم العائلة", email: "البريد الإلكتروني", phone: "الهاتف",
  marketing: "أريد استلام عروض من هذا المطعم، ويمكنني إلغاء الاشتراك في أي وقت.",
  PICKUP: "استلام", DELIVERY: "توصيل", DINEIN: "على الطاولة",
  street: "الشارع ورقم المبنى", city: "المدينة", more: "الرمز البريدي، الدور، الجرس، مكان الركن", zone: "منطقة التوصيل",
  today: "اليوم", tomorrow: "غدًا", asap: "في أقرب وقت", day: "اليوم", hour: "الساعة", noSlots: "لا توجد أوقات متاحة",
  cash: "نقدًا", card_counter: "بطاقة عند الاستلام", card_courier: "بطاقة مع مندوب التوصيل", card_table: "بطاقة على الطاولة",
  comments: "ملاحظات للمطعم (اختياري)", coupon: "كود الخصم", apply: "تطبيق", couponBad: "الكود غير صالح", couponOk: "تم تطبيق الكود",
  placePICKUP: "أرسل طلب الاستلام", placeDELIVERY: "أرسل طلب التوصيل", placeDINEIN: "أرسل الطلب",
  minOrder: "الحد الأدنى للطلب", fillRequired: "أكمل الحقول الإجبارية", backToMenu: "العودة للمنيو", sending: "جارٍ الإرسال…",
  PENDING: "في انتظار التأكيد", pendingSub: "المطعم يراجع طلبك الآن. اترك هذه الصفحة مفتوحة.",
  ACCEPTED: "تم تأكيد الطلب", readyAt: "جاهز الساعة", READY: "طلبك جاهز", COMPLETED: "اكتمل الطلب",
  REJECTED: "تم رفض الطلب", MISSED: "المطعم لم يرد في الوقت", CANCELED: "تم إلغاء الطلب",
  tryAgain: "حاول مرة أخرى", orderNo: "طلب", address: "العنوان", hours: "مواعيد العمل", payMethods: "طرق الدفع",
  deliveryZones: "مناطق التوصيل", fee: "الرسوم", min: "الحد الأدنى", languages: "اللغة",
  sun: "أحد", mon: "اثنين", tue: "ثلاثاء", wed: "أربعاء", thu: "خميس", fri: "جمعة", sat: "سبت",
  rTooBusy: "ضغط شغل كبير", rClosed: "المطعم مغلق", rItem: "صنف غير متوفر", rArea: "العنوان خارج منطقة التوصيل", rOther: "سبب آخر",
  spicy: "حار", vegetarian: "نباتي", vegan: "نباتي صرف", halal: "حلال", raw: "نيء",
  errClosed: "المطعم لا يستقبل طلبات لهذا الوقت.", errItem: "صنف لم يعد متوفرًا. حدّث السلة.",
  findOnMap: "حدد العنوان على الخريطة", pinHint: "حرّك الدبوس لمكان التوصيل بالظبط.", outsideArea: "العنوان ده برّه مناطق التوصيل بتاعتنا.", notFound: "مالقيناش العنوان: حرّك الدبوس بإيدك.", mapLabel: "الخريطة: مكان التوصيل",
  errMin: "طلبك أقل من الحد الأدنى للتوصيل.", errGeneric: "لم يُرسل الطلب. حاول مرة أخرى.",
};
export const DICT: Record<Lang, Dict> = { it, en, ar };
export const DAYKEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function t(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let s = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
