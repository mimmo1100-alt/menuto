# تقرير لوحة تحكم GloriaFood (حساب شريك + لوحة مطعم)

Nov 12, 2026 · @SENZACODE

## ملاحظات عامة

- **الحساب:** ده حساب شريك (PartnerNet / Reseller) تحته 6 مطاعم. لفّيت على لوحة الشريك كلها، وبعدها دخلت لوحة مطعم واحد عليه علامة DEMO (GUSTO GIUSTO) ولفّيت على كل أقسامه.
- **لغة الواجهة:** إيطالي، وفي حتت إنجليزي. أي اسم بين قوسين في التقرير هو الاسم الأصلي في الشاشة.
- **التغييرات:** ماغيّرتش أي حاجة. أي نافذة تعديل فتحتها قفلتها بـ Cancella/Annulla أو بسهم الرجوع. اترفض مني محاولة واحدة إني أفتح زرار Pause services، فماعرفش هو بيعرض إيه جواه.
- **بيانات العملاء:** التقرير مافيهوش أي اسم أو تليفون أو إيميل أو عنوان لعميل، ولا التوكنات الخاصة بالتكاملات.
- **الطابع الغالب على اللوحة:** إعدادات المطعم معمولة كـ **ويزارد (Wizard)**. كل شاشة فيها كارت واحد وزرار برتقالي "Avanti" (التالي) بيحفظ وينقلك للشاشة اللي بعدها. والقايمة الجانبية بتحط ✓ خضرا جنب الخطوة اللي خلصت.
- **ملاحظة مهمة للسوق:** في بانر ثابت فوق في كل الشاشات بيقول إن الخدمة هتتقفل في **30 أبريل 2027**، وإن Oracle بتوجّه العملاء لـ FoodAmigos.

## الجزء الأول: لوحة الشريك (PartnerNet)

**القايمة الجانبية:** Overview · Performance · Restaurants · Sales & Marketing · Branding · Leads · Knowledge base. وقايمة الحساب فوق على اليمين فيها: My profile · Billing Settings · Paid Services · Billing History · Terms · Privacy · Sign out.

### 1. Overview

- شاشة تسويقية فيها جملة بمعنى "تقدر تكسب فلوس من برنامج الشركاء"، وزرار "Show me how".

### 2. Performance (التقارير المالية للشريك)

**Restaurants' Sales**

- جدول لكل المطاعم فيه الأعمدة دي:
  - الطلبات المقبولة (عدد ومبلغ)
  - الطلبات الفايتة (Missed)
  - العملاء (جداد / راجعين)
- بحث بالاسم.
- فلتر فترة: Yesterday · Last 7 / 14 / 28 days · Last 3 / 12 months.
- زرار أعمدة (أيقونة) تختار منه الأعمدة اللي تظهر: Restaurant, Creation date, Accepted orders, Missed orders, Table reservations, Clients new/returning, Avg order value, Connectivity, Country, City, Order Taking App version.
- زرار Export.

**Autopilot Sales**

- أعمدة: Restaurant, Restaurant ID, Model, Generated orders, Generated sales, List price, Your fee.
- فلتر "Past 30 days".
- Export، ولينك "Go to orders export".

**Reservation deposits**

- أعمدة: Restaurant, Model, Reservations with deposit, Number of guests, You pay.

**Discounts (Resell Mode)**

- بيعرض الخصم اللي المنصة بتديه للشريك على كل دفعة من مطعم.
- أعمدة: Date, Name, Description, No. paying restaurants, Amount, Applied discount.

**Commissions**

- بيعرض العمولة اللي الشريك بياخدها من كل دفعة.
- أعمدة: Date, Name, Description, No. paying restaurants, Cashed amount, Earned commission.

### 3. Restaurants

**Management**

- جدول المطاعم: الاسم والعنوان، الموديل (Affiliate)، الخدمات المدفوعة (أيقونات)، تاريخ الإنشاء.
- فلتر بالاسم والموديل والخدمات المدفوعة.
- **SHOW MORE** بيفتح قايمة الخدمات المدفوعة المتاحة للمطعم، وهي 6:
  - Advanced promotions
  - Sales Optimized Website
  - Branded Mobile App
  - Online Payments
  - Autopilot Selling
  - Reservation deposit
- الضغط على اسم المطعم بيفتح لوحة المطعم نفسه في تابة جديدة. يعني الشريك بيقدر يدخل كمدير على أي مطعم تحته.
- زرار **Add Restaurant**.
- في علامة **DEMO** بتظهر جنب المطعم التجريبي.

**Orders List**

- كل الطلبات في كل المطاعم.
- أعمدة: Name, Status, Type. وتقدر تضيف: Company Name, Order ID, Placed at, Total, Payment Method, Fulfilment time.
- فلتر الحالة: Missed / Accepted / Rejected / Pending / Canceled.
- فلتر النوع: Delivery / Pickup / Order ahead / Table reservation / On premise.
- Export، و"Show orders older than 30 days"، وترقيم صفحات (10 في الصفحة).

**Pending Requests**

- طلبات الدفع المعلّقة. كانت فاضية.

### 4. Sales & Marketing

- مواد تسويقية للشريك: Preamble · Way to go · Partner Resources · Restaurant Resources. محتواها ماظهرليش كنص في الصفحة.

