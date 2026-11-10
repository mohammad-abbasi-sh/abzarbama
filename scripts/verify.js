// Verify the built hub: execute the two script blocks with a DOM stub.
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log("script blocks:", blocks.length);
if (blocks.length !== 2) { console.error("expected 2 script blocks"); process.exit(1); }

function $(id) {
  return {
    classList: { toggle: function () {} }, onclick: null,
    addEventListener: function () {}, appendChild: function () {},
    querySelector: function () { return { onclick: null }; },
    style: {}, scrollIntoView: function () {}, innerHTML: "", textContent: "",
    value: "", dataset: {}
  };
}
var navigator = { clipboard: null };
var document = {
  getElementById: $,
  createElement: function () { return { style: {}, select: function () {} }; },
  querySelectorAll: function () { return []; },
  body: { appendChild: function () {}, removeChild: function () {} }
};
globalThis.navigator = navigator;
globalThis.document = document;
const geval = (0, eval);
// NOTE: const/function declarations inside indirect eval do not leak in this
// Node version, so each block explicitly exports what the checks need.
geval(blocks[0] + "\n;globalThis.GeoNS = GeoNS;"); // GeoNS
geval(blocks[1] + "\n;globalThis.detectIntent = (typeof detectIntent !== 'undefined') ? detectIntent : null;"); // hub shell (wires stubbed DOM, must not throw)

// geo checks (known-good samples from geo repo)
const g1 = globalThis.GeoNS.scoreText("سئو خوب است. همه باید سئو کنند. او این را دوست دارد. آنها هم دوست دارند.");
console.log("geo weak:", g1.total, g1.grade);
const g2 = globalThis.GeoNS.scoreText("سئو یعنی بهینه‌سازی وب‌سایت برای موتورهای جستجو. طبق تحقیقات ما در سال ۱۴۰۳، ۷۳٪ کاربران فقط صفحه اول گوگل را می‌بینند و این آمار رسمی نشان می‌دهد سئو حیاتی است. اول: تحقیق کلمه کلیدی. دوم: تولید محتوا. برای مثال، فروش یکی از مشتریان ما ۴۵٪ رشد کرد و به ۲ میلیارد تومان رسید.");
console.log("geo strong:", g2.total, g2.grade, "| fixes:", globalThis.GeoNS.suggestFixes(g2).length);

// hub intent detection
let intentOk = true;
try {
  const detectIntent = globalThis.detectIntent;
  if (detectIntent("متنم رو تحلیل کن") !== "geo") { console.error("intent geo fail"); intentOk = false; }
  if (detectIntent("نمره‌ی متنم چنده؟") !== "geo") { console.error("intent score fail"); intentOk = false; }
  if (detectIntent("قیمت سکه امامی") !== null) { console.error("intent non-geo should be null"); intentOk = false; }
} catch (e) { console.error("intent check threw:", e.message); intentOk = false; }
console.log("intent detection:", intentOk ? "OK" : "FAIL");

if (g1.total >= g2.total || !intentOk) {
  console.error("MISMATCH"); process.exit(1);
}
console.log("ALL HUB LOGIC VERIFIED");
