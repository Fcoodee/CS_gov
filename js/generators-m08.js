/* مولِّدات المعيار 8 (أنظمة التشغيل): جدولة المعالج واستبدال الصفحات. مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var REF = "ص150";
  function ex(s) { return "`" + s + "`"; }
  function W(w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }
  function fmt(x) { return (Math.round(x * 100) / 100).toString(); }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 80) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }
  /* محاكاة: جميع العمليات تصل عند 0. تعيد زمن الانتظار والإنجاز لكل عملية */
  function runOrder(order, burst) { var t = 0, wait = {}, tat = {}; order.forEach(function (p) { wait[p] = t; t += burst[p]; tat[p] = t; }); return { wait: wait, tat: tat }; }
  function avg(o, names) { return names.reduce(function (s, p) { return s + o[p]; }, 0) / names.length; }
  function rr(burst, names, q) {
    var rem = {}, t = 0, fin = {}, queue = names.slice(); names.forEach(function (p) { rem[p] = burst[p]; });
    while (queue.length) { var p = queue.shift(), d = Math.min(q, rem[p]); t += d; rem[p] -= d; if (rem[p] > 0) queue.push(p); else fin[p] = t; }
    var wait = {}; names.forEach(function (p) { wait[p] = fin[p] - burst[p]; }); return { wait: wait, tat: fin };
  }

  /* 1) متوسط زمن الانتظار */
  G.register("schedwait", { std: 8, ind: 1, lvl: "تطبيق", ref: REF, name: "متوسط زمن الانتظار", gen: function (r) {
    var n = r.pick([3, 4]), names = ["P1", "P2", "P3", "P4"].slice(0, n), burst = {}, used = {}, i;
    for (i = 0; i < n; i++) { var b; do { b = r.int(2, 9); } while (used[b]); used[b] = 1; burst[names[i]] = b; }
    var alg = r.pick(["FCFS", "SJF", "RR"]), q = r.pick([2, 3]);
    var fc = runOrder(names, burst), sj = runOrder(names.slice().sort(function (a, b) { return burst[a] - burst[b]; }), burst), rb = rr(burst, names, q);
    var res = { FCFS: fc, SJF: sj, RR: rb }, okv = avg(res[alg].wait, names), ok = fmt(okv);
    var cands = [];
    ["FCFS", "SJF", "RR"].filter(function (a) { return a !== alg; }).forEach(function (a) { cands.push({ t: fmt(avg(res[a].wait, names)), name: "تطبيق خوارزمية " + a + " بدل " + alg, why: "الخوارزمية المطلوبة " + alg + ".", steps: ["الترتيب/الأسلوب المستخدم هو لـ" + a + ".", "المطلوب " + alg + " فيعطي " + ok + "."] }); });
    cands.push({ t: fmt(avg(res[alg].tat, names)), name: "متوسط زمن الإنجاز بدل الانتظار", why: "الانتظار = الإنجاز − زمن التنفيذ.", steps: ["حُسب زمن الإنجاز (Turnaround).", "زمن الانتظار = الإنجاز − زمن التنفيذ = " + ok + "."] });
    var wl = avg(res[alg].wait, names.slice(0, n - 1)) ; cands.push({ t: fmt(wl), name: "إهمال آخر عملية", why: "يُقسم على عدد كل العمليات.", steps: ["استُبعدت العملية الأخيرة من المتوسط.", "الصحيح " + ok + "."] });
    var ws = pick3(r, ok, cands, function (rr2) { return { t: fmt(okv + rr2.pick([0.5, 1, 1.5, 2, -1])), name: "خطأ في الحساب", why: "ناتج غير مطابق.", steps: ["اجمع أزمنة الانتظار ثم اقسم على عددها.", "الصحيح " + ok + "."] }; }).filter(function (w) { return +w.t > 0; });
    need(ws.length === 3, "neg");
    var bs = names.map(function (p) { return p + "=" + burst[p]; }).join("، ");
    var wl2 = names.map(function (p) { return p + ":" + res[alg].wait[p]; }).join("، ");
    return build({ tpl: "schedwait", ind: 1, lvl: "تطبيق", ref: REF, params: { burst: burst, alg: alg, q: q, names: names },
      stem: "وصلت العمليات " + ex(names.join(", ")) + " معًا عند الزمن 0 وأزمنة تنفيذها (ms): " + ex(bs) + " . ما متوسط زمن الانتظار عند الجدولة بخوارزمية " + (alg === "RR" ? "Round Robin بشريحة زمنية " + q + " ms" : alg === "FCFS" ? "FCFS بترتيب P1 ثم P2…" : "SJF (أقصر مهمة أولًا)") + " (بالـ ms)؟",
      correct: { t: ok, why: "أزمنة الانتظار " + wl2 + " ← المتوسط " + ok + "." },
      wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: [alg === "FCFS" ? "الترتيب: " + names.join(" ← ") + "." : alg === "SJF" ? "الترتيب بالأقصر أولًا: " + names.slice().sort(function (a, b) { return burst[a] - burst[b]; }).join(" ← ") + "." : "نخدم كل عملية " + q + " ms بالتناوب حتى تنتهي.", "زمن الانتظار = لحظة الإنجاز − زمن التنفيذ (مع وصول الجميع عند 0): " + wl2 + ".", "المتوسط = " + ok + " ms."],
      verify: "مجموع أزمنة الانتظار ÷ " + n + " = " + ok + ".", hint: "اكتب ترتيب التنفيذ ثم احسب متى تبدأ كل عملية (للـ RR: متى تنتهي).",
      concept: "الانتظار = بداية التنفيذ − الوصول (أو الإنجاز − التنفيذ − الوصول). SJF يقلل متوسط الانتظار." });
  } });

  /* 2) أخطاء الصفحات FIFO / LRU */
  function faults(ref, F, alg) {
    var fr = [], last = {}, ft = 0, i;
    for (i = 0; i < ref.length; i++) { var p = ref[i];
      if (fr.indexOf(p) < 0) { ft++; if (fr.length < F) fr.push(p); else { if (alg === "FIFO") fr.shift(); else { var lru = fr[0]; fr.forEach(function (x) { if (last[x] < last[lru]) lru = x; }); fr.splice(fr.indexOf(lru), 1); } fr.push(p); } }
      last[p] = i; }
    return ft;
  }
  G.register("pagefault", { std: 8, ind: 1, lvl: "تطبيق", ref: "ص146–148", name: "أخطاء الصفحات", gen: function (r) {
    var L = r.int(8, 11), ref = [], pool = [1, 2, 3, 4, 5], i; for (i = 0; i < L; i++) ref.push(r.pick(pool)); var F = r.pick([3, 3, 4]);
    var alg = r.pick(["FIFO", "LRU"]), other = alg === "FIFO" ? "LRU" : "FIFO", ok = faults(ref, F, alg);
    var distinct = new Set(ref).size, cands = [{ t: String(faults(ref, F, other)), name: "تطبيق " + other + " بدل " + alg, why: "الخوارزمية المطلوبة " + alg + ".", steps: ["الاستبدال حسب " + other + " يعطي نتيجة مختلفة.", "المطلوب " + alg + ": " + ok + "."] },
      { t: String(distinct), name: "عدّ الصفحات المختلفة فقط", why: "الأخطاء تشمل الاستبدال.", steps: ["الأخطاء الإجبارية = عدد الصفحات المختلفة " + distinct + ".", "إضافة أخطاء الاستبدال يعطي " + ok + "."] },
      { t: String(L), name: "اعتبار كل مرجع خطأ", why: "المرجع الموجود في الإطارات ليس خطأ.", steps: ["الصفحة الموجودة في الذاكرة إصابة (Hit).", "الأخطاء " + ok + " من " + L + "."] },
      { t: String(L - ok), name: "عدّ الإصابات", why: "السؤال عن الأخطاء لا الإصابات.", steps: ["الإصابات = " + (L - ok) + ".", "الأخطاء = " + ok + "."] }];
    var ws = pick3(r, String(ok), cands, function (rr2) { return { t: String(ok + rr2.pick([-1, 1, 2])), name: "خطأ في العدّ", why: "عدّ غير مطابق.", steps: ["تتبّع الإطارات مرجعًا بعد مرجع.", "الصحيح " + ok + "."] }; }).filter(function (w) { return +w.t >= 0 && +w.t <= L; });
    need(ws.length === 3, "range");
    return build({ tpl: "pagefault", ind: 1, lvl: "تطبيق", ref: "ص146–148", params: { ref: ref, F: F, alg: alg },
      stem: "سلسلة مراجع الصفحات: " + ex(ref.join(" ")) + " وعدد الإطارات " + F + " (تبدأ فارغة). كم خطأ صفحة (Page Fault) يحدث عند استخدام " + (alg === "FIFO" ? "FIFO (استبدال الأقدم دخولًا)" : "LRU (استبدال الأقل استخدامًا حديثًا)") + "؟",
      correct: { t: String(ok), why: "تتبّع الإطارات يعطي " + ok + " خطأً." }, wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["نبدأ بإطارات فارغة: كل صفحة غير موجودة تُسبّب خطأ.", alg === "FIFO" ? "عند الامتلاء نستبدل أقدم صفحة دخولًا." : "عند الامتلاء نستبدل الصفحة التي لم تُستخدم منذ أطول وقت.", "العدّ النهائي: " + ok + " خطأ."],
      verify: "الأخطاء ≥ عدد الصفحات المختلفة (" + distinct + ") و ≤ " + L + ".", hint: "اكتب الإطارات بعد كل مرجع وعلّم الأخطاء.", concept: "خطأ الصفحة: الصفحة غير موجودة في الذاكرة الرئيسة. FIFO: الأقدم. LRU: الأقل استخدامًا حديثًا." });
  } });
  return G;
});
