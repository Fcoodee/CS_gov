/* مولِّدات المعيار 16 (تحليل البيانات): مقاييس النزعة المركزية ودوال إكسل. مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var REF = "ص256";
  function ex(s) { return "`" + s + "`"; }
  function W(w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }
  function lst(a) { return a.join("، "); }
  function fmt(x) { return (Math.round(x * 100) / 100).toString(); }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 80) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  function modes(a) { var c = {}, best = 0; a.forEach(function (x) { c[x] = (c[x] || 0) + 1; best = Math.max(best, c[x]); }); return Object.keys(c).filter(function (k) { return c[k] === best; }).map(Number); }

  /* 1) المتوسط / الوسيط / المنوال / المدى */
  G.register("stats", { std: 16, ind: 2, lvl: "تطبيق", ref: REF, name: "مقاييس إحصائية أساسية", gen: function (r) {
    var n = r.int(5, 8), a, tries = 0, kind = r.pick(["mean", "median", "mode", "range"]);
    do { a = []; for (var i = 0; i < n; i++) a.push(r.int(1, 15)); tries++; } while (tries < 200 && !(modes(a).length === 1 && Math.max.apply(null, a.map(function (x) { return a.filter(function (y) { return y === x; }).length; })) >= 2 && (kind !== "mean" || (sum(a) / n * 100) % 1 === 0 || true) && median(a) !== sum(a) / n));
    need(tries < 200, "data"); var mean = sum(a) / n, med = median(a), mo = modes(a)[0], rg = Math.max.apply(null, a) - Math.min.apply(null, a), ok, nm, cands;
    var sorted = a.slice().sort(function (x, y) { return x - y; });
    var all = { mean: fmt(mean), median: fmt(med), mode: String(mo), range: String(rg) };
    ok = all[kind]; nm = { mean: "المتوسط الحسابي", median: "الوسيط", mode: "المنوال", range: "المدى" }[kind];
    cands = ["mean", "median", "mode", "range"].filter(function (k) { return k !== kind; }).map(function (k) { return { t: all[k], name: "حساب " + { mean: "المتوسط", median: "الوسيط", mode: "المنوال", range: "المدى" }[k] + " بدل " + nm, why: "المطلوب " + nm + ".", steps: ["القيمة تخص " + { mean: "المتوسط", median: "الوسيط", mode: "المنوال", range: "المدى" }[k] + ".", "المطلوب " + nm + " = " + ok + "."] }; });
    if (kind === "median") cands.unshift({ t: fmt(a[Math.floor(n / 2)]), name: "الوسيط دون ترتيب", why: "يجب الترتيب أولًا.", steps: ["الوسيط يُحسب بعد الترتيب التصاعدي.", "المرتبة: " + lst(sorted) + " ← " + ok + "."] });
    var ws = pick3(r, ok, cands, function (rr) { return { t: fmt(+ok + rr.pick([-2, -1, 1, 2, 3])), name: "خطأ حسابي", why: "ناتج غير مطابق.", steps: ["أعد الحساب خطوة بخطوة.", "الصحيح " + ok + "."] }; });
    var steps = { mean: ["المجموع = " + sum(a) + ".", "المتوسط = " + sum(a) + " ÷ " + n + " = " + ok + "."], median: ["نرتّب: " + lst(sorted) + ".", n % 2 ? "العدد فردي فالوسيط هو العنصر الأوسط = " + ok + "." : "العدد زوجي فالوسيط = متوسط العنصرين الأوسطين = " + ok + "."], mode: ["نعدّ تكرار كل قيمة.", "الأكثر تكرارًا هو " + ok + "."], range: ["أكبر قيمة " + Math.max.apply(null, a) + " وأصغر قيمة " + Math.min.apply(null, a) + ".", "المدى = " + Math.max.apply(null, a) + " − " + Math.min.apply(null, a) + " = " + ok + "."] }[kind];
    return build({ tpl: "stats", ind: 2, lvl: "تطبيق", ref: REF, params: { a: a, kind: kind },
      stem: "درجات مجموعة طلاب: " + ex(a.join(", ")) + ". ما " + nm + " لهذه البيانات؟",
      correct: { t: ok, why: steps[steps.length - 1] }, wrongs: ws.map(W), steps: steps,
      verify: kind === "mean" ? "المتوسط بين أصغر قيمة وأكبر قيمة." : kind === "median" ? "نصف القيم أصغر منه أو تساويه." : kind === "mode" ? "تكراره ≥ تكرار أي قيمة أخرى." : "المدى ≥ 0.",
      hint: kind === "median" ? "رتّب البيانات أولًا." : kind === "mode" ? "اعدّ التكرارات." : kind === "mean" ? "اجمع ثم اقسم على العدد." : "أكبر − أصغر.",
      concept: "المتوسط = المجموع ÷ العدد. الوسيط: القيمة الوسطى بعد الترتيب. المنوال: الأكثر تكرارًا. المدى = أكبر − أصغر." });
  } });

  /* 2) دوال إكسل على نطاق */
  G.register("excelfn", { std: 16, ind: 1, lvl: "تطبيق", ref: "ص256", name: "ناتج دالة إكسل", gen: function (r) {
    var n = r.int(5, 7), a = [], i; for (i = 0; i < n; i++) a.push(r.int(1, 30)); var k = r.int(8, 20);
    var fn = r.pick(["SUM", "AVERAGE", "MAX", "MIN", "COUNT", "COUNTIF"]), cells = a.map(function (v, j) { return "A" + (j + 1) + "=" + v; }).join("، "), rng = "A1:A" + n;
    var cnt = a.filter(function (x) { return x > k; }).length, vals = { SUM: sum(a), AVERAGE: sum(a) / n, MAX: Math.max.apply(null, a), MIN: Math.min.apply(null, a), COUNT: n, COUNTIF: cnt };
    need(fn !== "COUNTIF" || (cnt > 0 && cnt < n), "countif"); var ok = fmt(vals[fn]);
    var formula = "=" + fn + "(" + rng + (fn === "COUNTIF" ? ', ">' + k + '"' : "") + ")";
    var cands = [];
    ["SUM", "AVERAGE", "MAX", "MIN", "COUNT"].filter(function (f) { return f !== fn; }).forEach(function (f) { cands.push({ t: fmt(vals[f]), name: "دالة " + f + " بدل " + fn, why: "الدالة المطلوبة " + fn + ".", steps: ["القيمة تخص الدالة " + f + ".", "المطلوب " + fn + " = " + ok + "."] }); });
    if (fn === "COUNTIF") cands.unshift({ t: String(a.filter(function (x) { return x >= k; }).length), name: "استعمال ≥ بدل >", why: "الشرط أكبر تمامًا.", steps: ["الشرط >" + k + " لا يشمل " + k + ".", "الصحيح " + ok + "."] });
    var ws = pick3(r, ok, cands, function (rr) { return { t: fmt(+ok + rr.pick([-2, -1, 1, 2])), name: "خطأ حسابي", why: "ناتج غير مطابق.", steps: ["أعد الحساب.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "excelfn", ind: 1, lvl: "تطبيق", ref: "ص256", params: { a: a, fn: fn, k: k },
      stem: "الخلايا " + cells + ". ما ناتج الصيغة " + ex(formula) + "؟",
      correct: { t: ok, why: fn + " على القيم " + a.join(", ") + " = " + ok + "." }, wrongs: ws.map(W),
      steps: ["نقرأ قيم النطاق " + rng + ": " + a.join(", ") + ".", fn === "COUNTIF" ? "نعدّ القيم الأكبر من " + k + " فقط." : "نطبّق " + fn + " على كل القيم.", "الناتج = " + ok + "."],
      verify: fn === "AVERAGE" ? "المتوسط = المجموع ÷ " + n + "." : "أعد تطبيق الدالة يدويًا.", hint: "اكتب القيم ثم طبّق الدالة.", concept: "SUM جمع، AVERAGE متوسط، MAX/MIN أكبر/أصغر، COUNT يعدّ الأرقام، COUNTIF يعدّ ما يحقق شرطًا." });
  } });
  return G;
});
