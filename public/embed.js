/* Menuto website button. Usage:
   <span class="menuto-button" data-menuto="RESTAURANT-SLUG"></span>
   <script src="https://YOUR-MENUTO-DOMAIN/embed.js" defer></script>
   The button opens the restaurant's ordering page in an overlay on the same website. */
(function () {
  if (window.__menutoEmbed) return;
  window.__menutoEmbed = true;
  var me = document.currentScript || document.querySelector('script[src*="embed.js"]');
  var origin = me ? new URL(me.src, location.href).origin : location.origin;
  var lang = ((navigator.languages && navigator.languages[0]) || navigator.language || "it").slice(0, 2);
  var TEXT = { it: "Vedi il menu e ordina", en: "See menu & order", ar: "اعرض المنيو واطلب" };
  var label = TEXT[lang] || TEXT.it;

  var css = ".menuto-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:14px 26px;font:600 16px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;background:#c4381f;color:#fff;cursor:pointer;box-shadow:0 6px 18px rgba(196,56,31,.35)}" +
    ".menuto-btn:focus-visible{outline:3px solid #1c2017;outline-offset:2px}" +
    ".menuto-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(10,12,8,.55);display:flex;align-items:center;justify-content:center}" +
    ".menuto-frame{width:min(1100px,100vw);height:min(900px,100dvh);border:0;border-radius:16px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.35)}" +
    "@media (max-width:700px){.menuto-frame{width:100vw;height:100dvh;border-radius:0}}" +
    ".menuto-close{position:fixed;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));z-index:2147483647;width:40px;height:40px;border-radius:50%;border:0;background:#1c2017;color:#fff;font:24px/1 system-ui;cursor:pointer}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function open(slug) {
    var ov = document.createElement("div");
    ov.className = "menuto-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    var fr = document.createElement("iframe");
    fr.className = "menuto-frame";
    fr.src = origin + "/r/" + encodeURIComponent(slug) + "?embed=1";
    fr.title = label;
    var x = document.createElement("button");
    x.className = "menuto-close";
    x.setAttribute("aria-label", "×");
    x.textContent = "×";
    function close() { ov.remove(); document.documentElement.style.overflow = prev; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    var prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    x.onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("message", function onMsg(e) {
      if (e.origin === origin && e.data === "menuto:close") { window.removeEventListener("message", onMsg); close(); }
    });
    ov.appendChild(fr);
    ov.appendChild(x);
    document.body.appendChild(ov);
    x.focus();
  }

  function init() {
    var els = document.querySelectorAll("[data-menuto]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__menuto) continue;
      el.__menuto = true;
      var slug = el.getAttribute("data-menuto");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "menuto-btn";
      b.textContent = el.getAttribute("data-label") || label;
      b.onclick = (function (s) { return function () { open(s); }; })(slug);
      el.appendChild(b);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
