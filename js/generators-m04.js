/* مولِّدات المعيار 4 (الشبكات). الأسئلة مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var REF = "ص50–51", REF1 = "ص41–42";
  function ip(a) { return a.join("."); }
  function cls(o) { return o < 128 ? "A" : o < 192 ? "B" : o < 224 ? "C" : o < 240 ? "D" : "E"; }
  function ex(s) { return "`" + s + "`"; }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 50) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }

  /* 1) فئة عنوان IP */
  G.register("ipclass", { std: 4, ind: 5, lvl: "تطبيق", ref: REF, name: "فئة عنوان IP", gen: function (r) {
    var firsts = [r.int(1, 126), r.int(128, 191), r.int(192, 223), r.int(224, 239)];
    var o = r.pick(firsts), a = [o, r.int(0, 255), r.int(0, 255), r.int(1, 254)], c = cls(o);
    var names = { A: "الأولى 1–126", B: "128–191", C: "192–223", D: "224–239" };
    var rng = { A: "1–126", B: "128–191", C: "192–223", D: "224–239" };
    var others = ["A", "B", "C", "D"].filter(function (x) { return x !== c; });
    var wr = r.shuffle(others).slice(0, 3);
    return build({ tpl: "ipclass", ind: 5, lvl: "تطبيق", ref: REF, params: { a: a },
      stem: "ما فئة عنوان IP التالي: " + ex(ip(a)) + " ؟",
      correct: { t: "الفئة " + c, why: "البايت الأول " + o + " يقع ضمن مدى الفئة " + c + " (" + rng[c] + ")." },
      wrongs: wr.map(function (w) { return { t: "الفئة " + w, name: "اختيار نطاق خاطئ", why: "مدى الفئة " + w + " هو " + rng[w] + " والبايت الأول " + o + " خارجه.",
        steps: ["البايت الأول = " + o + ".", "مدى الفئة " + w + " هو " + rng[w] + " فلا يشمله.", "الصحيح: الفئة " + c + " (" + rng[c] + ")."] }; }),
      steps: ["الفئة تتحدد بالبايت الأول فقط: " + o + ".", "A: 1–126، B: 128–191، C: 192–223، D: 224–239.", "إذن الفئة " + c + "."],
      verify: "127 محجوز للاسترجاع (Loopback) فلا يُعدّ فئة شبكة عادية.",
      hint: "أي بايت من العنوان يحدد الفئة؟ وما المدى الذي يقع فيه؟",
      concept: "فئات IPv4: A (1–126)، B (128–191)، C (192–223)، D (224–239 بث متعدد)." });
  } });

  /* 2) عنوان الشبكة من العنوان والقناع (حدود بايت و/أو CIDR بين 8 و30) */
  G.register("netaddr", { std: 4, ind: 5, lvl: "تطبيق", ref: REF, name: "عنوان الشبكة", gen: function (r) {
    var p = r.pick([8, 16, 24, 20, 22, 25, 26, 27, 28]);
    var a = [r.pick([10, 172, 192, 100, 130]), r.int(1, 254), r.int(1, 254), r.int(1, 254)];
    var m = [0, 0, 0, 0]; for (var i = 0; i < 4; i++) { var b = Math.max(0, Math.min(8, p - 8 * i)); m[i] = b ? (256 - (1 << (8 - b))) : 0; }
    var net = a.map(function (v, i) { return v & m[i]; });
    var ok = ip(net), cs = function (x) { return { t: ip(x) }; };
    var host = a.map(function (v, i) { return v & (255 - m[i]); });
    var cands = [
      { t: ip(a.map(function (v, i) { return m[i] === 255 ? v : 0; })), name: "تصفير كل بايت غير مكتمل", why: "صُفّر البايت الجزئي بدل تطبيق AND على بتاته.",
        steps: ["البايتات ذات القناع 255 تبقى كما هي.", "البايت الجزئي يُحسب بـ AND مع القناع لا بتصفيره كاملًا.", "الصحيح " + ok + "."] },
      { t: ip(a.map(function (v, i) { return m[i] === 0 ? 255 : v; })), name: "ملء الجزء الخاص بالأجهزة بـ 255", why: "هذا عنوان البث لا عنوان الشبكة.",
        steps: ["وُضعت 255 في بايتات المضيف.", "عنوان الشبكة يصفّر بتات المضيف.", "الصحيح " + ok + "."] },
      { t: ip(a.map(function (v, i) { return m[i] === 0 ? v : v; })), name: "إعادة العنوان نفسه", why: "لم يُطبَّق القناع.", steps: ["أُعيد العنوان كما هو.", "AND مع القناع يصفّر بتات المضيف.", "الصحيح " + ok + "."] },
      { t: ip(a.map(function (v, i) { return m[i] === 255 ? v : (m[i] === 0 ? 0 : (v | (255 - m[i]))); })), name: "OR بدل AND", why: "استُعملت OR مع مكمّل القناع.", steps: ["الشبكة تُستخرج بـ AND وليس OR.", "OR يملأ بتات المضيف بـ 1.", "الصحيح " + ok + "."] }
    ];
    cands = cands.filter(function (c) { return c.t !== ok && c.t !== ip(a) || c.name === "إعادة العنوان نفسه" && c.t !== ok; });
    var ws = pick3(r, ok, cands, function (rr) { var x = net.slice(); var k = rr.int(0, 3); x[k] = (x[k] + rr.int(1, 3)) % 256; return { t: ip(x), name: "حساب خاطئ لبايت", why: "إزاحة في أحد البايتات.", steps: ["اختلف أحد البايتات عن AND الصحيح.", "الصحيح " + ok + "."] }; });
    var mask = ip(m);
    return build({ tpl: "netaddr", ind: 5, lvl: "تطبيق", ref: REF, params: { a: a, p: p },
      stem: "عنوان IP للجهاز " + ex(ip(a)) + " وقناع الشبكة الفرعية " + ex(mask) + " (أي /" + p + "). ما عنوان الشبكة؟",
      correct: { t: ok, why: "AND بين العنوان والقناع بايتًا بايتًا." },
      wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["القناع " + mask + " = " + p + " بتًّا واحدًا من اليسار.", "نطبّق AND بايتًا بايتًا بين العنوان والقناع.", "الناتج " + ok + "."],
      verify: "تحقق: بتات المضيف في الناتج كلها 0، وعدد المضيفين = 2^" + (32 - p) + " − 2 = " + (Math.pow(2, 32 - p) - 2) + ".",
      hint: "ما العملية المنطقية التي تستخرج جزء الشبكة؟ وماذا يحدث للبايت الذي قناعه أقل من 255؟",
      concept: "عنوان الشبكة = IP AND Mask." });
  } });

  /* 3) عدد المضيفين */
  G.register("hostcount", { std: 4, ind: 5, lvl: "تطبيق", ref: REF, name: "عدد المضيفين", gen: function (r) {
    var p = r.int(20, 29), h = 32 - p, n = Math.pow(2, h) - 2;
    var cands = [
      { t: String(n + 2), name: "نسيان عنواني الشبكة والبث", why: "لم يُطرح عنوان الشبكة وعنوان البث.", steps: ["2^" + h + " = " + (n + 2) + " عنوانًا إجمالًا.", "عنوان الشبكة وعنوان البث لا يُعيَّنان لأجهزة.", "الصحيح " + n + "."] },
      { t: String(n + 1), name: "طرح عنوان واحد فقط", why: "طُرح عنوان واحد بدل اثنين.", steps: ["الإجمالي " + (n + 2) + ".", "يُطرح عنوانان لا واحد.", "الصحيح " + n + "."] },
      { t: String(Math.pow(2, p) - 2), name: "الأس من بتات الشبكة", why: "استُعمل عدد بتات الشبكة p بدل بتات المضيف.", steps: ["الأس يخص بتات المضيف = 32 − " + p + " = " + h + ".", "لا بتات الشبكة.", "الصحيح " + n + "."] },
      { t: String(h * 2 - 2), name: "ضرب بدل الأس", why: "ضُرب عدد البتات بدل رفع 2 إليه.", steps: ["العدد = 2^h وليس 2×h.", "الصحيح " + n + "."] }
    ];
    var ws = pick3(r, String(n), cands, function (rr) { var v = n + rr.pick([-4, 4, 6, -6, 8, -8]); return { t: String(v), name: "خطأ حسابي", why: "حساب عددي خاطئ.", steps: ["الصحيح 2^" + h + " − 2 = " + n + "."] .concat(["الناتج المقترح لا يطابق هذه المعادلة."]) }; });
    return build({ tpl: "hostcount", ind: 5, lvl: "تطبيق", ref: REF, params: { p: p },
      stem: "شبكة قناعها /" + p + ". كم جهازًا (مضيفًا) يمكن عنونته فيها؟",
      correct: { t: String(n), why: "2^" + h + " − 2 = " + n + "." },
      wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["بتات المضيف = 32 − " + p + " = " + h + ".", "إجمالي العناوين = 2^" + h + " = " + (n + 2) + ".", "نطرح عنوان الشبكة وعنوان البث: " + n + "."],
      verify: "تحقق: p=24 يعطي 254، وهو المعروف للفئة C.",
      hint: "كم بتًّا يبقى للأجهزة؟ وأي عنوانين محجوزان؟",
      concept: "المضيفون = 2^(32−p) − 2." });
  } });

  /* 4) عدد الوصلات حسب التخطيط */
  G.register("topolinks", { std: 4, ind: 1, lvl: "تطبيق", ref: REF1, name: "عدد الوصلات", gen: function (r) {
    var t = r.pick(["mesh", "star", "ring", "bus"]), n = r.int(4, 10);
    var nm = { mesh: "الشبكية الكاملة", star: "النجمية", ring: "الحلقية", bus: "الخطية (الناقل)" };
    var val = { mesh: n * (n - 1) / 2, star: n, ring: n, bus: n };
    var unit = { mesh: "وصلة", star: "وصلة", ring: "وصلة", bus: "وصلة توصيل بالناقل" };
    var ok = val[t];
    var why = { mesh: "كل جهازين بينهما وصلة: n(n−1)/2.", star: "وصلة واحدة لكل جهاز إلى المركز: n.", ring: "كل جهاز يتصل بجاره وتُغلق الحلقة: n.", bus: "كل جهاز يتصل بالناقل بوصلة: n." };
    var cands = [
      { t: String(n * (n - 1)), name: "نسيان القسمة على 2", why: "حُسبت الوصلة مرتين.", steps: ["n(n−1) يعدّ كل وصلة مرتين.", "القسمة على 2 تعطي " + (n * (n - 1) / 2) + "."] },
      { t: String(n - 1), name: "n−1 بدل n", why: "اعتُبرت السلسلة المفتوحة.", steps: ["الحلقة تغلق بوصلة إضافية؛ النجمة وصلة لكل طرف.", "الصحيح " + ok + " لهذا التخطيط."] },
      { t: String(n + 1), name: "إضافة وصلة", why: "أُضيفت وصلة لا وجود لها.", steps: ["لا وصلة زائدة عن " + ok + "."] },
      { t: String(n * n), name: "n²", why: "ضُرب n في نفسه.", steps: ["n² يعدّ حتى الوصلة بالنفس.", "الصحيح " + ok + "."] },
      { t: String(Math.floor(n / 2)), name: "نصف الأجهزة", why: "خلط مع عدد الأزواج.", steps: ["لا علاقة لعدد الوصلات بنصف الأجهزة.", "الصحيح " + ok + "."] }
    ];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(ok + rr.pick([2, 3, 5, 7])), name: "حساب خاطئ", why: "ناتج لا يوافق القاعدة.", steps: ["القاعدة: " + why[t], "الصحيح " + ok + "."] }; });
    return build({ tpl: "topolinks", ind: 1, lvl: "تطبيق", ref: REF1, params: { t: t, n: n },
      stem: "في الشبكة " + nm[t] + " التي تضم " + n + " أجهزة، كم عدد " + (t === "bus" ? "وصلات توصيل الأجهزة بالناقل" : "الوصلات (الكابلات)") + "؟",
      correct: { t: String(ok), why: why[t] },
      wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["التخطيط: " + nm[t] + ".", "القاعدة: " + why[t], "n = " + n + " ← " + ok + "."],
      verify: "تحقق من قيمة صغيرة: n=4 في الشبكية الكاملة تعطي 6 وصلات.",
      hint: "كيف يتصل الجهاز بغيره في هذا التخطيط؟",
      concept: "الشبكية الكاملة n(n−1)/2؛ النجمية والحلقية والخطية n." });
  } });
  return G;
});
