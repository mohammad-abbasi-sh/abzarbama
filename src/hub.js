"use strict";
/* Abzarbama hub shell. Expects RouterNS {route} and GeoNS {scoreText, suggestFixes}
   to be defined by earlier script blocks (inlined at build time). */

/* ---------- shared helpers ---------- */
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function copyText(btn, text) {
  const done = () => { btn.textContent = "کپی شد ✓"; setTimeout(() => btn.textContent = "کپی", 1500); };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
}

/* ---------- tabs ---------- */
const TOOL_ORDER = ["router", "geo"];
function showTool(id) {
  TOOL_ORDER.forEach(t => {
    document.getElementById("tab-" + t).classList.toggle("active", t === id);
    document.getElementById("pane-" + t).classList.toggle("active", t === id);
  });
}
TOOL_ORDER.forEach(t => {
  document.getElementById("tab-" + t).onclick = () => showTool(t);
});

/* ---------- hero intent detection ---------- */
const INTENT_RULES = [
  { tool: "geo", kws: ["متن", "مقاله", "محتوا", "سئو", "تحلیل", "نمره", "استناد", "خوانا", "بررسی", "بنویس", "متنم"] },
  { tool: "router", kws: ["قیمت", "بلیط", "خرید", "سرور", "ابزار", "پیدا", "سرویس", "mcp", "نصب", "سکه", "طلا", "دلار", "خودرو", "کتاب", "دکتر", "سفر"] },
];
const TOOL_NAMES = { router: "مسیریاب وب ایران", geo: "تحلیل‌گر GEO فارسی" };
function detectIntent(q) {
  const nq = q.replace(/‌/g, "");
  let best = null, bestScore = 0;
  INTENT_RULES.forEach(r => {
    const s = r.kws.filter(k => nq.includes(k)).length;
    if (s > bestScore) { bestScore = s; best = r.tool; }
  });
  return bestScore > 0 ? best : null;
}
const $hq = document.getElementById("hq");
const $hint = document.getElementById("intent-hint");
function heroGo() {
  const q = $hq.value.trim();
  if (!q) { $hint.innerHTML = "یه چیزی بنویس — مثلاً «قیمت سکه» یا «متنم رو تحلیل کن»."; return; }
  const tool = detectIntent(q);
  if (tool === "geo") {
    showTool("geo");
    document.getElementById("gta").value = q.length > 20 ? q : "";
    $hint.innerHTML = `به نظر میاد کارت با <b>${TOOL_NAMES.geo}</b> راه میفته — بازش کردم 👇`;
    document.getElementById("pane-geo").scrollIntoView({ behavior: "smooth", block: "start" });
    if (q.length > 20) renderGeo();
  } else {
    showTool("router");
    document.getElementById("rq").value = q;
    $hint.innerHTML = tool
      ? `به نظر میاد کارت با <b>${TOOL_NAMES.router}</b> راه میفته — بازش کردم 👇`
      : `مطمئن نیستم کدوم ابزار — حدس می‌زنم <b>${TOOL_NAMES.router}</b>؛ اگه نه، تب اون یکی رو بزن 👇`;
    document.getElementById("pane-router").scrollIntoView({ behavior: "smooth", block: "start" });
    renderRouter();
  }
}
document.getElementById("hgo").onclick = heroGo;
$hq.addEventListener("keydown", e => { if (e.key === "Enter") heroGo(); });
document.querySelectorAll("#hero-chips button").forEach(b => {
  b.onclick = () => { $hq.value = b.textContent; heroGo(); };
});