### 5. Branding (White-label)

**Imprint**

- خانة نص واحدة.
- النص ده بيظهر في شريط تحت صفحة طلب العميل بصيغة "Supported by …".
- زرار Update.

**Logo**

- رفع لوجو للشريك: PNG شفاف، أقل مقاس 100×100.
- بيظهر في ثلاث أماكن: لوحة الإدارة، وإيميلات المطعم، وتطبيق استلام الطلبات.
- في اختيار "Switch back to the generic logo".

**Generic domain**

- المطاعم بتدخل من www.restaurantlogin.com بشكل الشريك.

**Custom domain**

- أربع تابات: Website branding · Email branding · Knowledge base · Configuration.
- أي حد يسجّل من الدومين ده بيتربط تلقائياً بحساب الشريك.

### 6. Leads

- خريطة فيها مكان الشريك والمطاعم المستقلة حواليه.
- الشريك بيعرض بيانات التواصل بتاعته للمطاعم القريبة.
- لينك "View how restaurants see this".

### 7. حساب الشريك ← Paid Services

- كروت فوق:
  - Next invoice (تاريخ الفاتورة الجاية)
  - Pre-paid services
  - Post-paid services (حتى امبارح)
  - Total
  - العملة USD
- جدول تحتها: Type, Beneficiary, List price / fees, Your fee. كان فاضي ("No services").

## الجزء الثاني: لوحة المطعم

**شريط الأيقونات على الشمال** (5 أيقونات):

1. ⚙️ Impostazioni (الإعدادات)
2. 🎯 Strumenti di marketing (أدوات التسويق)
3. 📈 Reports (التقارير)
4. ⚙️ Ordinazione in linea (الطلب أونلاين / التكاملات)
5. ••• Altro (حاجات تانية)

### القسم 1: بيانات المطعم الأساسية (Anagrafica)

**1.1 Nome e Indirizzo (الاسم والعنوان)**

- **الخلفية:** خريطة جوجل وفوقها كارت.
- **الحقول:**

| الحقل | النوع | ملاحظة |
| --- | --- | --- |
| اسم المطعم \* | نص | إجباري |
| تليفون المطعم \* | تليفون | إجباري، وجنبه زرار + لإضافة رقم تاني |
| الدولة | Dropdown | مثال: Italy |
| المدينة / المنطقة | Dropdown | مثال: Roma |
| المنطقة الزمنية | Dropdown | مثال: Europe/Rome |
| المدينة \* | نص | إجباري |
| CAP (الرمز البريدي) | نص | اختياري |
| الشارع والرقم \* | نص | إجباري |

- **الزرار:** Avanti.

**1.2 Posizione (الموقع على الخريطة)**

- الكارت بيقول "عرّف عملاءك موقعك بالظبط".
- خريطة فيها دبوس (Pin) تحرّكه، مع Zoom وStreet View وتبديل Mappa/Satellite.
- لينك "Vuoi cambiare l'indirizzo?" بيرجّعك لشاشة العنوان.

**1.3 Sito web del locale (موقع المطعم)**

- سؤال "عندك موقع على دومين؟" باختيار Si/No.
- لو Si: خانة دومين قبلها www.

**1.4 Seleziona il tipo di Cucina (نوع المطبخ)**

- كروت بصور، كل كارت عليه Checkbox، ومسموح تختار أكتر من نوع.
- الأنواع: Pizza, Burger, Salads, Fast food, Asian, Sandwiches, Mexican, Coffee, Pasta, Sushi, Indian, Chinese, Italian, Thai, Kebab, Breakfast, Japanese, American, Seafood, Fish & Chips, Vietnamese, Greek, Turkish, North Indian, French, Lebanese, Caribbean, Spanish.
- "Mostra di più" بيعرض أنواع أكتر، و"Aggiungi Cucina" تضيف نوع من عندك.
- الأنواع اللي اخترتها بتظهر فوق تحت عنوان "La tua cucina".

**1.5 Conferma dell'account (تأكيد الحساب)**

- رسالة "بعتنالك إيميل على…" مع لينك التفعيل.
- لما يتأكد بيظهر كارت أخضر مكتوب عليه "Confermato".

**العملة واللغة:**

- العملة بتتظبط من شاشة الضرايب (القسم 6).
- لغات واجهة العميل في Altro ← Lingue supportate (القسم 15).

### القسم 2: الخدمات ومواعيدها (Orari di apertura)

كل خدمة ليها شاشة لوحدها فيها سؤال Si/No:

- **Ritiro (استلام):** "بتقدم استلام من المطعم؟" (القيمة هنا: Si)
- **Consegna (توصيل):** خريطة مناطق التوصيل. التفاصيل في القسم 3.
- **Prenotazione tavoli (حجز طاولات):** "بتقبل حجز طاولات؟" (القيمة هنا: No)
  - تحته معاينة لشكل فورم الحجز وجملة "زوّد مبيعاتك".
  - ماقدرتش أشوف إعدادات الحجز التفصيلية، لأنها بتظهر بس لما الخدمة تبقى Si.
- **Sul posto (أكل في المطعم / On-premise):** "بتقدم خدمة في المكان؟" (القيمة هنا: No)

**شاشة Orari di apertura (المواعيد) — "Quando siete aperti?"**

