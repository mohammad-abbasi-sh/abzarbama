"use strict";
/* Abzarbama hub shell. Expects GeoNS {scoreText, suggestFixes}
   to be defined by an earlier script block (inlined at build time). */

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
const TOOL_ORDER = ["geo"];
function showTool(id) {
  TOOL_ORDER.forEach(t => {
    const tab = document.getElementById("tab-" + t);
    if (tab) tab.classList.toggle("active", t === id);
    const pane = document.getElementById("pane-" + t);
    if (pane) pane.classList.toggle("active", t === id);
  });
}
TOOL_ORDER.forEach(t => {
  const tab = document.getElementById("tab-" + t);
  if (tab) tab.onclick = () => showTool(t);
});

/* ---------- hero intent detection ---------- */
const INTENT_RULES = [
  { tool: "geo", kws: ["متن", "مقاله", "محتوا", "سئو", "تحلیل", "نمره", "استناد", "خوانا", "بررسی", "بنویس", "متنم"] },
];
const TOOL_NAMES = { geo: "تحلیل‌گر GEO فارسی" };
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
  if (!q) { $hint.innerHTML = "یه چیزی بنویس — مثلاً «متنم رو تحلیل کن»."; return; }
  showTool("geo");
  document.getElementById("gta").value = q.length > 20 ? q : "";
  $hint.innerHTML = `کارت با <b>${TOOL_NAMES.geo}</b> راه میفته — بازش کردم 👇`;
  document.getElementById("pane-geo").scrollIntoView({ behavior: "smooth", block: "start" });
  if (q.length > 20) renderGeo();
}
document.getElementById("hgo").onclick = heroGo;
$hq.addEventListener("keydown", e => { if (e.key === "Enter") heroGo(); });
document.querySelectorAll("#hero-chips button").forEach(b => {
  b.onclick = () => { $hq.value = b.textContent; heroGo(); };
});

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
showTool("geo");