/* ---------- tool: iran-mcp router ---------- */
const $rq = document.getElementById("rq");
const $rmeta = document.getElementById("rmeta");
const $rresults = document.getElementById("rresults");
const ROUTER_SAMPLES = ["قیمت سکه امامی", "بلیط هواپیما تهران مشهد", "ارزون‌ترین گوشی شیائومی", "نوبت دکتر قلب در تهران"];
const $rchips = document.getElementById("router-chips");
ROUTER_SAMPLES.forEach(s => {
  const b = document.createElement("button");
  b.textContent = s;
  b.onclick = () => { $rq.value = s; renderRouter(); };
  $rchips.appendChild(b);
});
function renderRouter() {
  const q = $rq.value.trim();
  $rresults.innerHTML = "";
  $rmeta.textContent = "";
  if (!q) return;
  let res;
  try { res = RouterNS.route(q, 3); }
  catch (e) { $rresults.innerHTML = '<div class="empty">خطا: ' + escapeHtml(e.message) + "</div>"; return; }
  if (!res.length) {
    $rresults.innerHTML = '<div class="empty">سرور مناسبی پیدا نشد.<br>یه عبارت دیگه امتحان کن — مثلاً «قیمت دلار».</div>';
    return;
  }
  $rmeta.textContent = res.length + " گزینه از بین ۷۱ سرور";
  const maxS = Math.max.apply(null, res.map(r => r.score).concat([1]));
  res.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = (i * 90) + "ms";
    card.innerHTML =
      '<div><span class="rank">' + (i + 1) + "</span><h3>" + escapeHtml(r.title) + "</h3>" +
      '<span class="cat">' + escapeHtml(r.category) + "</span></div>" +
      '<div class="scorebar"><i style="width:' + Math.round(100 * r.score / maxS) + '%"></i></div>' +
      '<div class="desc">' + escapeHtml(r.description) + "</div>" +
      '<div class="row"><span class="lbl">ابزار پیشنهادی</span><code>' + escapeHtml(r.suggested_tool) + "</code></div>" +
      '<div class="row"><span class="lbl">دستور نصب</span><code>' + escapeHtml(r.install) + "</code>" +
      '<button class="copy">کپی</button></div>' +
      '<div class="row"><span class="lbl">ریپو</span><a class="repo" href="' + escapeHtml(r.repo) + '" target="_blank" rel="noopener">' +
      escapeHtml(r.repo.replace("https://github.com/", "")) + "</a></div>" +
      '<div class="reason"><b>چرا این؟</b> ' + escapeHtml(r.reason) + "</div>";
    card.querySelector(".copy").onclick = e => copyText(e.target, r.install);
    $rresults.appendChild(card);
  });
}
document.getElementById("rgo").onclick = renderRouter;
$rq.addEventListener("keydown", e => { if (e.key === "Enter") renderRouter(); });

/* ---------- tool: persian GEO analyzer ---------- */
const GCMAX = { answer_block_quality: 30, self_containment: 25, structural_readability: 20, statistical_density: 15, uniqueness_signals: 10 };
const GCNAMES = { answer_block_quality: "کیفیت بلوک جواب", self_containment: "خودکفایی متن", structural_readability: "خوانایی ساختاری", statistical_density: "چگالی آماری", uniqueness_signals: "سیگنال یکتایی" };
const $gta = document.getElementById("gta");
const $gout = document.getElementById("gout");
const GEO_SAMPLES = {
  "متن ضعیف": "سئو خوب است. همه باید سئو کنند. او این را دوست دارد. آنها هم دوست دارند.",
  "متن متوسط": "سئو یعنی بهینه‌سازی سایت برای موتورهای جستجو. اول تحقیق کلمه کلیدی کنید. دوم محتوای خوب بنویسید. در نهایت نتیجه را بسنجید.",
  "متن قوی": "سئو یعنی بهینه‌سازی وب‌سایت برای موتورهای جستجو. طبق تحقیقات ما در سال ۱۴۰۳، ۷۳٪ کاربران فقط صفحه اول گوگل را می‌بینند و این آمار رسمی نشان می‌دهد سئو حیاتی است. اول: تحقیق کلمه کلیدی. دوم: تولید محتوا. برای مثال، فروش یکی از مشتریان ما ۴۵٪ رشد کرد و به ۲ میلیارد تومان رسید."
};
const $gchips = document.getElementById("geo-chips");
Object.keys(GEO_SAMPLES).forEach(k => {
  const b = document.createElement("button");
  b.textContent = k;
  b.onclick = () => { $gta.value = GEO_SAMPLES[k]; renderGeo(); };
  $gchips.appendChild(b);
});
function renderGeo() {
  const text = $gta.value.trim();
  if (!text) { $gout.innerHTML = ""; return; }
  const r = GeoNS.scoreText(text);
  const fixes = GeoNS.suggestFixes(r);
  let cats = "";
  Object.keys(GCMAX).forEach(k => {
    const v = r.breakdown[k], max = GCMAX[k], pct = Math.round(100 * v / max);
    cats += '<div class="gcat"><div class="row1"><b>' + GCNAMES[k] + "</b><span>" + v + " / " + max + "</span></div>" +
      '<div class="bar' + (pct < 60 ? " low" : "") + '"><i style="width:' + pct + '%"></i></div></div>';
  });
  $gout.innerHTML =
    '<div class="scorehead"><div class="bignum">' + r.total + "<small>/100</small></div>" +
    '<div><span class="grade">درجه ' + r.grade + '</span><div class="glabel">' + escapeHtml(r.label) + " • " + r.wordCount + " کلمه</div></div></div>" +
    cats +
    (fixes.length
      ? '<div class="fixes"><h3>پیشنهادهای بهبود</h3><ul>' + fixes.map(f => "<li>" + escapeHtml(f) + "</li>").join("") + "</ul></div>"
      : '<div class="fixes"><h3>پیشنهادهای بهبود</h3><p class="nofix">متن در وضعیت خوبی است 🎉</p></div>');
}
document.getElementById("ggo").onclick = renderGeo;

/* default tab */
showTool("router");