- **Orari di apertura:** المواعيد العامة، مثلاً "Lunedì-Domenica 10:00–22:00"، وجنبها ✏️.
- **"Aggiungi orari":** تضيف فترة تانية في نفس اليوم، زي فترة غدا وفترة عشا.
- **Checkbox "Imposta orari diversi per ritiro e consegna":** لو اتعلّم بيظهر قسم مواعيد منفصل لكل خدمة:
  - مواعيد الاستلام
  - مواعيد التوصيل
  - مواعيد حجز الطاولات (مكتوب جنبها "Attualmente inattivo" لو الخدمة مقفولة)
- **محرر الفترة (لما تدوس ✏️):**
  - Checkboxes للأيام: lun, mar, mer, gio, ven, sab, dom
  - وقت من / وقت لحد (HH:MM)
  - زرارين Salva / Cancella
  - علامة ✕ لحذف الفترة
- **Eccezioni ← "Aggiungi un giorno speciale" (أيام استثنائية):**
  - Nome (25 حرف كحد أقصى)
  - Select date or period (يوم واحد أو فترة)
  - Servizi interessati: Dropdown فيه "Tutti i servizi" أو خدمة معيّنة، وجنبه Toggle **Aperto / Chiuso** (القيمة الافتراضية: Chiuso)
  - Messaggio di notifica: رسالة اختيارية للعميل، 200 حرف كحد أقصى
- **زرار "Pause services":** لإيقاف الخدمات مؤقتاً. ماشفتش هو بيعرض إيه جواه.

### القسم 3: مناطق التوصيل (Consegna — "Dove consegnate?")

**التخطيط:** خريطة كبيرة على الشمال، ولوحة "Zone di consegna" على اليمين.

- **Toggle رئيسي:** لتشغيل التوصيل كله أو قفله.
- **كل منطقة عبارة عن Accordion** بلون مميز، والمناطق بتظهر مرسومة على الخريطة بنفس لونها.

**حقول المنطقة:**

| الحقل | النوع | ملاحظة |
| --- | --- | --- |
| طريقة الرسم | Toggle بين **Circolare** و**Disegna** | Circolare: دايرة تسحب حافتها، والخريطة بتكتب نصف القطر بالميل والكيلومتر (مثال: 1.38 ميل / 2.22 كم). Disegna: Polygon ترسمه بالنقط |
| Color | Color picker + كود Hex |  |
| Nome | نص |  |
| Importo minimo | رقم + العملة | الحد الأدنى للطلب |
| Spese di consegna | رقم + العملة | رسوم التوصيل |

- **"Switch to fee by distance":** يحوّل الرسوم من سعر ثابت لسعر حسب المسافة.
- **أيقونات:** 🗑 لحذف المنطقة، و👁‍🗨 لإخفائها وتعطيلها.
- **أزرار:** Cancella / Salva.
- **مثال من المطعم:**
  - منطقة 1: دايرة، الحد الأدنى 12€، الرسوم 2€
  - منطقة 2: مرسومة باليد، الحد الأدنى 12€، الرسوم 1€
- **"Vuoi aggiungere un'altra zona?":** تضيف منطقة جديدة.

**Impostazioni avanzate (إعدادات توصيل متقدمة):**

- **Consegne fuori dalla tua zona:** Toggle "تقبل طلبات من برّه منطقة التوصيل؟"، ومعاه شرح للمميزات والعيوب.
- **Anagrafica (حقول عنوان العميل في فورم الطلب):**
  - **Predefinito (الافتراضي):** Town/City Area\*، Street name & Number\*، Postcode/Bloc/Intercom/Where to park.
  - **Personalizza (مخصص):** Checkboxes لكل حقل: Town or City Area\*, Street name & Number\*, Postcode/Zipcode\*, Neighbourhood, Bloc, Intercom, Floor, Apartment, Where to park.
- **أزرار:** Salva، وسهم رجوع.

**وقت التوصيل:** مش موجود في شاشة المناطق. بيتظبط في Ordering widget ← Auto-accept orders (القسم 10)، وتقدر تخلي له قيمة مختلفة لكل منطقة.

### القسم 4: طرق الدفع (Modalità di pagamento)

كل طريقة دفع Accordion، وجواه Toggle لكل خدمة (Consegna / Ritiro):

| طريقة الدفع | توصيل | استلام |
| --- | --- | --- |
| Contanti (كاش) | ON | ON |
| Carta — في المطعم أو مع الدليفري | ON | ON |
| Prendi i dati della carta al telefono (بيانات الكارت بالتليفون) | OFF | OFF |

**الدفع أونلاين:**

- خدمة مدفوعة، في Pagamenti ← Fornitori (Providers).
- سؤال "Do you want to take online payments?" باختيار Si/No (القيمة هنا: No).

### القسم 5: الطلب المسبق (Ordini programmati)

- **السؤال الرئيسي:** "تسمح للعميل يختار وقت معيّن؟" باختيار Si/No (القيمة هنا: Si).

**Accordion الاستلام:**

- Preavviso minimo: رقم + وحدة (minuti / ore / giorni). القيمة هنا 30 دقيقة.
- Preavviso massimo: رقم بالأيام. القيمة هنا 1 يوم.

**Accordion التوصيل:**

- نفس حقلي الحد الأدنى والأقصى.
- **Finestra di tempo (ogni):** طول فترة الوقت اللي العميل بيختارها. الاختيارات: 15 دقيقة، 30، 45، ساعة، ساعة ونص، ساعتين، … والقيمة هنا 15 دقيقة.

**Accordion Altro:**

- Toggle "Nascondi 'il prima possibile'": يخفي اختيار "في أقرب وقت" ويسمح بالطلب المسبق بس. القيمة هنا ON.

**لينك:** "How this works outside opening hours".

**شاشة Limit scheduled orders** (في Ordering widget):

- "محتاج تحدد عدد الطلبات المسبقة في كل فترة زمنية؟" باختيار Si/No (القيمة هنا: No).

### القسم 6: الضرايب والرسوم الإضافية

**Imposte — "Iva e valuta"**

- تنبيه: "مسؤوليتك إنك تتأكد من صحة الضريبة والعملة".
- **Imposte di vendita:** Dropdown فيه "I prezzi sono IVA inclusa" (الأسعار شاملة) أو "IVA esclusa" (الضريبة بتتضاف فوق السعر).
- **Nome dell'imposta:** اسم الضريبة اللي بيظهر للعميل، مثلاً Sales Tax.
- **Checkbox "Show 0% tax in order summary":** يعرض سطر الضريبة حتى لو قيمتها 0%.
- **Aliquote fiscali per le voci di menu (فئات ضريبية):** كل فئة Accordion زي "Cibo"، جواها اسم الفئة ونسبة % منفصلة لكل خدمة (Ritiro, Consegna, Nel ristorante). "Aggiungi nuova categoria fiscale" لإضافة فئة، وكل صنف في المنيو بيتربط بفئة ضريبية.
- **Imposte per la consegna:** نسبة % على رسوم التوصيل.
- **Valuta:** Dropdown العملة، مثلاً "EUR - Euro".

**Costi del servizio (رسوم خدمة إضافية)** — في Ordering widget:

- **الاستخدامات اللي الشاشة بتقترحها:** عمولات، خصومات، زيادة في أيام الأجازات، رسوم خدمة.
- **زرار "Aggiungi costo" بيفتح فورم فيه:**
  - الاسم
  - القيمة، مع اختيار **% أو €**
  - Toggle "Soggetto a tassazione" (عليها ضريبة؟)
  - **Applica a:** Totale carrello (parziale) أو Totale Ordine
  - **شرط التطبيق:** Tutti gli Ordini · Ordini ricevuti in determinati giorni · Ordini pagati con metodi di pagamento selezionati · Ordini del tipo selezionato · Tutti gli ordini, ma applica uno sconto in contanti

### القسم 7: محرر المنيو (Menu Setup)

**التخطيط:**

- فوق: زرار أخضر "Anteprima e prova d'ordine" (معاينة وتجربة طلب)، وزرار ⋮، وزرار Avanti.
- الوسط: الأقسام والأصناف.
- اليمين: لوحة "Opzioni e componenti aggiuntivi"، وهي مكتبة مجموعات الإضافات.

**قايمة ⋮ العامة:** Fammi vedere come si fa (شرح بالفيديو) · Cambia la foto del tema (صورة الغلاف) · **Regola i prezzi** (تعديل الأسعار بالجملة).

#### 7.1 الأقسام (Categories)

- كارت لكل قسم فيه صورة واسم ووصف، وتفتحه وتقفله بسهم. السحب بأيقونة ≡ بيغيّر الترتيب.
- **✏️ تعديل في نفس المكان:** Nome categoria (80 حرف كحد أقصى)، Descrizione categoria (150 حرف كحد أقصى)، Cancella / Salva.
- **⋮ قايمة القسم:**
  - Duplica (نسخ) · Elimina (حذف)
  - **Visibilità (الظهور):** Radio بين Nascondi (إخفاء) و**Mostra solo per** (اعرض بس لـ…). ده المكان اللي بتتحدد منه **مواعيد أو خدمات خاصة بقسم**. ماختارتهوش عشان ماغيّرش حاجة، فتفاصيله ماظهرتليش.
  - **Major group:** Dropdown فيه مثلاً Food، ولينك "Manage Groups". ده تجميع أكبر للأقسام، زي Food و Drinks.
- **وسم "Nascondi nel menù":** بادج أصفر بيظهر على القسم أو الصنف المخفي.
- **مجموعات إضافات على مستوى القسم:** بتظهر كـ Chips تحت القسم (مثلاً "Extra ✕")، وكل الأصناف اللي جوه القسم بتورثها. علامة ✕ بتشيل الربط.
- **"Aggiungi \[اسم القسم\]":** تضيف صنف للقسم. **"Aggiungi una categoria":** تضيف قسم جديد.

#### 7.2 الأصناف (Items)

- **الكارت:** صورة، اسم، وصف، سعر (ولو له أحجام بيكتب "da 3,50 EUR").
- **✏️ تعديل في نفس المكان:** Nome (100 حرف كحد أقصى)، Prezzo، Descrizione (300 حرف كحد أقصى)، لينك **"Misura aggiuntiva"** لإضافة حجم، Cancella / Salva.
- **الأحجام (Sizes):** لما تضيف حجم، السعر بيتحوّل لصفوف، وكل صف فيه:
  - Dimensione: اسم الحجم، 80 حرف كحد أقصى. أول صف اسمه "Dimensione più piccola"
  - Prezzo
  - Checkbox **Preselezionato** (الحجم الافتراضي)
  - 🗑 للحذف
  - مثال من المنيو: Patatine piccola 3.50 / grande 4.50
- **⋮ قايمة الصنف:**
  - Duplica / Elimina
  - **Visibilità:** Nascondi أو Mostra solo per
  - **Disponibilità:** **Esaurito** (خلصان / مش متاح) أو Mostra solo per. ده الفرق بين "مخفي" و"مش متاح".
  - **Impostazioni sugli articoli ← Gestisci:** قيم غذائية، حساسية (Allergens)، إضافات غذائية (Additives)، قايمة مكونات، وعلامات زي حار ونباتي.
  - **Categorie di tassazione:** Chip الفئة الضريبية (مثلاً Cibo).
  - **Istruzioni speciali:** Checkbox "Nascondi il campo per le istruzioni speciali" (يخفي خانة ملاحظات العميل)، وCheckbox "Mostra il nome interno sui biglietti per la cucina" (اسم داخلي يتطبع على تذكرة المطبخ).
- **الصور:** صورة لكل صنف ولكل قسم (أيقونة 🖼)، وصورة غلاف للثيم.
- **مجموعات إضافات على مستوى الصنف:** بتظهر كـ Chips تحت الصنف.

#### 7.3 الإضافات (Choices / Addons) — اللوحة اليمين

- **كل مجموعة Accordion** فيها خيارات (اسم + سعر). أمثلة: GUSTO, Extra, OMAGGIO, condimenti, salsa, PIZZA CLASSICHE, LATTINA 33…
- **المجموعة مكتبة مستقلة:** بتسحبها من اللوحة على القسم أو الصنف عشان تربطها، ونفس المجموعة ممكن تتربط بأكتر من مكان.
- **✏️ تعديل المجموعة:**
  - الاسم (80 حرف كحد أقصى، والـ Placeholder "Es. doppia mozzarella")
  - Toggle بين **Opzionale** و**Scelte obbligatorie** (اختياري / إجباري)
  - **Forza il valore minimo:** أقل عدد اختيارات (رقم)
  - **Forza il valore massimo:** أكبر عدد اختيارات (رقم)
  - مثال: مجموعة OMAGGIO إجبارية، أقل 1 وأقصى 1
  - Cancella / Salva
- **⋮ قايمة المجموعة:** Duplica، Elimina، Major group، Categorie di tassazione.
- **✏️ تعديل الخيار:** Nome (80 حرف كحد أقصى)، Prezzo، Checkbox **Pre-selezione** (متعلّم افتراضياً).
- **⋮ قايمة الخيار:** Duplica، Elimina، **Disponibilità** (تخلّي خيار واحد "خلصان")، Istruzioni speciali.
- **"Aggiungi scelta":** تضيف خيار. **"Aggiungi un gruppo":** تضيف مجموعة جديدة.
- **العروض المجمّعة (Combos):** المطعم عاملها كصنف عادي بسعر ثابت (مثلاً "Menù per 2" بـ 22€)، ومربوط بيه مجموعات إجبارية (اختار 2 بيتزا من القايمة + مشروب). الطريقة دي بتعمل "بوكس" من غير ما تحتاج خدمة العروض المدفوعة.

#### 7.4 شكلها عند العميل (من المعاينة)

- نافذة Widget فوقها اسم المطعم وثلاث أيقونات: Menu، Info، Cart.
- **صفحة المنيو:** صورة غلاف، وبعدها الأقسام كعناوين، وكل صنف بسعره، وصورة القسم على الجنب.
- **لما العميل يضغط على صنف:** بيظهر Panel بالمجموعات، وجنب المجموعة الإجبارية مكتوب "(Richiesto)"، وتحت زرار "22,00 € — Aggiungi al carrello".
- **صفحة Info:** خريطة عليها مناطق التوصيل بألوانها، ورسوم كل منطقة والحد الأدنى بتاعها، ومواعيد كل خدمة.
- **صفحة الكارت (Checkout)**، فيها 4 خطوات:
  1. I tuoi dati (بياناتك)
  2. Tipo di ordinazione (نوع الطلب)
  3. Scegli un orario (الوقت)
  4. Modalità di pagamento (الدفع)
- وفيها كمان: خانة تعليقات، و"Inserisci il codice del coupon"، والإجمالي، وزرار "Ordina Adesso"، ولينكات الشروط والخصوصية.

### القسم 8: العروض والكوبونات (Marketing ← Promozioni)

**Le tue promozioni (قايمة العروض)**

- أعمدة: 👁 (معاينة)، Stato (Toggle تشغيل/إيقاف)، Nome، Coupon (كود بيتولّد تلقائي)، Usata (عدد مرات الاستخدام)، Creata (تاريخ الإنشاء)، Associated with.
- ⋮ لكل عرض. أزرار: "Aggiungi Promozione" و"Anteprima".

**أنواع العروض لما تدوس "Aggiungi":**

| النوع | مجاني / مدفوع |
| --- | --- |
| Sconto in % sul carrello — % خصم على الكارت | مجاني |
| % di sconto sui prodotti selezionati — % خصم على أصناف معيّنة | مجاني |
| Consegna gratis — توصيل مجاني أو مخفّض فوق مبلغ معيّن | مجاني |
| Paga 1, ricevi 2 — اشتري صنف وخد التاني | مجاني |
| Sconto in € nel carrello — خصم مبلغ ثابت | مجاني |
| Metodi di pagamento — % خصم لو دفع بطريقة معيّنة | مجاني |
| Ottieni un elemento gratuito — صنف هدية فوق مبلغ معيّن | مجاني |
| Pacchetto Menu — باقة بسعر ثابت | مدفوع ("Vedi dettagli") |
| Compra 2,3 per averne 1 gratis | مدفوع |
| Piatto gratuito/scontato come parte di un pasto | مدفوع |
| Sconto fisso su una combo | مدفوع |
| Sconto in % su una combo | مدفوع |
| Pacchetto Menu specialità | مدفوع |

**محرر العرض** (مثال: % خصم على الكارت). على الشمال معاينة لشكل العرض، وعلى اليمين الإعدادات:

- **Titolo:** 35 حرف كحد أقصى، والقيمة الافتراضية "5% di sconto totale".
- **Descrizione:** 100 حرف كحد أقصى.
- **"Cambia la foto":** تغيير صورة العرض.
- **Sconto:** رقم + %.
- **Importo minimo dell'ordine:** Checkbox "Imposta un valore minimo (consigliato)" + مبلغ.
- **Tipologia cliente:** القيمة الافتراضية "Tutti i clienti, nuovi o ricorrenti".
- **Tipi di ordini:** Radio بين Tutti i tipi و**Personalizza**، وتحته Chips (Ritiro, Consegna).
- **Checkboxes:** Solo per zone di consegna selezionate (مناطق توصيل معيّنة) · Solo per i metodi di pagamento selezionati (طرق دفع معيّنة) · Solo una volta per cliente (مرة واحدة لكل عميل).
- **Marca la promozione come:** القيمة الافتراضية **Cumulabile**، يعني ينفع يتجمع مع عروض تانية.
- **Mostra orario:** القيمة الافتراضية "Mostra sempre ai clienti idonei".
- **Utilizza il codice coupon personalizzato:** كود من عندك، من 4 لـ 20 حرف.
- **"Mostra Impostazioni avanzate"** بيفتح:
  - **Numero limitato:** عدد محدود من مرات الاستخدام
  - **Orario d'ordine:** القيمة الافتراضية "Qualsiasi ora"
  - **Disponibilità della promozione:** فترة صلاحية العرض، القيمة الافتراضية "Qualsiasi ora"
  - **Promozione in evidenza:** Non evidenziare أو Personalizza، وفي Personalizza بيظهر حقل "Il valore del carrello supera: €"

**صفحات تانية في التسويق:**

- **Pre-made promos:** عروض جاهزة بيعملها النظام، زي "15% على أول طلب" بكود.
- **Kickstarter:** Promozione Primo Acquisto (عرض لأول طلب)، وInvite Prospects (سؤال "عندك عملاء أوفلاين عايز تستوردهم؟" عشان تبعتلهم دعوة بالإيميل).
- **Autopilot (مدفوع) ← Le tue campagne:** حملات إيميل جاهزة بزرار Start: Incoraggia il secondo ordine (للعملاء الجداد) · Attira nuovamente i clienti (للعملاء اللي بقالهم فترة ماطلبوش) · Abbandono carrello (لكل العملاء).
- **Website scanner:** فحص الموقع في 5 محاور: التحويل، السرعة، الموبايل، SEO، الأمان.
- **Google business:** يتأكد إن صفحة جوجل بتاعة المطعم بتوجّه لموقعه.
- **Codici QR e volantini:** فلايرز وQR بتتولّد للعروض أو الخدمات، زي "QR للطلب من على الترابيزة"، وفيها "Aggiungi nuovo".

### القسم 9: النشر (Pubblicazione online)

- **Condizioni di vendita (البيانات القانونية):**
  - Ragione sociale\* (اسم الشركة)، عنوان الشركة\*، المدينة\*، CAP\*، الدولة، المنطقة، التليفون\*، Partita IVA / Codice fiscale
  - قسم "Informazioni aggiuntive se richieste dalla legge locale" (بيانات إضافية حسب القانون المحلي)
  - جملة موافقة: لما تدوس Next بتكون وافقت على "Oracle Restaurants eStore Master Agreement"
- **Facebook:** خطوات لإضافة زرار "Order/Book" في صفحة فيسبوك.
- **Smart links:**
  - **Smart Menu Order link:** لينك للطلب، جنبه زرار Copy، ومعمول عشان يتحط في Google Business وInstagram وTikTok وX وYelp وTripAdvisor
  - **Smart Table Reservation link:** بيشتغل لما الحجز يكون مفعّل، وجنبه زرارين "Enable reservations" و"See benefits"
- **Sito web ottimizzato (موقع جاهز):** الشاشة مكتوب فيها "La generazione del sito Web è terminata"، وفيها زرار "Visualizza e modifica sito Web".
- **Bottone Menu (زرار الموقع):**
  - سؤال "عايز تستقبل طلبات من موقعك؟" باختيار Si/No، وتحته معاينة لزرار "Vedi Menu & Ordina".
  - الكود ماظهرليش، لأنه بيظهر بعد ما تختار Si وأنا ماغيّرتش الاختيار.
  - من معرفتي العامة بـ GloriaFood (مش من الشاشة): الكود عبارة عن سطر `<span class="glf-button" data-glf-cuid="…" data-glf-ruid="…">` وبعده `<script src="https://www.fbgcdn.com/embedder/js/ewm2000.js" defer async>`، والسكريبت بيفتح المنيو كـ Overlay فوق صفحة الموقع.
- **Foodbooking App:** سؤال "عايز تروّج للمطعم على تطبيق الموبايل العام Foodbooking؟" باختيار Si/No.
- **App Esclusiva del tuo Locale (مدفوع):** تطبيق خاص باسم المطعم، شاشته الافتتاحية باللوجو، ومعمول للطلبات المتكررة.
- **Pagamenti:** Fornitori (الدفع أونلاين، مدفوع)، وReservation deposit ("تفعّل العربون على الحجز؟" باختيار Si/No، ولينك "How this works?").

### القسم 10: تطبيق استلام الطلبات وإعدادات الطلب

- **Prendendo ordini ← Order Taking App:** "Ti sei connesso all'app" مع بيانات الجهاز: نوعه (Android)، إصدار النظام، الموديل، إصدار التطبيق، وآخر اتصال. ولينك "Connetti con un altro dispositivo" لربط جهاز تاني.
- **Chiamata di avviso:** النظام بيعمل **مكالمة تليفون** لو الطلب ماوصلش التطبيق في الوقت المناسب. زرار "Riproduci la suoneria" يسمّعك صوت المكالمة، وخانة رقم مسؤول الطلبات (اختياري).
- **Ordering widget ← Auto-accept orders:**
  - سؤال القبول التلقائي Si/No. القيمة هنا Si، وعشان كده الطلبات في التقارير حالتها "Auto-accepted".
  - **Tempo di esecuzione di default (وقت التجهيز الافتراضي):** استلام 20 دقيقة، توصيل 35 دقيقة.
  - Checkbox "Imposta tempistiche diverse per le zone di consegna": وقت مختلف لكل منطقة توصيل.
  - لينك "Come funziona con gli ordini programmati…".
- **Opzioni di Completamento:** Radio بين "Default (Nessuna opzione extra al checkout)" و"Opzioni di esposizione minima alla cassa"، والتاني فيه 6 اختيارات زي التوصيل من غير تلامس.
- **hCaptcha:** حماية من السبام. سؤال Si/No، والاتنين كانوا مش متعلّمين.
- **Printing (الطباعة من التطبيق):**
  - **Stampanti:** الجهاز، اسم الطابعة، IP/MAC، طريقة التوصيل (BLUETOOTH)، والقوالب المربوطة (مثلاً Ricevuta del cliente نسخة واحدة بالإيطالي + Cucina essenziale نسخة واحدة).
  - **Modelli (القوالب):** قايمة القوالب ولكل قالب نسخ / تعديل / حذف، وزرار "Add template". محرر القالب فيه معاينة حية للإيصال على الشمال، وأقسام على اليمين كل واحد ليه Toggle وAccordion، وزرار "Reset to default". الأقسام: Preview Options, Ticket holder space, Payment method, Time, Estimated drive time, Direction, Numero in sede, Order details, Client info, Client comment, Items, Pagato, Order online, Contact details, Your info box 1/2/3, Client confirmation.
  - **Storico delle stampe:** التاريخ، رقم الطلب، الحالة (Success)، الطابعة، القالب.

**قبول ورفض الطلب داخل التطبيق:**

- ده بيحصل جوه تطبيق الموبايل نفسه، مش في لوحة الويب، فماشفتهوش.
- من معرفتي العامة بـ GloriaFood (مش من الشاشة): الطلب بيوصل بصوت تنبيه، وصاحب المطعم بيختار Accept مع وقت التجهيز، أو Reject مع سبب. العميل بيوصله التأكيد على صفحة الطلب وبالإيميل. ولو القبول التلقائي شغال، الطلب بيتقبل لوحده بالوقت الافتراضي.

### القسم 11: التقارير (Reports)

**القايمة:**

- Dashboard
- Sales: Trend، Summary
- Menu Insights: Categories، Items
- Online ordering: Website funnel، Clienti، Prenotazioni tavoli، Posizionamento Google، Visite sito web، Area di consegna، Stato della connessione، Promotions Stats
- Elenco: Ordinazioni، Clienti

**تفاصيل كل تقرير:**

- **Dashboard:** فلتر فترة، وكروت فيها:
  - Orders: آخر 7 أيام مع نسبة التغيّر، وإجمالي 3 سنين
  - Reservations
  - Google ranking: ترتيب المطعم لثلاث كلمات بحث
  - Sales: مع متوسط قيمة الطلب ورسم بياني يومي
  - Website visitors
  - Clients: جداد / آخر 7 أيام / 3 سنين
  - بلوك "3 فرص لزيادة مبيعاتك" بأزرار
- **Sales Trend:** View (Total revenue)، وBreakdown، وعرض Chart أو Table، وتجميع Day / Week / Month، و"Show previous period" للمقارنة بالفترة اللي فاتت.
- **Sales Summary:** عرض حسب طريقة الدفع، والأعمدة: عدد الطلبات، Subtotal net وtax، رسوم التوصيل net وtax، Tips، Other fees، Total. ومعاه Export.
- **Menu Insights ← Items:** الصنف، القسم، الكمية، المبيعات قبل الخصم، الخصم، المبيعات بعد الخصم، % من الإجمالي. مع فلاتر وExport.
- **Website funnel:** زيارات ← فتح المنيو ← دخول الـ Checkout ← إرسال الطلب ← تأكيد. وكل خطوة جنبها متوسط المطاعم للمقارنة، ونصيحة لتحسينها.
- **Area di consegna:** خريطة الطلبات بفلتر 24 ساعة / 7 أيام / شهر / 3 شهور.
- **Stato della connessione (Connectivity Health):** نسبة اتصال التطبيق في كل يوم، وخط زمني Online/Offline على 24 ساعة، والنصيحة إنها تفضل فوق 95%.
- **Promotions stats:** Count، وعرض Chart أو Table.
- **Elenco ← Ordinazioni:** أعمدة ID, Placed time, Type, Cliente, Totale, Status. الحالات منها "Auto-accepted". فلاتر، وExport، وطلبات أقدم من 30 يوم، وعدد الصفوف في الصفحة 5–50.
- **Elenco ← Clienti:** Name, Email, Phone, Last order, Total orders, Total spent، مع Export.

### القسم 12: الخدمات المدفوعة وأسعارها

اللوحة بتعرض الخدمات من غير أسعار. الأسعار دي من صفحة الأسعار الرسمية لـ GloriaFood:

- **Online / Credit Card Payment Service:** 29 دولار في الشهر، والفلوس بتروح على حساب المطعم مباشرة.
- **Table Reservation Deposits:** نص دولار على كل ضيف، وبيتحسب بس على الحجوزات المقبولة.
- **Advanced Promo Marketing:** 19 دولار في الشهر.
- **Restaurant POS System:** 49 دولار في الشهر لكل فرع، مع التزام سنتين.
- Sales Optimized Website وBranded Mobile App وAutopilot ظاهرين في اللوحة كخدمات مدفوعة، بس صفحة الأسعار ماكتبتش سعرهم.

الخطة المجانية: طلبات وفروع بلا حد، من غير عمولة ولا اشتراك شهري ولا رسوم تأسيس ولا عقود.

### القسم 13: المستخدمين والصلاحيات

- **مالقيتش أي شاشة لإدارة موظفين أو أدوار وصلاحيات** في لوحة المطعم ولا في لوحة الشريك.
- **الموجود بس:**
  - **Altro ← Notifiche:** "Settings for restaurant staff"، وهي قايمة إيميلات (كان فيها 2) بتوصلها إشعارات الطلبات، وزرار "Aggiungi nuova mail".
  - **"Settings for your food clients":** إشعارات بالإيميل للعميل: Pickup order ready، Delivery order ready، Dine-in order ready.
  - **صلاحية الشريك:** الشريك بيدخل كمدير كامل على أي مطعم تحته.

### القسم 14: الشركاء / Reseller

- اتشرح بالتفصيل في الجزء الأول. الخلاصة إن الشريك عنده: إدارة المطاعم، تقارير مبيعات مجمّعة، عمولات وخصومات على الخدمات المدفوعة، White-label (لوجو، دومين، Imprint، إيميلات)، Leads على الخريطة، ومواد تسويقية.

### القسم 15: حاجات تانية

- **Integrations:**
  - **Catalog:** تكاملات جاهزة بزرار "Aggiungi"، زي FreeOrdy Delivery، Google Tag Manager، Oracle Simphony POS، Otter POS، نظام تتبع دليفري مع Driver App، Spoonity، وغيرهم.
  - **Your integrations:** Status (Toggle)، Name، API Type (مثلاً "Accepted Orders API")، والتفاصيل (Reference/Token، Restaurant key، Email). يعني في **API بيبعت الطلبات المقبولة** لأنظمة خارجية.
  - زرار "Add integration" (Dropdown).
- **Lingue supportate:** 52 لغة لواجهة العميل، كلها مفعّلة هنا، ومنها العربي. وجنب كل لغة لينك "Impostala come lingua predefinita" تخليها اللغة الافتراضية.
- **أعلى اللوحة:** أيقونة دعم، وقايمة المستخدم (Lingua, Termini & Condizioni, Privacy Policy, Esci)، وBreadcrumb "PartnerNet > اسم المطعم".
- **Intercom chat:** فقاعة دعم مباشر تحت على اليمين.

## اللي ماقدرتش أشوفه (عشان ماغيّرش إعدادات)

- إعدادات حجز الطاولات التفصيلية (الخدمة مقفولة)
- تفاصيل "Mostra solo per" للقسم أو الصنف (مواعيد أو خدمات معيّنة)
- كود زرار الموقع الفعلي
- إعدادات "Limit scheduled orders" التفصيلية
- محتوى "Pause services"
- شاشة القبول والرفض جوه تطبيق الموبايل

كل دول بيظهروا بس لما تغيّر Toggle أو Radio.

## المصادر

- [GloriaFood Pricing](https://www.gloriafood.com/pricing)
